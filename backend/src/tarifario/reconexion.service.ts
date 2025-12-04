import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { PlanPagoReconexion, EstadoPlanPago } from '../entities/plan-pago-reconexion.entity';
import { CuotaReconexion, EstadoCuota } from '../entities/cuota-reconexion.entity';
import { Boleta } from '../entities/boleta.entity';
import { EstadoServicioEnum } from '../entities/estado-servicio.entity';
import { TarifarioService } from './tarifario.service';
import { EstadoServicioService } from './estado-servicio.service';

@Injectable()
export class ReconexionService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(PlanPagoReconexion)
    private planPagoReconexionRepository: Repository<PlanPagoReconexion>,
    @InjectRepository(CuotaReconexion)
    private cuotaReconexionRepository: Repository<CuotaReconexion>,
    @InjectRepository(Boleta)
    private boletaRepository: Repository<Boleta>,
    private tarifarioService: TarifarioService,
    @Inject(forwardRef(() => EstadoServicioService))
    private estadoServicioService: EstadoServicioService,
  ) {}

  // ==========================================
  // RECONEXIÓN DE SERVICIO
  // ==========================================

  async procesarReconexion(
    usuarioId: number,
    pagoContado: boolean,
    cantidadCuotas?: number
  ): Promise<any> {
    const cliente = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });

    if (!cliente) {
      throw new Error('Usuario no encontrado');
    }

    if (cliente.estado_servicio !== EstadoServicioEnum.CORTADO) {
      throw new Error('El servicio no está cortado');
    }

    const config = await this.tarifarioService.obtenerConfiguracionAvisos();
    const monto_reconexion = Number(config.reconexion_monto);

    // Verificar que no tenga deuda pendiente
    const deudaPendiente = await this.estadoServicioService.calcularDeudaTotal(usuarioId);
    if (deudaPendiente > 0) {
      throw new Error(
        `Debe pagar primero la deuda de $${deudaPendiente.toFixed(2)} antes de reconectar`
      );
    }

    let resultado: any = {
      reconectado: false,
      plan_creado: false,
    };

    if (pagoContado) {
      // Pago único - se paga al contado
      resultado.monto_a_pagar = monto_reconexion;
      resultado.mensaje = `Debe pagar $${monto_reconexion} al contado para reconectar`;
      // El pago se procesa aparte, aquí solo se prepara
    } else {
      // Crear plan de pago en cuotas
      if (!cantidadCuotas || cantidadCuotas < 1 || cantidadCuotas > config.reconexion_cuotas_max) {
        throw new Error(
          `Cantidad de cuotas inválida. Máximo ${config.reconexion_cuotas_max} cuotas`
        );
      }

      const plan = await this.crearPlanPagoReconexion(
        cliente,
        monto_reconexion,
        cantidadCuotas
      );

      resultado.plan_creado = true;
      resultado.plan_id = plan.id;
      resultado.cantidad_cuotas = cantidadCuotas;
      resultado.monto_cuota = monto_reconexion / cantidadCuotas;
    }

    // Reconectar el servicio
    await this.reconectarServicio(cliente);
    resultado.reconectado = true;

    return resultado;
  }

  private async crearPlanPagoReconexion(
    cliente: Usuario,
    montoReconexion: number,
    cantidadCuotas: number
  ): Promise<PlanPagoReconexion> {
    const montoCuota = montoReconexion / cantidadCuotas;
    const deudaAnterior = await this.estadoServicioService.calcularDeudaTotal(cliente.id);

    const plan = this.planPagoReconexionRepository.create({
      usuario_id: cliente.id,
      monto_reconexion: montoReconexion,
      monto_deuda_anterior: deudaAnterior,
      cantidad_cuotas: cantidadCuotas,
      monto_cuota: montoCuota,
      fecha_inicio: new Date(),
      estado: EstadoPlanPago.ACTIVO,
    });

    const planGuardado = await this.planPagoReconexionRepository.save(plan);

    // Crear cuotas
    for (let i = 1; i <= cantidadCuotas; i++) {
      await this.cuotaReconexionRepository.save({
        plan_pago_reconexion_id: planGuardado.id,
        numero_cuota: i,
        monto: montoCuota,
        fecha_vencimiento: new Date(), // Se actualizará cuando se agregue a una boleta
        estado: EstadoCuota.PENDIENTE,
      } as unknown as CuotaReconexion);
    }

    return planGuardado;
  }

  private async reconectarServicio(cliente: Usuario): Promise<void> {
    cliente.fecha_ultima_reconexion = new Date();
    await this.estadoServicioService.cambiarEstadoServicio(
      cliente,
      EstadoServicioEnum.ACTIVO,
      false,
      'Servicio reconectado después de pago'
    );

    // TODO: Notificar al operativo para reconexión física
    console.log(`✅ RECONEXIÓN - Cliente ${cliente.padron} - ${cliente.nombre}`);
  }

  // ==========================================
  // PLAN DE PAGO - CUOTAS
  // ==========================================

  async agregarCuotaPlanReconexion(
    boleta: Boleta,
    usuario: Usuario
  ): Promise<void> {
    // Buscar plan de reconexión activo
    const plan = await this.planPagoReconexionRepository.findOne({
      where: {
        usuario_id: usuario.id,
        estado: EstadoPlanPago.ACTIVO,
      },
    });

    if (!plan) return;

    // Buscar la siguiente cuota pendiente
    const cuotaPendiente = await this.cuotaReconexionRepository.findOne({
      where: {
        plan_pago_reconexion_id: plan.id,
        estado: EstadoCuota.PENDIENTE,
      },
      order: { numero_cuota: 'ASC' },
    });

    if (cuotaPendiente) {
      // Vincular cuota con esta boleta
      cuotaPendiente.boleta_id = boleta.id;
      cuotaPendiente.fecha_vencimiento = boleta.fechaVencimiento;
      await this.cuotaReconexionRepository.save(cuotaPendiente);

      // Actualizar boleta
      boleta.plan_pago_reconexion_id = plan.id;
      boleta.cuota_plan_numero = cuotaPendiente.numero_cuota;
      boleta.monto_cuota_plan = Number(cuotaPendiente.monto);
      await this.boletaRepository.save(boleta);
    }
  }

  async marcarCuotaComoPagada(
    boleta: Boleta,
    fechaPago: Date
  ): Promise<void> {
    const cuota = await this.cuotaReconexionRepository.findOne({
      where: {
        plan_pago_reconexion_id: boleta.plan_pago_reconexion_id,
        numero_cuota: boleta.cuota_plan_numero,
      },
    });

    if (cuota) {
      cuota.estado = EstadoCuota.PAGADO;
      cuota.fecha_pago = fechaPago;
      await this.cuotaReconexionRepository.save(cuota);

      // Verificar si completó el plan
      const cuotasPendientes = await this.cuotaReconexionRepository.count({
        where: {
          plan_pago_reconexion_id: boleta.plan_pago_reconexion_id,
          estado: EstadoCuota.PENDIENTE,
        },
      });

      if (cuotasPendientes === 0) {
        const plan = await this.planPagoReconexionRepository.findOne({
          where: { id: boleta.plan_pago_reconexion_id },
        });
        if (plan) {
          plan.estado = EstadoPlanPago.COMPLETADO;
          await this.planPagoReconexionRepository.save(plan);
          console.log(`🎉 Plan de reconexión completado - Cliente ${boleta.usuario.padron}`);
        }
      }
    }
  }

  // ==========================================
  // OBTENER DATOS
  // ==========================================

  async obtenerPlanReconexionActivo(usuarioId: number): Promise<PlanPagoReconexion> {
    return this.planPagoReconexionRepository.findOne({
      where: {
        usuario_id: usuarioId,
        estado: EstadoPlanPago.ACTIVO,
      },
      relations: ['cuotas'],
    });
  }
}

