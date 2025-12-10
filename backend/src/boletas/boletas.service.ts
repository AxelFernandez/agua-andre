import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { Lectura } from '../entities/lectura.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TipoAccionAuditoria } from '../entities/auditoria-registro.entity';

@Injectable()
export class BoletasService {
  constructor(
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
    @InjectRepository(Lectura)
    private lecturasRepository: Repository<Lectura>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async findAll(): Promise<Boleta[]> {
    return this.boletasRepository.find({
      relations: ['usuario', 'lectura', 'pagos'],
    });
  }

  async findByUsuario(usuarioId: number): Promise<Boleta[]> {
    return this.boletasRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario', 'usuario.zona', 'lectura', 'tarifario', 'pagos'],
      order: { fechaEmision: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Boleta> {
    const boleta = await this.boletasRepository.findOne({
      where: { id },
      relations: ['usuario', 'usuario.zona', 'lectura', 'tarifario', 'pagos'],
    });
    
    if (!boleta) {
      throw new NotFoundException(`Boleta con ID ${id} no encontrada`);
    }
    
    return boleta;
  }

  async generarBoleta(
    lecturaId: number,
    tarifaBase: number = 500,
    actorId?: number,
  ): Promise<Boleta> {
    const lectura = await this.lecturasRepository.findOne({
      where: { id: lecturaId },
      relations: ['medidor', 'medidor.usuario'],
    });

    if (!lectura) {
      throw new NotFoundException('Lectura no encontrada');
    }

    const usuario = lectura.medidor.usuario;

    if (usuario.servicio_dado_de_baja) {
      throw new NotFoundException('El servicio del usuario está dado de baja. No se pueden generar boletas.');
    }

    if (usuario.activo === false) {
      throw new NotFoundException('El usuario está inactivo. No se pueden generar boletas.');
    }
    
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

    const guardada = await this.boletasRepository.save(boleta);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'boletas',
      entidad: 'Boleta',
      registroId: guardada.id,
      accion: TipoAccionAuditoria.CREACION,
      descripcion: `Generación manual de boleta a partir de la lectura ${lecturaId}`,
      datosNuevos: this.sanitizarObjeto({
        usuarioId: usuario.id,
        lecturaId: lectura.id,
        mes: guardada.mes,
        anio: guardada.anio,
        montoBase: guardada.montoBase,
        montoTotal: guardada.montoTotal,
        estado: guardada.estado,
      }),
      metadata: {
        lecturaId: lectura.id,
        medidorId: lectura.medidor.id,
        consumoM3: lectura.consumoM3,
      },
    });

    return guardada;
  }

  async update(
    id: number,
    boletaData: Partial<Boleta>,
    actorId?: number,
    descripcion = 'Actualización manual de boleta',
  ): Promise<Boleta> {
    const boleta = await this.findOne(id);
    const datosPrevios = this.extraerPrevios(boleta, boletaData);

    Object.assign(boleta, boletaData);
    const actualizada = await this.boletasRepository.save(boleta);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'boletas',
      entidad: 'Boleta',
      registroId: actualizada.id,
      accion: TipoAccionAuditoria.ACTUALIZACION,
      descripcion,
      datosPrevios,
      datosNuevos: this.sanitizarObjeto(boletaData),
      metadata: {
        usuarioId: actualizada.usuario?.id,
        lecturaId: actualizada.lectura?.id,
      },
    });

    return actualizada;
  }

  async marcarComoPagada(id: number, actorId?: number): Promise<Boleta> {
    return this.update(
      id,
      { estado: EstadoBoleta.PAGADA },
      actorId,
      'Cambio de estado a PAGADA',
    );
  }

  async delete(id: number, actorId?: number): Promise<void> {
    const boleta = await this.findOne(id);
    await this.boletasRepository.remove(boleta);

    await this.auditoriaService.registrarEvento({
      usuarioId: actorId,
      modulo: 'boletas',
      entidad: 'Boleta',
      registroId: boleta.id,
      accion: TipoAccionAuditoria.ELIMINACION,
      descripcion: 'Eliminación manual de boleta',
      datosPrevios: this.sanitizarObjeto({
        estado: boleta.estado,
        montoTotal: boleta.montoTotal,
        usuarioId: boleta.usuario?.id,
        lecturaId: boleta.lectura?.id,
      }),
      metadata: {
        usuarioId: boleta.usuario?.id,
        lecturaId: boleta.lectura?.id,
      },
    });
  }

  private extraerPrevios(
    boleta: Boleta,
    cambios: Partial<Boleta>,
  ): Record<string, any> | null {
    if (!cambios) {
      return null;
    }

    const previos = Object.entries(cambios).reduce((acc, [key, value]) => {
      if (typeof value === 'undefined') {
        return acc;
      }
      acc[key] = (boleta as any)[key];
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

