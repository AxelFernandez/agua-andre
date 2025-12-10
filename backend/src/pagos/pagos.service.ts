import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago, EstadoPago, MetodoPago } from '../entities/pago.entity';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { PagoBoletaService } from '../tarifario/pago-boleta.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TipoAccionAuditoria } from '../entities/auditoria-registro.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
    private readonly pagoBoletaService: PagoBoletaService,
    private readonly auditoriaService: AuditoriaService,
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

  async registrarPagoEfectivo(
    data: {
      boletaId: number;
      monto?: number;
      fechaPago?: string | Date;
      observaciones?: string;
    },
    adminId: number,
  ): Promise<Pago> {
    const boleta = await this.boletasRepository.findOne({
      where: { id: data.boletaId },
      relations: ['usuario'],
    });

    if (!boleta) {
      throw new NotFoundException('Boleta no encontrada');
    }

    if (boleta.estado === EstadoBoleta.PAGADA) {
      throw new BadRequestException('Esta boleta ya está marcada como pagada');
    }

    const fechaPago =
      data.fechaPago instanceof Date
        ? data.fechaPago
        : data.fechaPago
          ? new Date(data.fechaPago)
          : new Date();

    const montoPagado = Number(
      typeof data.monto === 'undefined' ? boleta.total : data.monto,
    );

    const datosPrevios = {
      estadoBoleta: boleta.estado,
      totalBoleta: boleta.total,
      fechaPago: boleta.fechaPago,
    };

    await this.pagoBoletaService.procesarPagoBoleta(boleta.id, montoPagado, fechaPago);

    const boletaActualizada = await this.boletasRepository.findOne({
      where: { id: boleta.id },
      relations: ['usuario'],
    });

    const pago = this.pagosRepository.create({
      boleta,
      monto: montoPagado,
      fechaPago,
      metodoPago: MetodoPago.EFECTIVO,
      estado: EstadoPago.APROBADO,
      verificadoPor: adminId ? ({ id: adminId } as any) : null,
      observaciones: data.observaciones,
    });

    const pagoGuardado = await this.pagosRepository.save(pago);

    await this.auditoriaService.registrarEvento({
      usuarioId: adminId,
      modulo: 'pagos',
      entidad: 'Pago',
      registroId: pagoGuardado.id,
      accion: TipoAccionAuditoria.CREACION,
      descripcion: 'Cobro en efectivo registrado en caja',
      datosPrevios: this.sanitizarObjeto(datosPrevios),
      datosNuevos: this.sanitizarObjeto({
        boletaId: boletaActualizada?.id ?? boleta.id,
        monto: montoPagado,
        fechaPago,
        metodoPago: MetodoPago.EFECTIVO,
        estado: EstadoPago.APROBADO,
      }),
      metadata: this.sanitizarObjeto({
        usuarioId: boletaActualizada?.usuario?.id,
        estadoBoleta: boletaActualizada?.estado ?? EstadoBoleta.PAGADA,
      }),
    });

    return pagoGuardado;
  }

  async aprobarPago(id: number, adminId: number): Promise<Pago> {
    const pago = await this.findOne(id);
    const previos = this.sanitizarObjeto({
      estado: pago.estado,
      verificadoPor: pago.verificadoPor?.id,
      boletaEstado: pago.boleta?.estado,
    });

    pago.estado = EstadoPago.APROBADO;
    pago.verificadoPor = { id: adminId } as any;
    
    const pagoActualizado = await this.pagosRepository.save(pago);
    
    // Actualizar estado de la boleta
    await this.boletasRepository.update(
      pago.boleta.id,
      { estado: EstadoBoleta.PAGADA }
    );

    await this.auditoriaService.registrarEvento({
      usuarioId: adminId,
      modulo: 'pagos',
      entidad: 'Pago',
      registroId: pagoActualizado.id,
      accion: TipoAccionAuditoria.ACTUALIZACION,
      descripcion: 'Pago por transferencia aprobado',
      datosPrevios: previos,
      datosNuevos: this.sanitizarObjeto({
        estado: pagoActualizado.estado,
        verificadoPor: adminId,
        boletaId: pago.boleta.id,
        boletaEstado: EstadoBoleta.PAGADA,
      }),
      metadata: this.sanitizarObjeto({
        usuarioId: pago.boleta?.usuario?.id,
      }),
    });
    
    return pagoActualizado;
  }

  async rechazarPago(id: number, adminId: number, observaciones: string): Promise<Pago> {
    const pago = await this.findOne(id);
    const previos = this.sanitizarObjeto({
      estado: pago.estado,
      verificadoPor: pago.verificadoPor?.id,
      observaciones: pago.observaciones,
      boletaEstado: pago.boleta?.estado,
    });

    pago.estado = EstadoPago.RECHAZADO;
    pago.verificadoPor = { id: adminId } as any;
    pago.observaciones = observaciones;
    
    const updated = await this.pagosRepository.save(pago);
    
    // Volver la boleta a estado PENDIENTE
    await this.boletasRepository.update(
      pago.boleta.id,
      { estado: EstadoBoleta.PENDIENTE }
    );

    await this.auditoriaService.registrarEvento({
      usuarioId: adminId,
      modulo: 'pagos',
      entidad: 'Pago',
      registroId: updated.id,
      accion: TipoAccionAuditoria.ACTUALIZACION,
      descripcion: 'Pago por transferencia rechazado',
      datosPrevios: previos,
      datosNuevos: this.sanitizarObjeto({
        estado: updated.estado,
        verificadoPor: adminId,
        observaciones,
        boletaId: pago.boleta.id,
        boletaEstado: EstadoBoleta.PENDIENTE,
      }),
      metadata: this.sanitizarObjeto({
        usuarioId: pago.boleta?.usuario?.id,
      }),
    });
    
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

