import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medidor } from '../entities/medidor.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class MedidoresService {
  constructor(
    @InjectRepository(Medidor)
    private medidoresRepository: Repository<Medidor>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Medidor[]> {
    return this.medidoresRepository.find({
      relations: ['usuario'],
    });
  }

  async findOne(id: number): Promise<Medidor> {
    const medidor = await this.medidoresRepository.findOne({
      where: { id },
      relations: ['usuario', 'lecturas'],
    });
    
    if (!medidor) {
      throw new NotFoundException(`Medidor con ID ${id} no encontrado`);
    }
    
    return medidor;
  }

  async findByUsuario(usuarioId: number): Promise<Medidor[]> {
    return this.medidoresRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { fechaInstalacion: 'DESC' },
    });
  }

  async findMedidorActivo(usuarioId: number): Promise<Medidor | null> {
    return this.medidoresRepository.findOne({
      where: { 
        usuario: { id: usuarioId },
        activo: true,
      },
      relations: ['usuario'],
    });
  }

  async create(medidorData: Partial<Medidor>): Promise<Medidor> {
    const medidor = this.medidoresRepository.create(medidorData);
    const saved = await this.medidoresRepository.save(medidor);
    return saved as unknown as Medidor;
  }

  async asignarMedidorACliente(
    usuarioId: number, 
    medidorData: Partial<Medidor>,
    darDeBajaAnterior = true
  ): Promise<Medidor> {
    // Verificar que el usuario existe
    const usuario = await this.usuariosRepository.findOne({
      where: { id: usuarioId },
      relations: ['medidores'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    // Si hay un medidor activo y se solicita dar de baja, desactivarlo
    if (darDeBajaAnterior) {
      const medidorActivo = await this.findMedidorActivo(usuarioId);
      if (medidorActivo) {
        await this.darDeBaja(medidorActivo.id, 'Reemplazo por nuevo medidor');
      }
    }

    // Crear el nuevo medidor
    const nuevoMedidor = this.medidoresRepository.create({
      ...medidorData,
      usuario: { id: usuarioId } as Usuario,
      activo: true,
      fechaInstalacion: medidorData.fechaInstalacion || new Date(),
      lecturaInicial: medidorData.lecturaInicial || 0,
    });

    return this.medidoresRepository.save(nuevoMedidor);
  }

  async darDeBaja(id: number, motivo?: string): Promise<Medidor> {
    const medidor = await this.findOne(id);
    
    medidor.activo = false;
    medidor.fechaBaja = new Date();
    if (motivo) {
      medidor.motivoBaja = motivo;
    }
    
    return this.medidoresRepository.save(medidor);
  }

  async reemplazarMedidor(
    medidorAnteriorId: number,
    nuevoMedidorData: Partial<Medidor>,
    motivo?: string
  ): Promise<{ anterior: Medidor; nuevo: Medidor }> {
    // Obtener el medidor anterior
    const medidorAnterior = await this.findOne(medidorAnteriorId);
    
    if (!medidorAnterior.usuario) {
      throw new BadRequestException('El medidor no tiene usuario asignado');
    }

    // Dar de baja el medidor anterior
    const anterior = await this.darDeBaja(medidorAnteriorId, motivo || 'Reemplazo');

    // Crear el nuevo medidor
    const nuevo = await this.asignarMedidorACliente(
      medidorAnterior.usuario.id,
      nuevoMedidorData,
      false // No dar de baja el anterior porque ya lo hicimos
    );

    return { anterior, nuevo };
  }

  async update(id: number, medidorData: Partial<Medidor>): Promise<Medidor> {
    const medidor = await this.findOne(id);
    
    Object.assign(medidor, medidorData);
    return this.medidoresRepository.save(medidor);
  }

  async delete(id: number): Promise<void> {
    const medidor = await this.findOne(id);
    await this.medidoresRepository.remove(medidor);
  }
}

