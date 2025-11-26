import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { Usuario } from '../entities/usuario.entity';
import { Lectura } from '../entities/lectura.entity';

@Injectable()
export class BoletasService {
  constructor(
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Lectura)
    private lecturasRepository: Repository<Lectura>,
  ) {}

  async findAll(): Promise<Boleta[]> {
    return this.boletasRepository.find({
      relations: ['usuario', 'lectura', 'pagos'],
    });
  }

  async findByUsuario(usuarioId: number): Promise<Boleta[]> {
    return this.boletasRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: ['lectura', 'pagos'],
      order: { fechaEmision: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Boleta> {
    const boleta = await this.boletasRepository.findOne({
      where: { id },
      relations: ['usuario', 'lectura', 'pagos'],
    });
    
    if (!boleta) {
      throw new NotFoundException(`Boleta con ID ${id} no encontrada`);
    }
    
    return boleta;
  }

  async generarBoleta(lecturaId: number, tarifaBase: number = 500): Promise<Boleta> {
    const lectura = await this.lecturasRepository.findOne({
      where: { id: lecturaId },
      relations: ['medidor', 'medidor.usuario'],
    });

    if (!lectura) {
      throw new NotFoundException('Lectura no encontrada');
    }

    const usuario = lectura.medidor.usuario;
    
    // Cálculo simple del monto (puede ser más complejo según tarifas)
    const montoBase = tarifaBase + (lectura.consumoM3 * 50); // $50 por m3
    const montoTotal = montoBase;

    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 15); // 15 días para pagar

    const boleta = this.boletasRepository.create({
      usuario,
      lectura,
      mes: lectura.mes,
      anio: lectura.anio,
      fechaEmision,
      fechaVencimiento,
      montoBase,
      montoTotal,
      recargos: 0,
      estado: EstadoBoleta.PENDIENTE,
    });

    return this.boletasRepository.save(boleta);
  }

  async update(id: number, boletaData: Partial<Boleta>): Promise<Boleta> {
    const boleta = await this.findOne(id);
    Object.assign(boleta, boletaData);
    return this.boletasRepository.save(boleta);
  }

  async marcarComoPagada(id: number): Promise<Boleta> {
    return this.update(id, { estado: EstadoBoleta.PAGADA });
  }

  async delete(id: number): Promise<void> {
    const boleta = await this.findOne(id);
    await this.boletasRepository.remove(boleta);
  }
}

