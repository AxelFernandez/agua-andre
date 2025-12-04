import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { BoletaCargoExtra } from '../entities/boleta-cargo-extra.entity';
import { TarifarioService } from './tarifario.service';
import { EstadoServicioService } from './estado-servicio.service';
import { ReconexionService } from './reconexion.service';

@Injectable()
export class PagoBoletaService {
  constructor(
    @InjectRepository(Boleta)
    private boletaRepository: Repository<Boleta>,
    @InjectRepository(BoletaCargoExtra)
    private boletaCargoExtraRepository: Repository<BoletaCargoExtra>,
    private tarifarioService: TarifarioService,
    private estadoServicioService: EstadoServicioService,
    private reconexionService: ReconexionService,
  ) {}

  // ==========================================
  // PROCESAR PAGO DE BOLETA
  // ==========================================

  async procesarPagoBoleta(
    boletaId: number,
    montoPagado: number,
    fechaPago: Date = new Date()
  ): Promise<any> {
    const boleta = await this.boletaRepository.findOne({
      where: { id: boletaId },
      relations: ['usuario'],
    });

    if (!boleta) {
      throw new Error('Boleta no encontrada');
    }

    if (boleta.estado === EstadoBoleta.PAGADA) {
      throw new Error('Esta boleta ya fue pagada');
    }

    const config = await this.tarifarioService.obtenerConfiguracionAvisos();
    let montoTotal = Number(boleta.total);

    // Aplicar recargo por mora si paga después del vencimiento
    if (config.recargo_mora_activo && fechaPago > boleta.fechaVencimiento) {
      const recargo = await this.tarifarioService.obtenerCargoExtraPorCodigo('RECARGO_MORA');

      if (recargo) {
        const montoRecargo = Number(recargo.monto);
        montoTotal += montoRecargo;

        // Registrar el recargo
        await this.boletaCargoExtraRepository.save({
          boleta_id: boleta.id,
          cargo_extra_id: recargo.id,
          monto: montoRecargo,
          descripcion: 'Recargo por pago fuera de término',
          aplicado_automaticamente: true,
        } as unknown as BoletaCargoExtra);

        boleta.total_cargos_extras += montoRecargo;
        boleta.total = montoTotal;
        boleta.montoTotal = montoTotal;
      }
    }

    // Verificar monto
    if (montoPagado < montoTotal) {
      throw new Error(
        `Monto insuficiente. Debe pagar $${montoTotal.toFixed(2)}`
      );
    }

    // Marcar boleta como pagada
    boleta.estado = EstadoBoleta.PAGADA;
    boleta.fechaPago = fechaPago;
    await this.boletaRepository.save(boleta);

    // Si tiene cuota de plan, marcarla como pagada
    if (boleta.cuota_plan_numero) {
      await this.reconexionService.marcarCuotaComoPagada(boleta, fechaPago);
    }

    // Verificar si debe actualizar estado del servicio
    await this.estadoServicioService.verificarRegularizacionCliente(boleta.usuario);

    return {
      success: true,
      monto_pagado: montoPagado,
      monto_total: montoTotal,
      recargo_aplicado: montoPagado > Number(boleta.total),
    };
  }
}

