import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago, EstadoPago, MetodoPago } from '../entities/pago.entity';
import { Usuario, RolUsuario } from '../entities/usuario.entity';
import { Medidor } from '../entities/medidor.entity';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { EstadoServicioEnum } from '../entities/estado-servicio.entity';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Medidor)
    private readonly medidoresRepository: Repository<Medidor>,
    @InjectRepository(Boleta)
    private readonly boletasRepository: Repository<Boleta>,
  ) {}

  async obtenerResumen(params?: {
    desde?: string;
    hasta?: string;
    diasVencimiento?: number;
  }) {
    const { desde, hasta, diasVencimiento = 7 } = params || {};
    const desdeDate = desde ? new Date(desde) : undefined;
    const hastaDate = hasta ? new Date(hasta) : undefined;

    const pagosAprobadosQB = this.pagosRepository
      .createQueryBuilder('pago')
      .where('pago.estado = :estado', { estado: EstadoPago.APROBADO });

    if (desdeDate) {
      pagosAprobadosQB.andWhere('pago.fechaPago >= :desde', { desde: desdeDate });
    }
    if (hastaDate) {
      pagosAprobadosQB.andWhere('pago.fechaPago <= :hasta', { hasta: hastaDate });
    }

    const pagosPorMetodoQB = this.pagosRepository
      .createQueryBuilder('pago')
      .select('pago.metodoPago', 'metodoPago')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(pago.monto), 0)', 'montoTotal')
      .where('pago.estado = :estado', { estado: EstadoPago.APROBADO });

    if (desdeDate) {
      pagosPorMetodoQB.andWhere('pago.fechaPago >= :desde', { desde: desdeDate });
    }
    if (hastaDate) {
      pagosPorMetodoQB.andWhere('pago.fechaPago <= :hasta', { hasta: hastaDate });
    }

    const pagosPorMetodoRaw = await pagosPorMetodoQB.groupBy('pago.metodoPago').getRawMany();

    const pagosPendientesQB = this.pagosRepository
      .createQueryBuilder('pago')
      .where('pago.estado = :estado', { estado: EstadoPago.PENDIENTE });
    const pagosRechazadosQB = this.pagosRepository
      .createQueryBuilder('pago')
      .where('pago.estado = :estado', { estado: EstadoPago.RECHAZADO });

    if (desdeDate) {
      pagosPendientesQB.andWhere('pago.fechaPago >= :desde', { desde: desdeDate });
      pagosRechazadosQB.andWhere('pago.fechaPago >= :desde', { desde: desdeDate });
    }
    if (hastaDate) {
      pagosPendientesQB.andWhere('pago.fechaPago <= :hasta', { hasta: hastaDate });
      pagosRechazadosQB.andWhere('pago.fechaPago <= :hasta', { hasta: hastaDate });
    }

    const pagosPendientes = await pagosPendientesQB.getCount();
    const pagosRechazados = await pagosRechazadosQB.getCount();
    const pagosTotalesAprobados = await pagosAprobadosQB.getCount();
    const pagosTotalesRechazados = pagosRechazados;

    const pagosPorMetodo = {
      [MetodoPago.TRANSFERENCIA]: { cantidad: 0, monto: 0 },
      [MetodoPago.EFECTIVO]: { cantidad: 0, monto: 0 },
      [MetodoPago.TARJETA]: { cantidad: 0, monto: 0 },
    };

    let totalPagosAprobados = 0;
    let montoPagosAprobados = 0;

    pagosPorMetodoRaw.forEach((row) => {
      const metodo = row.metodoPago as MetodoPago;
      const cantidad = Number(row.cantidad ?? 0);
      const monto = Number(row.montoTotal ?? 0);

      if (pagosPorMetodo[metodo]) {
        pagosPorMetodo[metodo].cantidad = cantidad;
        pagosPorMetodo[metodo].monto = monto;
      }

      totalPagosAprobados += cantidad;
      montoPagosAprobados += monto;
    });

    const tasaAprobacion =
      pagosTotalesAprobados + pagosTotalesRechazados > 0
        ? pagosTotalesAprobados /
          (pagosTotalesAprobados + pagosTotalesRechazados)
        : 0;

    const totalClientes = await this.usuariosRepository.count({
      where: { rol: RolUsuario.CLIENTE },
    });

    const clientesConMedidorRaw = await this.medidoresRepository
      .createQueryBuilder('medidor')
      .select('COUNT(DISTINCT medidor.usuario)', 'total')
      .getRawOne<{ total: string }>();

    const clientesConMedidorActivoRaw = await this.medidoresRepository
      .createQueryBuilder('medidor')
      .select('COUNT(DISTINCT medidor.usuario)', 'total')
      .where('medidor.activo = true')
      .getRawOne<{ total: string }>();

    const clientesConMedidor = Number(clientesConMedidorRaw?.total ?? 0);
    const clientesConMedidorActivo = Number(
      clientesConMedidorActivoRaw?.total ?? 0,
    );
    const clientesSinMedidor = Math.max(
      totalClientes - clientesConMedidor,
      0,
    );

    const medidoresDadosDeBaja = await this.medidoresRepository.count({
      where: { activo: false },
    });

    const medidoresRotos = await this.medidoresRepository
      .createQueryBuilder('medidor')
      .where('medidor.activo = false')
      .andWhere("LOWER(COALESCE(medidor.motivoBaja, '')) LIKE :motivo", {
        motivo: '%roto%',
      })
      .getCount();

    const estadosServicioRaw = await this.usuariosRepository
      .createQueryBuilder('usuario')
      .select('usuario.estado_servicio', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('usuario.rol = :rol', { rol: RolUsuario.CLIENTE })
      .groupBy('usuario.estado_servicio')
      .getRawMany<{ estado: EstadoServicioEnum; cantidad: string }>();

    const estadosServicio = {
      [EstadoServicioEnum.ACTIVO]: 0,
      [EstadoServicioEnum.AVISO_DEUDA]: 0,
      [EstadoServicioEnum.AVISO_CORTE]: 0,
      [EstadoServicioEnum.CORTADO]: 0,
    };

    estadosServicioRaw.forEach((row) => {
      estadosServicio[row.estado] = Number(row.cantidad ?? 0);
    });

    const boletasPorEstadoQB = this.boletasRepository
      .createQueryBuilder('boleta')
      .select('boleta.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(boleta.total), 0)', 'montoTotal');

    if (desdeDate) {
      boletasPorEstadoQB.andWhere('boleta.fechaEmision >= :desde', { desde: desdeDate });
    }
    if (hastaDate) {
      boletasPorEstadoQB.andWhere('boleta.fechaEmision <= :hasta', { hasta: hastaDate });
    }

    const boletasPorEstadoRaw = await boletasPorEstadoQB
      .groupBy('boleta.estado')
      .getRawMany();

    const boletasPorEstado = {
      [EstadoBoleta.PENDIENTE]: { cantidad: 0, monto: 0 },
      [EstadoBoleta.PROCESANDO]: { cantidad: 0, monto: 0 },
      [EstadoBoleta.PAGADA]: { cantidad: 0, monto: 0 },
      [EstadoBoleta.VENCIDA]: { cantidad: 0, monto: 0 },
      [EstadoBoleta.ANULADA]: { cantidad: 0, monto: 0 },
    };

    boletasPorEstadoRaw.forEach((row) => {
      const estado = row.estado as EstadoBoleta;
      const cantidad = Number(row.cantidad ?? 0);
      const monto = Number(row.montoTotal ?? 0);

      if (boletasPorEstado[estado]) {
        boletasPorEstado[estado].cantidad = cantidad;
        boletasPorEstado[estado].monto = monto;
      }
    });

    const boletasConMedidor = await this.boletasRepository.count({
      where: { tiene_medidor: true },
    });
    const boletasSinMedidor = await this.boletasRepository.count({
      where: { tiene_medidor: false },
    });

    const deudaPendienteQB = this.boletasRepository
      .createQueryBuilder('boleta')
      .select('COALESCE(SUM(boleta.total), 0)', 'monto')
      .where('boleta.estado IN (:...estados)', {
        estados: [
          EstadoBoleta.PENDIENTE,
          EstadoBoleta.PROCESANDO,
          EstadoBoleta.VENCIDA,
        ],
      });

    if (desdeDate) {
      deudaPendienteQB.andWhere('boleta.fechaEmision >= :desde', { desde: desdeDate });
    }
    if (hastaDate) {
      deudaPendienteQB.andWhere('boleta.fechaEmision <= :hasta', { hasta: hastaDate });
    }

    const deudaPendienteRaw = await deudaPendienteQB.getRawOne<{ monto: string }>();

    const proximasVencer = await this.boletasRepository
      .createQueryBuilder('boleta')
      .select('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(boleta.total), 0)', 'monto')
      .where('boleta.estado IN (:...estados)', {
        estados: [EstadoBoleta.PENDIENTE, EstadoBoleta.PROCESANDO],
      })
      .andWhere(
        'boleta.fechaVencimiento BETWEEN CURRENT_DATE AND (CURRENT_DATE + (:dias * INTERVAL \'1 day\'))',
        { dias: diasVencimiento },
      )
      .getRawOne<{ cantidad: string; monto: string }>();

    return {
      pagos: {
        aprobados: totalPagosAprobados,
        montoAprobado: montoPagosAprobados,
        pendientes: pagosPendientes,
        rechazados: pagosRechazados,
        porMetodo: pagosPorMetodo,
        tasas: {
          aprobacion: tasaAprobacion,
          rechazo: 1 - tasaAprobacion,
        },
      },
      medidores: {
        clientesConMedidor,
        clientesConMedidorActivo,
        clientesSinMedidor,
        medidoresDadosDeBaja,
        medidoresRotos,
      },
      usuarios: {
        totalClientes,
        estadosServicio,
      },
      boletas: {
        porEstado: boletasPorEstado,
        conMedidor: boletasConMedidor,
        sinMedidor: boletasSinMedidor,
        deudaPendiente: Number(deudaPendienteRaw?.monto ?? 0),
        proximasVencer: {
          cantidad: Number(proximasVencer?.cantidad ?? 0),
          monto: Number(proximasVencer?.monto ?? 0),
          diasVencimiento,
        },
      },
    };
  }

  async obtenerTendencias(params?: { meses?: number; hasta?: string }) {
    const meses = params?.meses && params.meses > 0 ? params.meses : 12;
    const hastaDate = params?.hasta ? new Date(params.hasta) : new Date();

    const pagosTendencia = await this.pagosRepository
      .createQueryBuilder('pago')
      .select("TO_CHAR(DATE_TRUNC('month', pago.fechaPago), 'YYYY-MM')", 'mes')
      .addSelect('COUNT(*) FILTER (WHERE pago.estado = :aprobado)', 'pagos_aprobados')
      .addSelect(
        'COALESCE(SUM(pago.monto) FILTER (WHERE pago.estado = :aprobado), 0)',
        'monto_aprobado',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE pago.estado = :rechazado)',
        'pagos_rechazados',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE pago.metodoPago = :transferencia AND pago.estado = :aprobado)',
        'transferencia_cant',
      )
      .addSelect(
        'COALESCE(SUM(pago.monto) FILTER (WHERE pago.metodoPago = :transferencia AND pago.estado = :aprobado), 0)',
        'transferencia_monto',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE pago.metodoPago = :efectivo AND pago.estado = :aprobado)',
        'efectivo_cant',
      )
      .addSelect(
        'COALESCE(SUM(pago.monto) FILTER (WHERE pago.metodoPago = :efectivo AND pago.estado = :aprobado), 0)',
        'efectivo_monto',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE pago.metodoPago = :tarjeta AND pago.estado = :aprobado)',
        'tarjeta_cant',
      )
      .addSelect(
        'COALESCE(SUM(pago.monto) FILTER (WHERE pago.metodoPago = :tarjeta AND pago.estado = :aprobado), 0)',
        'tarjeta_monto',
      )
      .where('pago.fechaPago <= :hasta', { hasta: hastaDate })
      .andWhere("pago.fechaPago >= (:hasta - INTERVAL '1 month' * :meses)", {
        hasta: hastaDate,
        meses,
      })
      .groupBy("TO_CHAR(DATE_TRUNC('month', pago.fechaPago), 'YYYY-MM')")
      .orderBy("TO_CHAR(DATE_TRUNC('month', pago.fechaPago), 'YYYY-MM')", 'ASC')
      .setParameters({
        aprobado: EstadoPago.APROBADO,
        rechazado: EstadoPago.RECHAZADO,
        transferencia: MetodoPago.TRANSFERENCIA,
        efectivo: MetodoPago.EFECTIVO,
        tarjeta: MetodoPago.TARJETA,
      })
      .getRawMany();

    const boletasTendencia = await this.boletasRepository
      .createQueryBuilder('boleta')
      .select("TO_CHAR(DATE_TRUNC('month', boleta.fechaEmision), 'YYYY-MM')", 'mes')
      .addSelect('COUNT(*)', 'boletas_emitidas')
      .addSelect(
        'COUNT(*) FILTER (WHERE boleta.estado = :pagada)',
        'boletas_pagadas',
      )
      .addSelect(
        'COALESCE(SUM(boleta.total) FILTER (WHERE boleta.estado = :pagada), 0)',
        'monto_pagado',
      )
      .where('boleta.fechaEmision <= :hasta', { hasta: hastaDate })
      .andWhere("boleta.fechaEmision >= (:hasta - INTERVAL '1 month' * :meses)", {
        hasta: hastaDate,
        meses,
      })
      .groupBy("TO_CHAR(DATE_TRUNC('month', boleta.fechaEmision), 'YYYY-MM')")
      .orderBy("TO_CHAR(DATE_TRUNC('month', boleta.fechaEmision), 'YYYY-MM')", 'ASC')
      .setParameters({
        pagada: EstadoBoleta.PAGADA,
      })
      .getRawMany();

    return {
      meses: pagosTendencia.map((p) => p.mes),
      pagos: pagosTendencia,
      boletas: boletasTendencia,
    };
  }

  async obtenerDeudaPorZona(params?: { limit?: number }) {
    const limit = params?.limit && params.limit > 0 ? params.limit : 10;

    return this.boletasRepository
      .createQueryBuilder('boleta')
      .leftJoin('boleta.usuario', 'usuario')
      .leftJoin('usuario.zona', 'zona')
      .select('zona.id', 'zonaId')
      .addSelect('zona.nombre', 'zonaNombre')
      .addSelect('COUNT(*)', 'boletas')
      .addSelect('COALESCE(SUM(boleta.total), 0)', 'monto')
      .where('boleta.estado IN (:...estados)', {
        estados: [
          EstadoBoleta.PENDIENTE,
          EstadoBoleta.PROCESANDO,
          EstadoBoleta.VENCIDA,
        ],
      })
      .groupBy('zona.id')
      .addGroupBy('zona.nombre')
      .orderBy('monto', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async obtenerTopDeudaClientes(params?: { limit?: number }) {
    const limit = params?.limit && params.limit > 0 ? params.limit : 20;

    return this.boletasRepository
      .createQueryBuilder('boleta')
      .leftJoin('boleta.usuario', 'usuario')
      .select('usuario.id', 'usuarioId')
      .addSelect('usuario.nombre', 'nombre')
      .addSelect('usuario.padron', 'padron')
      .addSelect('COUNT(*)', 'boletas')
      .addSelect('COALESCE(SUM(boleta.total), 0)', 'monto')
      .where('boleta.estado IN (:...estados)', {
        estados: [
          EstadoBoleta.PENDIENTE,
          EstadoBoleta.PROCESANDO,
          EstadoBoleta.VENCIDA,
        ],
      })
      .groupBy('usuario.id')
      .addGroupBy('usuario.nombre')
      .addGroupBy('usuario.padron')
      .orderBy('monto', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}

