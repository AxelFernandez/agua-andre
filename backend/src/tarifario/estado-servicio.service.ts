import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Usuario, RolUsuario } from '../entities/usuario.entity';
import { EstadoServicio, EstadoServicioEnum } from '../entities/estado-servicio.entity';
import { ConfiguracionAvisos } from '../entities/configuracion-avisos.entity';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { TarifarioService } from './tarifario.service';

@Injectable()
export class EstadoServicioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(EstadoServicio)
    private estadoServicioRepository: Repository<EstadoServicio>,
    @InjectRepository(Boleta)
    private boletaRepository: Repository<Boleta>,
    private tarifarioService: TarifarioService,
  ) {}

  // ==========================================
  // VERIFICAR ESTADOS DE SERVICIO
  // ==========================================

  async verificarYActualizarEstados(): Promise<void> {
    const config = await this.tarifarioService.obtenerConfiguracionAvisos();
    const clientes = await this.usuarioRepository.find({
      where: { rol: RolUsuario.CLIENTE, activo: true, servicio_dado_de_baja: false },
    });

    for (const cliente of clientes) {
      await this.verificarEstadoCliente(cliente, config);
    }
  }

  private async verificarEstadoCliente(
    cliente: Usuario,
    config: ConfiguracionAvisos
  ): Promise<void> {
    const hoy = new Date();

    switch (cliente.estado_servicio) {
      case EstadoServicioEnum.ACTIVO:
        // Verificar si debe pasar a AVISO_DEUDA
        const mesesVencidos = await this.contarMesesVencidos(cliente.id);
        if (mesesVencidos >= config.aviso_deuda_meses) {
          await this.cambiarEstadoServicio(
            cliente,
            EstadoServicioEnum.AVISO_DEUDA,
            true,
            `Pasó a AVISO_DEUDA por ${mesesVencidos} meses sin pagar`
          );
        }
        break;

      case EstadoServicioEnum.AVISO_DEUDA:
        // Verificar si debe pasar a AVISO_CORTE
        if (cliente.fecha_aviso_deuda) {
          const diasDesdeAviso = this.calcularDiasEntre(
            cliente.fecha_aviso_deuda,
            hoy
          );
          if (diasDesdeAviso >= config.aviso_corte_dias_despues) {
            await this.cambiarEstadoServicio(
              cliente,
              EstadoServicioEnum.AVISO_CORTE,
              true,
              `Pasó a AVISO_CORTE por ${diasDesdeAviso} días sin regularizar`
            );
          }
        }
        break;

      case EstadoServicioEnum.AVISO_CORTE:
        // Verificar si debe CORTARSE
        if (cliente.fecha_aviso_corte) {
          const diasDesdeAvisoCorte = this.calcularDiasEntre(
            cliente.fecha_aviso_corte,
            hoy
          );
          if (diasDesdeAvisoCorte >= config.corte_dias_despues_aviso) {
            await this.cortarServicio(cliente);
          }
        }
        break;

      case EstadoServicioEnum.CORTADO:
        // Solo se reactiva cuando paga
        break;
    }
  }

  private async contarMesesVencidos(usuarioId: number): Promise<number> {
    const hoy = new Date();
    const count = await this.boletaRepository.count({
      where: {
        usuario: { id: usuarioId },
        estado: EstadoBoleta.VENCIDA,
        fechaVencimiento: LessThan(hoy),
      },
    });
    return count;
  }

  private calcularDiasEntre(fecha1: Date, fecha2: Date): number {
    const diff = fecha2.getTime() - new Date(fecha1).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // ==========================================
  // CAMBIAR ESTADO DE SERVICIO
  // ==========================================

  async cambiarEstadoServicio(
    cliente: Usuario,
    nuevoEstado: EstadoServicioEnum,
    automatico: boolean,
    observaciones?: string,
    adminId?: number
  ): Promise<void> {
    const estadoAnterior = cliente.estado_servicio;
    cliente.estado_servicio = nuevoEstado;

    switch (nuevoEstado) {
      case EstadoServicioEnum.AVISO_DEUDA:
        cliente.fecha_aviso_deuda = new Date();
        cliente.tiene_aviso_deuda_activo = true;
        break;

      case EstadoServicioEnum.AVISO_CORTE:
        cliente.fecha_aviso_corte = new Date();
        cliente.tiene_aviso_corte_activo = true;
        break;

      case EstadoServicioEnum.CORTADO:
        cliente.fecha_corte = new Date();
        cliente.servicio_cortado = true;
        break;

      case EstadoServicioEnum.ACTIVO:
        cliente.tiene_aviso_deuda_activo = false;
        cliente.tiene_aviso_corte_activo = false;
        cliente.servicio_cortado = false;
        break;
    }

    await this.usuarioRepository.save(cliente);

    // Registrar en historial
    await this.estadoServicioRepository.save({
      usuario_id: cliente.id,
      estado: nuevoEstado,
      fecha_cambio: new Date(),
      observaciones: observaciones || `Cambió de ${estadoAnterior} a ${nuevoEstado}`,
      automatico: automatico,
      usuario_admin_id: adminId,
    } as unknown as EstadoServicio);
  }

  async cortarServicio(cliente: Usuario): Promise<void> {
    await this.cambiarEstadoServicio(
      cliente,
      EstadoServicioEnum.CORTADO,
      true,
      'Servicio cortado automáticamente por falta de pago'
    );
    
    // TODO: Aquí se podría enviar notificación al operativo para corte físico
    console.log(`🔴 CORTE DE SERVICIO - Cliente ${cliente.padron} - ${cliente.nombre}`);
  }

  // ==========================================
  // OBTENER DATOS
  // ==========================================

  async obtenerHistorialEstados(usuarioId: number): Promise<EstadoServicio[]> {
    return this.estadoServicioRepository.find({
      where: { usuario_id: usuarioId },
      order: { fecha_cambio: 'DESC' },
    });
  }

  // ==========================================
  // VERIFICAR REGULARIZACIÓN
  // ==========================================

  async verificarRegularizacionCliente(cliente: Usuario): Promise<void> {
    // Verificar si pagó todas las boletas vencidas
    const boletasVencidas = await this.boletaRepository.count({
      where: {
        usuario: { id: cliente.id },
        estado: EstadoBoleta.VENCIDA,
      },
    });

    if (boletasVencidas === 0 && cliente.estado_servicio !== EstadoServicioEnum.ACTIVO) {
      // Regularizó su situación, volver a ACTIVO
      await this.cambiarEstadoServicio(
        cliente,
        EstadoServicioEnum.ACTIVO,
        true,
        'Cliente regularizó su situación de pago'
      );
    }
  }

  // ==========================================
  // CALCULAR DEUDA TOTAL
  // ==========================================

  async calcularDeudaTotal(usuarioId: number): Promise<number> {
    const boletas = await this.boletaRepository.find({
      where: {
        usuario: { id: usuarioId },
        estado: EstadoBoleta.VENCIDA,
      },
    });

    return boletas.reduce((sum, b) => sum + Number(b.total), 0);
  }
}

