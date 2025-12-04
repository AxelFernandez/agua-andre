import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago, EstadoPago } from '../entities/pago.entity';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
  ) {}

  async findAll(): Promise<Pago[]> {
    return this.pagosRepository.find({
      relations: ['boleta', 'verificadoPor'],
    });
  }

  async findByBoleta(boletaId: number): Promise<Pago[]> {
    return this.pagosRepository.find({
      where: { boleta: { id: boletaId } },
      relations: ['boleta', 'verificadoPor'],
    });
  }

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagosRepository.findOne({
      where: { id },
      relations: ['boleta', 'verificadoPor'],
    });
    
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    
    return pago;
  }

  async create(pagoData: any): Promise<Pago> {
    const boleta = await this.boletasRepository.findOne({
      where: { id: pagoData.boletaId },
    });

    if (!boleta) {
      throw new NotFoundException('Boleta no encontrada');
    }

    const pago = this.pagosRepository.create({
      ...pagoData,
      boleta,
      fechaPago: new Date(),
    });

    const saved = await this.pagosRepository.save(pago);
    
    // Cambiar estado de la boleta a PROCESANDO
    await this.boletasRepository.update(
      boleta.id,
      { estado: EstadoBoleta.PROCESANDO }
    );
    
    return saved as unknown as Pago;
  }

  async aprobarPago(id: number, adminId: number): Promise<Pago> {
    const pago = await this.findOne(id);
    
    pago.estado = EstadoPago.APROBADO;
    pago.verificadoPor = { id: adminId } as any;
    
    const pagoActualizado = await this.pagosRepository.save(pago);
    
    // Actualizar estado de la boleta
    await this.boletasRepository.update(
      pago.boleta.id,
      { estado: EstadoBoleta.PAGADA }
    );
    
    return pagoActualizado;
  }

  async rechazarPago(id: number, adminId: number, observaciones: string): Promise<Pago> {
    const pago = await this.findOne(id);
    
    pago.estado = EstadoPago.RECHAZADO;
    pago.verificadoPor = { id: adminId } as any;
    pago.observaciones = observaciones;
    
    const updated = await this.pagosRepository.save(pago);
    
    // Volver la boleta a estado PENDIENTE
    await this.boletasRepository.update(
      pago.boleta.id,
      { estado: EstadoBoleta.PENDIENTE }
    );
    
    return updated;
  }

  async findPendientesRevision(): Promise<Pago[]> {
    return this.pagosRepository.find({
      where: { estado: EstadoPago.PENDIENTE },
      relations: [
        'boleta',
        'boleta.usuario',
        'boleta.usuario.zona',
        'verificadoPor'
      ],
      order: { fechaPago: 'DESC' },
    });
  }

  async delete(id: number): Promise<void> {
    const pago = await this.findOne(id);
    await this.pagosRepository.remove(pago);
  }
}

