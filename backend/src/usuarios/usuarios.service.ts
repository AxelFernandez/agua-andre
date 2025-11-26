import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Zona } from '../entities/zona.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Zona)
    private zonasRepository: Repository<Zona>,
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

  async create(usuarioData: Partial<Usuario>): Promise<Usuario> {
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
    return this.usuariosRepository.save(usuario);
  }

  async update(id: number, usuarioData: Partial<Usuario>): Promise<Usuario> {
    const usuario = await this.findOne(id);
    
    if (usuarioData.password) {
      usuarioData.password = await bcrypt.hash(usuarioData.password, 10);
    }
    
    Object.assign(usuario, usuarioData);
    return this.usuariosRepository.save(usuario);
  }

  async delete(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuariosRepository.remove(usuario);
  }

  async importarUsuarios(usuarios: any[]): Promise<{ exito: number; errores: any[] }> {
    let exito = 0;
    const errores = [];

    for (const usuarioData of usuarios) {
      try {
        await this.create(usuarioData);
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
}

