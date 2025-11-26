import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Usuario, RolUsuario, TipoUsuario } from '../entities/usuario.entity';
import { Zona } from '../entities/zona.entity';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

interface ImportResult {
  total: number;
  exitosos: number;
  errores: Array<{
    linea: number;
    nombre: string;
    error: string;
  }>;
  nuevosUsuarios: Usuario[];
}

interface CSVRow {
  NOMBRE: string;
  USUARIO: string;
  LOCA01: string;
  CP01: string;
  ZONA: string;
  DIRE01: string;
  DIRE02: string;
  WHATSAPP: string;
  TELEFONO: string;
  ORDEN: string;
  TIPO: string;
  CUIT: string;
  EMAIL: string;
  PADRON: string;
}

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Zona)
    private zonasRepository: Repository<Zona>,
    private dataSource: DataSource,
  ) {}

  async importarCSV(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      total: 0,
      exitosos: 0,
      errores: [],
      nuevosUsuarios: [],
    };

    // Parsear CSV
    const rows: CSVRow[] = await this.parseCSV(fileBuffer);
    result.total = rows.length;

    console.log(`📊 Procesando ${rows.length} registros del CSV...`);

    // Obtener todas las zonas para mapeo
    const zonasMap = await this.getZonasMap();

    // Procesar en lotes con transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNumber = i + 2; // +2 porque incluye header y empieza en 1

        try {
          // Validar y limpiar datos
          const usuarioData = await this.mapCSVRowToUsuario(row, zonasMap);
          
          // Verificar si el padrón ya existe
          const existe = await this.usuariosRepository.findOne({
            where: { padron: usuarioData.padron },
          });

          if (existe) {
            result.errores.push({
              linea: lineNumber,
              nombre: row.NOMBRE,
              error: `Padrón ${usuarioData.padron} ya existe`,
            });
            continue;
          }

          // Crear usuario
          const usuario = queryRunner.manager.create(Usuario, usuarioData);
          const savedUsuario = await queryRunner.manager.save(usuario);
          
          result.nuevosUsuarios.push(savedUsuario);
          result.exitosos++;

          // Log cada 100 registros
          if ((i + 1) % 100 === 0) {
            console.log(`✅ Procesados ${i + 1}/${rows.length} registros...`);
          }

        } catch (error) {
          result.errores.push({
            linea: lineNumber,
            nombre: row.NOMBRE || 'Sin nombre',
            error: error.message,
          });
        }
      }

      await queryRunner.commitTransaction();
      console.log(`🎉 Importación completada: ${result.exitosos}/${result.total} exitosos`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Error en la transacción: ${error.message}`);
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async parseCSV(buffer: Buffer): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CSVRow[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csvParser({ separator: ';' })) // Usar ; como separador según tu CSV
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve(rows);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async getZonasMap(): Promise<Map<string, Zona>> {
    const zonas = await this.zonasRepository.find();
    const map = new Map<string, Zona>();
    
    // Mapear por valor de zona
    zonas.forEach(zona => {
      map.set(zona.valor.toString(), zona);
    });

    return map;
  }

  private async mapCSVRowToUsuario(row: CSVRow, zonasMap: Map<string, Zona>): Promise<Partial<Usuario>> {
    // Validar datos mínimos
    if (!row.NOMBRE || row.NOMBRE.trim() === '') {
      throw new Error('Nombre es requerido');
    }

    if (!row.ZONA || row.ZONA.trim() === '') {
      throw new Error('Zona es requerida');
    }

    if (!row.PADRON || row.PADRON.trim() === '') {
      throw new Error('Padrón es requerido');
    }

    // Buscar zona
    const zona = zonasMap.get(row.ZONA.trim());
    if (!zona) {
      throw new Error(`Zona ${row.ZONA} no encontrada`);
    }

    // Formatear padrón (convertir 100044 a 10-0044)
    const padronOriginal = row.PADRON.trim();
    let padronFormateado: string;
    
    if (padronOriginal.includes('-')) {
      padronFormateado = padronOriginal;
    } else {
      // Extraer zona y número del padrón (ej: "100044" -> "10-0044")
      const zonaStr = row.ZONA.trim();
      const numeroUsuario = padronOriginal.slice(zonaStr.length);
      padronFormateado = `${zonaStr}-${numeroUsuario.padStart(4, '0')}`;
    }

    // Mapear tipo de usuario
    let tipo: TipoUsuario = TipoUsuario.PARTICULARES;
    const tipoStr = row.TIPO?.trim().toLowerCase();
    if (tipoStr === '1' || tipoStr === 'entidad pública' || tipoStr === 'entidad publica' || tipoStr === 'publico') {
      tipo = TipoUsuario.ENTIDAD_PUBLICA;
    }

    // Limpiar dirección
    const direccion = row.DIRE01 
      ? row.DIRE01.trim() + (row.DIRE02 ? ' ' + row.DIRE02.trim() : '')
      : 'Sin dirección';

    return {
      nombre: row.NOMBRE.trim(),
      direccion: direccion,
      zona: zona,
      padron: padronFormateado,
      rol: RolUsuario.CLIENTE,
      tipo: tipo,
      localidad: row.LOCA01?.trim() || null,
      codigoPosta: row.CP01?.trim() || null,
      whatsapp: row.WHATSAPP?.trim() || null,
      telefono: row.TELEFONO?.trim() || null,
      cuit: row.CUIT?.trim() || null,
      email: row.EMAIL?.trim() || null,
      password: null, // Los clientes no tienen contraseña
    };
  }

  async previewCSV(fileBuffer: Buffer, limit: number = 10): Promise<any[]> {
    const rows = await this.parseCSV(fileBuffer);
    return rows.slice(0, limit);
  }
}

