import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifario } from '../entities/tarifario.entity';
import { ConceptoFijo, TipoCliente } from '../entities/concepto-fijo.entity';
import { EscalaConsumo } from '../entities/escala-consumo.entity';
import { CargoExtra, TipoAplicacionCargo } from '../entities/cargo-extra.entity';
import { ConfiguracionAvisos } from '../entities/configuracion-avisos.entity';

@Injectable()
export class TarifarioSeedService {
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

  async seedTarifario() {
    console.log('🌱 Seeding tarifario...');

    // 1. Crear tarifario principal
    let tarifario = await this.tarifarioRepository.findOne({ where: { activo: true } });
    
    if (!tarifario) {
      tarifario = this.tarifarioRepository.create({
        nombre: 'Tarifario 2025',
        descripcion: 'Tarifario vigente desde enero 2025 - Asociación de Agua Potable Gustavo André',
        vigencia_desde: new Date('2025-01-01'),
        vigencia_hasta: null,
        activo: true,
      });
      tarifario = await this.tarifarioRepository.save(tarifario);
      console.log('  ✓ Tarifario principal creado');
    }

    // 2. Crear conceptos fijos
    await this.seedConceptosFijos(tarifario.id);

    // 3. Crear escalas de consumo
    await this.seedEscalasConsumo(tarifario.id);

    // 4. Crear cargos extras
    await this.seedCargosExtras(tarifario.id);

    // 5. Crear configuración de avisos
    await this.seedConfiguracionAvisos();

    console.log('✅ Tarifario seeding completado');
  }

  private async seedConceptosFijos(tarifarioId: number) {
    const conceptos = [
      // PARTICULARES
      {
        tarifario_id: tarifarioId,
        codigo: 'SERVICIO_BASE_T1',
        nombre: 'Servicio de Agua Potable (Tarifa 1)',
        descripcion: 'Se aplica para particulares sin servicio medido o con consumo ≤ 20m³',
        monto: 11000,
        tipo_cliente: TipoCliente.PARTICULARES,
        condicion_umbral_m3: 20,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'SERVICIO_BASE_T2',
        nombre: 'Servicio de Agua Potable (Tarifa 2)',
        descripcion: 'Se aplica para particulares con servicio medido y consumo > 20m³',
        monto: 12000,
        tipo_cliente: TipoCliente.PARTICULARES,
        condicion_umbral_m3: 21,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'CUOTA_SOCIAL_T1',
        nombre: 'Cuota Social (Tarifa 1)',
        descripcion: 'Cuota social para Tarifa 1',
        monto: 0,
        tipo_cliente: TipoCliente.PARTICULARES,
        condicion_umbral_m3: null,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'CUOTA_SOCIAL_T2',
        nombre: 'Cuota Social (Tarifa 2)',
        descripcion: 'Cuota social para Tarifa 2',
        monto: 0,
        tipo_cliente: TipoCliente.PARTICULARES,
        condicion_umbral_m3: null,
        activo: true,
      },
      // ENTIDAD PÚBLICA
      {
        tarifario_id: tarifarioId,
        codigo: 'SERVICIO_BASE_EP',
        nombre: 'Servicio de Agua Potable (Entidad Pública)',
        descripcion: 'Servicio base para entidades públicas',
        monto: 12000,
        tipo_cliente: TipoCliente.ENTIDAD_PUBLICA,
        condicion_umbral_m3: null,
        activo: true,
      },
    ];

    for (const concepto of conceptos) {
      const existe = await this.conceptoFijoRepository.findOne({
        where: { codigo: concepto.codigo },
      });
      if (!existe) {
        await this.conceptoFijoRepository.save(concepto);
      }
    }

    console.log('  ✓ Conceptos fijos creados');
  }

  private async seedEscalasConsumo(tarifarioId: number) {
    const escalas = [
      // PARTICULARES
      {
        tarifario_id: tarifarioId,
        tipo_cliente: TipoCliente.PARTICULARES,
        desde_m3: 0,
        hasta_m3: 30,
        precio_por_m3: 0,
        orden: 1,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        tipo_cliente: TipoCliente.PARTICULARES,
        desde_m3: 30, // Cambio: era 31, ahora 30 para calcular 14 m³ correctamente
        hasta_m3: 44,
        precio_por_m3: 1200,
        orden: 2,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        tipo_cliente: TipoCliente.PARTICULARES,
        desde_m3: 44, // Cambio: era 45, ahora 44 para calcular 16 m³ correctamente
        hasta_m3: null, // infinito
        precio_por_m3: 2300,
        orden: 3,
        activo: true,
      },
      // ENTIDAD PÚBLICA
      {
        tarifario_id: tarifarioId,
        tipo_cliente: TipoCliente.ENTIDAD_PUBLICA,
        desde_m3: 0,
        hasta_m3: 70,
        precio_por_m3: 0,
        orden: 1,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        tipo_cliente: TipoCliente.ENTIDAD_PUBLICA,
        desde_m3: 71,
        hasta_m3: null,
        precio_por_m3: 4000,
        orden: 2,
        activo: true,
      },
    ];

    for (const escala of escalas) {
      const existe = await this.escalaConsumoRepository.findOne({
        where: {
          tarifario_id: escala.tarifario_id,
          tipo_cliente: escala.tipo_cliente,
          desde_m3: escala.desde_m3,
        },
      });
      if (!existe) {
        await this.escalaConsumoRepository.save(escala);
      }
    }

    console.log('  ✓ Escalas de consumo creadas');
  }

  private async seedCargosExtras(tarifarioId: number) {
    const cargos = [
      {
        tarifario_id: tarifarioId,
        codigo: 'CONEXION',
        nombre: 'Conexión',
        descripcion: 'Cargo único por conexión inicial del servicio',
        monto: 74000,
        tipo_aplicacion: TipoAplicacionCargo.UNA_VEZ,
        aplica_despues_meses: null,
        aplica_despues_dias: null,
        condicion_dias: null,
        es_gratuito: false,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'RECONEXION',
        nombre: 'Reconexión',
        descripcion: 'Cargo por reconexión del servicio después de corte',
        monto: 74000,
        tipo_aplicacion: TipoAplicacionCargo.POR_EVENTO,
        aplica_despues_meses: null,
        aplica_despues_dias: null,
        condicion_dias: null,
        es_gratuito: false,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'AVISO_DEUDA',
        nombre: 'Aviso de Deuda',
        descripcion: 'Se aplica después de 2 meses sin pagar (60 días)',
        monto: 4000,
        tipo_aplicacion: TipoAplicacionCargo.AUTOMATICO,
        aplica_despues_meses: 2,
        aplica_despues_dias: null,
        condicion_dias: 60,
        es_gratuito: false,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'AVISO_CORTE',
        nombre: 'Aviso de Corte',
        descripcion: 'Notificación de corte 15 días después del aviso de deuda. NO SE COBRA.',
        monto: 0,
        tipo_aplicacion: TipoAplicacionCargo.AUTOMATICO,
        aplica_despues_meses: null,
        aplica_despues_dias: 15,
        condicion_dias: 75,
        es_gratuito: true,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'RECARGO_MORA',
        nombre: 'Recargo fuera de término',
        descripcion: 'Se aplica cuando el cliente paga después del vencimiento',
        monto: 400,
        tipo_aplicacion: TipoAplicacionCargo.AUTOMATICO,
        aplica_despues_meses: null,
        aplica_despues_dias: null,
        condicion_dias: null,
        es_gratuito: false,
        activo: true,
      },
      {
        tarifario_id: tarifarioId,
        codigo: 'CARGO_MANUAL',
        nombre: 'Cargo Manual',
        descripcion: 'Cargo que puede agregar el administrativo manualmente',
        monto: 0,
        tipo_aplicacion: TipoAplicacionCargo.MANUAL,
        aplica_despues_meses: null,
        aplica_despues_dias: null,
        condicion_dias: null,
        es_gratuito: false,
        activo: true,
      },
    ];

    for (const cargo of cargos) {
      const existe = await this.cargoExtraRepository.findOne({
        where: { codigo: cargo.codigo },
      });
      if (!existe) {
        await this.cargoExtraRepository.save(cargo);
      }
    }

    console.log('  ✓ Cargos extras creados');
  }

  private async seedConfiguracionAvisos() {
    const existe = await this.configuracionAvisosRepository.findOne({
      where: { activo: true },
    });

    if (!existe) {
      await this.configuracionAvisosRepository.save({
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
      console.log('  ✓ Configuración de avisos creada');
    }
  }
}

