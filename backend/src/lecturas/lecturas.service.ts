import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lectura } from '../entities/lectura.entity';
import { Medidor } from '../entities/medidor.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TipoAccionAuditoria } from '../entities/auditoria-registro.entity';

@Injectable()
export class LecturasService {
  constructor(
    @InjectRepository(Lectura)
    private lecturasRepository: Repository<Lectura>,
    @InjectRepository(Medidor)
    private medidoresRepository: Repository<Medidor>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async findAll(): Promise<Lectura[]> {
    return this.lecturasRepository.find({
      relations: ['medidor', 'operario'],
    });
  }

  async findByMedidor(medidorId: number): Promise<Lectura[]> {
    return this.lecturasRepository.find({
      where: { medidor: { id: medidorId } },
      relations: ['medidor', 'operario'],
      order: { fechaLectura: 'DESC' },
    });
  }

  async findUltimaLectura(medidorId: number): Promise<Lectura | null> {
    return this.lecturasRepository.findOne({
      where: { medidor: { id: medidorId } },
      relations: ['medidor'],
      order: { fechaLectura: 'DESC' },
    });
  }

  async create(lecturaData: any, actorId?: number): Promise<Lectura> {
    const medidor = await this.medidoresRepository.findOne({
      where: { id: lecturaData.medidorId },
      relations: ['usuario'],
    });

    if (!medidor) {
      throw new NotFoundException(`Medidor no encontrado`);
    }

    // Obtener última lectura
    const ultimaLectura = await this.findUltimaLectura(medidor.id);
    const lecturaAnterior = ultimaLectura ? ultimaLectura.lecturaActual : medidor.lecturaInicial;

    // Validar que la lectura actual sea mayor a la anterior
    if (lecturaData.lecturaActual < lecturaAnterior) {
      throw new BadRequestException('La lectura actual no puede ser menor a la anterior');
    }

    // Calcular consumo en m3
    const consumoM3 = lecturaData.lecturaActual - lecturaAnterior;

    const lectura = this.lecturasRepository.create({
      ...lecturaData,
      medidor,
      lecturaAnterior,
      consumoM3,
      fechaLectura: new Date(),
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
    });

    const saved = await this.lecturasRepository.save(lectura) as unknown as Lectura;

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'lecturas',
      entidad: 'Lectura',
      registroId: saved.id,
      accion: TipoAccionAuditoria.CREACION,
      descripcion: `Carga de lectura para el medidor ${medidor.id}`,
      datosNuevos: this.sanitizarObjeto({
        medidorId: medidor.id,
        lecturaAnterior,
        lecturaActual: saved.lecturaActual,
        consumoM3: saved.consumoM3,
        mes: saved.mes,
        anio: saved.anio,
      }),
      metadata: {
        usuarioClienteId: medidor.usuario?.id,
        padron: medidor.usuario?.padron,
      },
    });

    return saved;
  }

  async findOne(id: number): Promise<Lectura> {
    const lectura = await this.lecturasRepository.findOne({
      where: { id },
      relations: ['medidor', 'operario'],
    });
    
    if (!lectura) {
      throw new NotFoundException(`Lectura con ID ${id} no encontrada`);
    }
    
    return lectura;
  }

  async update(
    id: number,
    lecturaData: Partial<Lectura>,
    actorId?: number,
  ): Promise<Lectura> {
    const lectura = await this.findOne(id);
    const datosPrevios = this.extraerPrevios(lectura, lecturaData);
    
    if (lecturaData.lecturaActual && lectura.lecturaAnterior) {
      lecturaData.consumoM3 = lecturaData.lecturaActual - lectura.lecturaAnterior;
    }
    
    Object.assign(lectura, lecturaData);
    const updated = await this.lecturasRepository.save(lectura);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'lecturas',
      entidad: 'Lectura',
      registroId: updated.id,
      accion: TipoAccionAuditoria.ACTUALIZACION,
      descripcion: 'Edición manual de lectura registrada',
      datosPrevios,
      datosNuevos: this.sanitizarObjeto(lecturaData),
      metadata: {
        medidorId: lectura.medidor?.id,
        usuarioClienteId: lectura.medidor?.usuario?.id,
      },
    });

    return updated;
  }

  async delete(id: number, actorId?: number): Promise<void> {
    const lectura = await this.findOne(id);
    await this.lecturasRepository.remove(lectura);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'lecturas',
      entidad: 'Lectura',
      registroId: lectura.id,
      accion: TipoAccionAuditoria.ELIMINACION,
      descripcion: 'Eliminación manual de lectura registrada',
      datosPrevios: this.sanitizarObjeto({
        medidorId: lectura.medidor?.id,
        lecturaAnterior: lectura.lecturaAnterior,
        lecturaActual: lectura.lecturaActual,
        consumoM3: lectura.consumoM3,
        mes: lectura.mes,
        anio: lectura.anio,
      }),
      metadata: {
        medidorId: lectura.medidor?.id,
        usuarioClienteId: lectura.medidor?.usuario?.id,
      },
    });
  }

  private extraerPrevios(
    lectura: Lectura,
    cambios: Partial<Lectura>,
  ): Record<string, any> | null {
    if (!cambios) {
      return null;
    }

    const previos = Object.entries(cambios).reduce((acc, [key, value]) => {
      if (typeof value === 'undefined') {
        return acc;
      }
      acc[key] = (lectura as any)[key];
      return acc;
    }, {} as Record<string, any>);

    return Object.keys(previos).length ? previos : null;
  }

  private sanitizarObjeto(
    data: Record<string, any> | null | undefined,
  ): Record<string, any> | null {
    if (!data) {
      return null;
    }

    const limpio = Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === 'undefined') {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

    return Object.keys(limpio).length ? limpio : null;
  }
}

