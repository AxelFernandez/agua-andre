import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleta, EstadoBoleta } from '../entities/boleta.entity';
import { Usuario, RolUsuario, TipoUsuario } from '../entities/usuario.entity';
import { Lectura } from '../entities/lectura.entity';
import { Medidor } from '../entities/medidor.entity';
import { BoletaCargoExtra } from '../entities/boleta-cargo-extra.entity';
import { TipoCliente } from '../entities/concepto-fijo.entity';
import { TarifarioService } from './tarifario.service';
import { ReconexionService } from './reconexion.service';

@Injectable()
export class BoletaGeneratorService {
  constructor(
    @InjectRepository(Boleta)
    private boletaRepository: Repository<Boleta>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Lectura)
    private lecturaRepository: Repository<Lectura>,
    @InjectRepository(Medidor)
    private medidorRepository: Repository<Medidor>,
    @InjectRepository(BoletaCargoExtra)
    private boletaCargoExtraRepository: Repository<BoletaCargoExtra>,
    private tarifarioService: TarifarioService,
    @Inject(forwardRef(() => ReconexionService))
    private reconexionService: ReconexionService,
  ) {}

  // ==========================================
  // GENERACIÓN DE BOLETAS
  // ==========================================

  async generarBoletaMensual(usuarioId: number, mes: number, anio: number): Promise<Boleta> {
    // Verificar si ya existe una boleta para este período
    const boletaExistente = await this.boletaRepository.findOne({
      where: {
        usuario: { id: usuarioId },
        mes: mes,
        anio: anio,
      },
      relations: ['tarifario', 'lectura'],
    });

    if (boletaExistente) {
      // Si la boleta está PAGADA o en PROCESAMIENTO, no recalcular
      if (boletaExistente.estado === EstadoBoleta.PAGADA || 
          boletaExistente.estado === EstadoBoleta.PROCESANDO) {
        return boletaExistente;
      }

      // Si la boleta está PENDIENTE, verificar si hay lecturas más recientes
      const usuario = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
        relations: ['zona', 'medidores'],
      });

      const medidorActivo = usuario?.medidores?.find(m => m.activo);
      
      if (medidorActivo) {
        const lecturaMasReciente = await this.lecturaRepository.findOne({
          where: {
            medidor: { id: medidorActivo.id },
            mes: mes,
            anio: anio,
          },
          order: { fechaLectura: 'DESC' },
        });

        // Si hay una lectura más reciente diferente a la de la boleta, recalcular
        if (lecturaMasReciente && lecturaMasReciente.id !== boletaExistente.lectura_id) {
          console.log(`🔄 Boleta #${boletaExistente.id} PENDIENTE con lectura desactualizada. Recalculando...`);
          // Eliminar la boleta vieja para regenerarla
          await this.boletaRepository.remove(boletaExistente);
          // Continuar con la generación normal
        } else {
          // La lectura es la misma, retornar boleta existente
          return boletaExistente;
        }
      } else {
        // No hay medidor, retornar boleta existente
        return boletaExistente;
      }
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['zona', 'medidores'],
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const tarifario = await this.tarifarioService.obtenerTarifarioActivo();
    if (!tarifario) {
      throw new Error('No hay tarifario activo configurado');
    }

    // Obtener medidor activo
    const medidorActivo = usuario.medidores?.find(m => m.activo);
    const tiene_medidor = !!medidorActivo;

    // Obtener consumo del período
    let consumo_m3 = 0;
    let lecturaId = null;

    if (tiene_medidor) {
      // Obtener la lectura MÁS RECIENTE del mes actual
      const lecturaActualMes = await this.lecturaRepository.findOne({
        where: {
          medidor: { id: medidorActivo.id },
          mes: mes,
          anio: anio,
        },
        order: { fechaLectura: 'DESC' },
      });

      if (lecturaActualMes) {
        lecturaId = lecturaActualMes.id;

        // Obtener la lectura MÁS RECIENTE del mes ANTERIOR
        const mesAnterior = mes === 1 ? 12 : mes - 1;
        const anioAnterior = mes === 1 ? anio - 1 : anio;

        const lecturaAnteriorMes = await this.lecturaRepository.findOne({
          where: {
            medidor: { id: medidorActivo.id },
            mes: mesAnterior,
            anio: anioAnterior,
          },
          order: { fechaLectura: 'DESC' },
        });

        // Calcular consumo del mes: Lectura final del mes - Lectura final del mes anterior
        const lecturaAnterior = lecturaAnteriorMes 
          ? lecturaAnteriorMes.lecturaActual 
          : medidorActivo.lecturaInicial;

        consumo_m3 = lecturaActualMes.lecturaActual - lecturaAnterior;

        console.log(`📊 Consumo calculado para boleta: Lectura actual ${lecturaActualMes.lecturaActual} - Lectura anterior ${lecturaAnterior} = ${consumo_m3} m³`);
      }
    }

    // Convertir TipoUsuario a TipoCliente
    const tipoCliente = usuario.tipo === TipoUsuario.PARTICULARES 
      ? TipoCliente.PARTICULARES 
      : TipoCliente.ENTIDAD_PUBLICA;

    // Calcular montos
    const monto_servicio_base = await this.tarifarioService.calcularServicioBase(
      tipoCliente,
      consumo_m3,
      tiene_medidor,
      tarifario.id
    );

    // Calcular desglose de consumo con precios del momento
    const resultadoConsumo = await this.tarifarioService.calcularDesgloseConsumo(
      tipoCliente,
      consumo_m3,
      tiene_medidor,
      tarifario.id
    );
    const monto_consumo = resultadoConsumo.monto_total;
    const desglose_consumo = resultadoConsumo.desglose;

    const subtotal = Number(monto_servicio_base) + Number(monto_consumo);

    // Crear boleta
    const boleta = this.boletaRepository.create({
      usuario: usuario,
      tarifario_id: tarifario.id,
      lectura_id: lecturaId,
      mes: mes,
      anio: anio,
      consumo_m3: Number(consumo_m3),
      tiene_medidor: tiene_medidor,
      monto_servicio_base: Number(monto_servicio_base),
      monto_consumo: Number(monto_consumo),
      desglose_consumo: desglose_consumo,
      subtotal: Number(subtotal),
      total_cargos_extras: 0,
      fechaEmision: new Date(),
      fechaVencimiento: this.calcularFechaVencimiento(mes, anio),
      estado: EstadoBoleta.PENDIENTE,
      estado_servicio_cliente: usuario.estado_servicio,
      total: Number(subtotal),
      // Legacy fields
      montoTotal: Number(subtotal),
      montoBase: Number(monto_servicio_base),
      recargos: 0,
    });

    const boletaGuardada = await this.boletaRepository.save(boleta);

    // Aplicar cargos extras automáticos
    await this.aplicarCargosExtrasAutomaticos(boletaGuardada, usuario);

    // Verificar y agregar cuota de plan de reconexión
    await this.reconexionService.agregarCuotaPlanReconexion(boletaGuardada, usuario);

    // Recalcular total
    await this.recalcularTotalBoleta(boletaGuardada.id);

    return this.boletaRepository.findOne({
      where: { id: boletaGuardada.id },
      relations: ['usuario', 'tarifario', 'lectura'],
    });
  }

  // ==========================================
  // CARGOS EXTRAS AUTOMÁTICOS
  // ==========================================

  private async aplicarCargosExtrasAutomaticos(
    boleta: Boleta,
    usuario: Usuario
  ): Promise<void> {
    const cargos = [];

    // AVISO DE DEUDA (si tiene el flag activo)
    if (usuario.tiene_aviso_deuda_activo) {
      const cargo = await this.tarifarioService.obtenerCargoExtraPorCodigo('AVISO_DEUDA');

      if (cargo) {
        cargos.push({
          cargo_extra_id: cargo.id,
          monto: Number(cargo.monto),
          descripcion: 'Aviso de deuda por 2 meses sin pagar',
          aplicado_automaticamente: true,
        });
      }
    }

    // Guardar cargos extras
    let total_cargos = 0;
    for (const cargo of cargos) {
      await this.boletaCargoExtraRepository.save({
        boleta_id: boleta.id,
        ...cargo,
      });
      total_cargos += Number(cargo.monto);
    }

    // Actualizar total de cargos extras en la boleta
    boleta.total_cargos_extras = Number(total_cargos);
    await this.boletaRepository.save(boleta);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  async recalcularTotalBoleta(boletaId: number): Promise<void> {
    const boleta = await this.boletaRepository.findOne({
      where: { id: boletaId },
    });

    if (!boleta) return;

    // Asegurar que todos los valores son números
    const subtotal = Number(boleta.subtotal) || 0;
    const totalCargosExtras = Number(boleta.total_cargos_extras) || 0;
    const montoCuotaPlan = Number(boleta.monto_cuota_plan) || 0;

    const total = subtotal + totalCargosExtras + montoCuotaPlan;

    boleta.total = Number(total);
    boleta.montoTotal = Number(total); // Legacy
    await this.boletaRepository.save(boleta);
  }

  private calcularFechaVencimiento(mes: number, anio: number): Date {
    // Vence el día 10 del mes siguiente
    let mesVencimiento = mes + 1;
    let anioVencimiento = anio;

    if (mesVencimiento > 12) {
      mesVencimiento = 1;
      anioVencimiento++;
    }

    return new Date(anioVencimiento, mesVencimiento - 1, 10);
  }

  // ==========================================
  // GENERACIÓN MASIVA DE BOLETAS
  // ==========================================

  async generarBoletasMasivas(mes: number, anio: number): Promise<{
    totalClientes: number;
    boletasGeneradas: number;
    boletasExistentes: number;
    errores: { usuarioId: number; nombre: string; error: string }[];
  }> {
    // Obtener todos los clientes activos
    const clientes = await this.usuarioRepository.find({
      where: {
        rol: RolUsuario.CLIENTE,
        activo: true,
      },
      relations: ['zona', 'medidores'],
    });

    const resultado = {
      totalClientes: clientes.length,
      boletasGeneradas: 0,
      boletasExistentes: 0,
      errores: [] as { usuarioId: number; nombre: string; error: string }[],
    };

    for (const cliente of clientes) {
      try {
        // Verificar si ya existe boleta
        const boletaExistente = await this.boletaRepository.findOne({
          where: {
            usuario: { id: cliente.id },
            mes: mes,
            anio: anio,
          },
        });

        if (boletaExistente) {
          resultado.boletasExistentes++;
          continue;
        }

        // Generar boleta
        await this.generarBoletaMensual(cliente.id, mes, anio);
        resultado.boletasGeneradas++;
      } catch (error) {
        resultado.errores.push({
          usuarioId: cliente.id,
          nombre: cliente.nombre,
          error: error.message,
        });
      }
    }

    return resultado;
  }

  // ==========================================
  // OBTENER BOLETAS
  // ==========================================

  async obtenerBoletasParaPDF(mes: number, anio: number): Promise<Boleta[]> {
    return this.boletaRepository.find({
      where: {
        mes: mes,
        anio: anio,
      },
      relations: ['usuario', 'usuario.zona', 'usuario.medidores', 'lectura', 'tarifario'],
      order: {
        usuario: {
          padron: 'ASC',
        },
      },
    });
  }

  async obtenerBoletaPorId(id: number): Promise<Boleta> {
    return this.boletaRepository.findOne({
      where: { id },
      relations: ['usuario', 'usuario.zona', 'usuario.medidores', 'lectura', 'tarifario'],
    });
  }

  // ==========================================
  // FORZAR RECÁLCULO DE BOLETA
  // ==========================================

  async forzarRecalculoBoleta(boletaId: number): Promise<Boleta> {
    const boletaExistente = await this.boletaRepository.findOne({
      where: { id: boletaId },
      relations: ['usuario', 'lectura'],
    });

    if (!boletaExistente) {
      throw new Error('Boleta no encontrada');
    }

    // No permitir recalcular boletas pagadas
    if (boletaExistente.estado === EstadoBoleta.PAGADA) {
      throw new Error('No se puede recalcular una boleta que ya fue pagada');
    }

    const usuarioId = boletaExistente.usuario.id;
    const mes = boletaExistente.mes;
    const anio = boletaExistente.anio;

    console.log(`🔄 Forzando recálculo de boleta #${boletaId} para usuario ${usuarioId}, período ${mes}/${anio}`);

    // Eliminar la boleta existente
    await this.boletaRepository.remove(boletaExistente);

    // Regenerar la boleta con los datos actuales
    return this.generarBoletaMensual(usuarioId, mes, anio);
  }
}

