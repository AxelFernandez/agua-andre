import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Zona } from '../entities/zona.entity';
import * as bcrypt from 'bcrypt';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TipoAccionAuditoria } from '../entities/auditoria-registro.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Zona)
    private zonasRepository: Repository<Zona>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async findAll(): Promise<Usuario[]> {
    const usuarios = await this.usuariosRepository.find({
      relations: ['zona', 'medidores'],
    });
    
    // Agregar medidor activo como propiedad virtual
    return usuarios.map(usuario => this.addMedidorActivo(usuario));
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: ['zona', 'medidores', 'boletas'],
    });
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    return this.addMedidorActivo(usuario);
  }

  async findByPadron(padron: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { padron },
      relations: ['zona', 'medidores'],
    });
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con padrón ${padron} no encontrado`);
    }
    
    return this.addMedidorActivo(usuario);
  }

  // Helper para agregar el medidor activo como propiedad virtual
  private addMedidorActivo(usuario: any): any {
    if (usuario.medidores && usuario.medidores.length > 0) {
      // Encontrar el medidor activo
      const medidorActivo = usuario.medidores.find((m: any) => m.activo === true);
      usuario.medidor = medidorActivo || null;
    } else {
      usuario.medidor = null;
    }
    return usuario;
  }

  async create(usuarioData: Partial<Usuario>, actorId?: number): Promise<Usuario> {
    // Generar padrón SOLO para clientes (no para admin/operario)
    if (usuarioData.rol === 'cliente' && !usuarioData.padron && usuarioData.zona) {
      const zona = await this.zonasRepository.findOne({
        where: { id: usuarioData.zona.id },
      });
      
      if (zona) {
        const ultimoUsuario = await this.usuariosRepository
          .createQueryBuilder('usuario')
          .where('usuario.padron LIKE :patron', { patron: `${zona.valor}-%` })
          .orderBy('usuario.id', 'DESC')
          .getOne();
        
        let siguienteNumero = 1;
        if (ultimoUsuario && ultimoUsuario.padron) {
          const partes = ultimoUsuario.padron.split('-');
          siguienteNumero = parseInt(partes[1]) + 1;
        }
        
        // Formato: ZONA-ID (ej: "10-0001", "10-0036")
        usuarioData.padron = `${zona.valor}-${siguienteNumero.toString().padStart(4, '0')}`;
      }
    }

    // Hashear contraseña si se proporciona
    if (usuarioData.password) {
      usuarioData.password = await bcrypt.hash(usuarioData.password, 10);
    }

    const usuario = this.usuariosRepository.create(usuarioData);
    const creado = await this.usuariosRepository.save(usuario);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'usuarios',
      entidad: 'Usuario',
      registroId: creado.id,
      accion: TipoAccionAuditoria.CREACION,
      descripcion: 'Creación de usuario',
      datosNuevos: this.sanitizarObjeto({
        id: creado.id,
        nombre: creado.nombre,
        email: creado.email,
        padron: creado.padron,
        rol: creado.rol,
        zonaId: creado.zona?.id,
      }),
    });

    return creado;
  }

  async update(id: number, usuarioData: Partial<Usuario>, actorId?: number): Promise<Usuario> {
    const usuario = await this.findOne(id);
    const datosPrevios = this.sanitizarObjeto({
      nombre: usuario.nombre,
      email: usuario.email,
      padron: usuario.padron,
      rol: usuario.rol,
      zonaId: (usuario as any).zona?.id,
    });
    
    if (usuarioData.password) {
      usuarioData.password = await bcrypt.hash(usuarioData.password, 10);
    }
    
    Object.assign(usuario, usuarioData);
    const actualizado = await this.usuariosRepository.save(usuario);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'usuarios',
      entidad: 'Usuario',
      registroId: actualizado.id,
      accion: TipoAccionAuditoria.ACTUALIZACION,
      descripcion: 'Actualización de usuario',
      datosPrevios,
      datosNuevos: this.sanitizarObjeto({
        nombre: actualizado.nombre,
        email: actualizado.email,
        padron: actualizado.padron,
        rol: actualizado.rol,
        zonaId: (actualizado as any).zona?.id,
      }),
    });

    return actualizado;
  }

  async delete(id: number, actorId?: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuariosRepository.remove(usuario);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'usuarios',
      entidad: 'Usuario',
      registroId: id,
      accion: TipoAccionAuditoria.ELIMINACION,
      descripcion: 'Eliminación de usuario',
      datosPrevios: this.sanitizarObjeto({
        nombre: usuario.nombre,
        email: usuario.email,
        padron: usuario.padron,
        rol: usuario.rol,
        zonaId: (usuario as any).zona?.id,
      }),
    });
  }

  async importarUsuarios(usuarios: any[], actorId?: number): Promise<{ exito: number; errores: any[] }> {
    let exito = 0;
    const errores = [];

    for (const usuarioData of usuarios) {
      try {
        await this.create(usuarioData, actorId);
        exito++;
      } catch (error) {
        errores.push({
          usuario: usuarioData,
          error: error.message,
        });
      }
    }

    return { exito, errores };
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

