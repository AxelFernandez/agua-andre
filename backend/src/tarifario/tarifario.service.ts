import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifario } from '../entities/tarifario.entity';
import { ConceptoFijo, TipoCliente } from '../entities/concepto-fijo.entity';
import { EscalaConsumo } from '../entities/escala-consumo.entity';
import { CargoExtra } from '../entities/cargo-extra.entity';
import { ConfiguracionAvisos } from '../entities/configuracion-avisos.entity';

@Injectable()
export class TarifarioService {
  constructor(
    @InjectRepository(Tarifario)
    private tarifarioRepository: Repository<Tarifario>,
    @InjectRepository(ConceptoFijo)
    private conceptoFijoRepository: Repository<ConceptoFijo>,
    @InjectRepository(EscalaConsumo)
    private escalaConsumoRepository: Repository<EscalaConsumo>,
    @InjectRepository(CargoExtra)
    private cargoExtraRepository: Repository<CargoExtra>,
    @InjectRepository(ConfiguracionAvisos)
    private configuracionAvisosRepository: Repository<ConfiguracionAvisos>,
  ) {}

  // ==========================================
  // TARIFARIO - OBTENER
  // ==========================================

  async obtenerTarifarioActivo(): Promise<Tarifario> {
    return this.tarifarioRepository.findOne({
      where: { activo: true },
      relations: ['conceptosFijos', 'escalasConsumo', 'cargosExtras'],
    });
  }

  async obtenerConfiguracionAvisos(): Promise<ConfiguracionAvisos> {
    let config = await this.configuracionAvisosRepository.findOne({
      where: { activo: true },
    });

    // Si no existe, crear configuración por defecto
    if (!config) {
      config = this.configuracionAvisosRepository.create({
        aviso_deuda_meses: 2,
        aviso_deuda_monto: 4000,
        aviso_corte_dias_despues: 15,
        aviso_corte_monto: 0,
        corte_dias_despues_aviso: 2,
        reconexion_monto: 74000,
        reconexion_cuotas_max: 5,
        recargo_mora_monto: 400,
        recargo_mora_activo: true,
        activo: true,
      });
      await this.configuracionAvisosRepository.save(config);
    }

    return config;
  }

  async obtenerEscalasConsumo(tipoCliente: string): Promise<EscalaConsumo[]> {
    const tarifarioActivo = await this.obtenerTarifarioActivo();
    
    if (!tarifarioActivo) {
      return [];
    }

    return this.escalaConsumoRepository.find({
      where: {
        tarifario_id: tarifarioActivo.id,
        tipo_cliente: tipoCliente as TipoCliente,
        activo: true,
      },
      order: {
        orden: 'ASC',
      },
    });
  }

  async obtenerConceptosFijos(tipoCliente: string): Promise<ConceptoFijo[]> {
    const tarifarioActivo = await this.obtenerTarifarioActivo();
    
    if (!tarifarioActivo) {
      return [];
    }

    return this.conceptoFijoRepository.find({
      where: {
        tarifario_id: tarifarioActivo.id,
        tipo_cliente: tipoCliente as TipoCliente,
        activo: true,
      },
    });
  }

  // ==========================================
  // CRUD - TARIFARIO
  // ==========================================

  async crearTarifario(data: Partial<Tarifario>): Promise<Tarifario> {
    const tarifario = this.tarifarioRepository.create(data);
    return this.tarifarioRepository.save(tarifario);
  }

  async actualizarConceptoFijo(id: number, monto: number): Promise<ConceptoFijo> {
    const concepto = await this.conceptoFijoRepository.findOne({ where: { id } });
    if (!concepto) {
      throw new Error('Concepto fijo no encontrado');
    }
    concepto.monto = monto;
    return this.conceptoFijoRepository.save(concepto);
  }

  async actualizarEscalaConsumo(id: number, precio: number): Promise<EscalaConsumo> {
    const escala = await this.escalaConsumoRepository.findOne({ where: { id } });
    if (!escala) {
      throw new Error('Escala de consumo no encontrada');
    }
    escala.precio_por_m3 = precio;
    return this.escalaConsumoRepository.save(escala);
  }

  async actualizarCargoExtra(id: number, monto: number): Promise<CargoExtra> {
    const cargo = await this.cargoExtraRepository.findOne({ where: { id } });
    if (!cargo) {
      throw new Error('Cargo extra no encontrado');
    }
    cargo.monto = monto;
    return this.cargoExtraRepository.save(cargo);
  }

  async actualizarConfiguracionAvisos(data: Partial<ConfiguracionAvisos>): Promise<ConfiguracionAvisos> {
    const config = await this.obtenerConfiguracionAvisos();
    Object.assign(config, data);
    return this.configuracionAvisosRepository.save(config);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  async obtenerCargoExtraPorCodigo(codigo: string): Promise<CargoExtra | null> {
    return this.cargoExtraRepository.findOne({
      where: { codigo, activo: true },
    });
  }

  async calcularServicioBase(
    tipoCliente: TipoCliente,
    consumo_m3: number,
    tiene_medidor: boolean,
    tarifario_id: number
  ): Promise<number> {
    // Determinar qué tarifa aplicar
    let codigoTarifa = 'SERVICIO_BASE_T1';

    // Entidades públicas tienen su propio concepto fijo
    if (tipoCliente === TipoCliente.ENTIDAD_PUBLICA) {
      codigoTarifa = 'SERVICIO_BASE_EP';
    } else if (tiene_medidor && consumo_m3 > 20) {
      codigoTarifa = 'SERVICIO_BASE_T2';
    }

    const concepto = await this.conceptoFijoRepository.findOne({
      where: {
        tarifario_id: tarifario_id,
        tipo_cliente: tipoCliente,
        codigo: codigoTarifa,
        activo: true,
      },
    });

    return concepto ? Number(concepto.monto) : 0;
  }

  async calcularDesgloseConsumo(
    tipoCliente: TipoCliente,
    consumo_m3: number,
    tiene_medidor: boolean,
    tarifario_id: number
  ): Promise<{ desglose: any[]; monto_total: number }> {
    if (!tiene_medidor || consumo_m3 === 0) {
      return { desglose: [], monto_total: 0 };
    }

    // Obtener escalas ordenadas
    const escalas = await this.escalaConsumoRepository.find({
      where: {
        tarifario_id: tarifario_id,
        tipo_cliente: tipoCliente,
        activo: true,
      },
      order: { orden: 'ASC' },
    });

    let monto_total = 0;
    const desglose = [];

    for (const escala of escalas) {
      const desde = escala.desde_m3;
      const hasta = escala.hasta_m3 || 99999;
      const precio = Number(escala.precio_por_m3);

      if (consumo_m3 > desde) {
        const m3_en_esta_escala = Math.min(consumo_m3, hasta) - desde;
        if (m3_en_esta_escala > 0) {
          const subtotal = Number((m3_en_esta_escala * precio).toFixed(2));
          monto_total += subtotal;
          
          // Guardar desglose
          desglose.push({
            desde: Number(desde),
            hasta: escala.hasta_m3 !== null ? Number(escala.hasta_m3) : null,
            consumo_m3: Number(m3_en_esta_escala.toFixed(2)),
            precio_por_m3: Number(precio),
            subtotal: Number(subtotal),
          });
        }
      }
    }

    return { desglose, monto_total: Number(monto_total.toFixed(2)) };
  }
}
