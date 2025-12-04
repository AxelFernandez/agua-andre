import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Lectura } from './lectura.entity';
import { Pago } from './pago.entity';
import { Tarifario } from './tarifario.entity';
import { PlanPagoReconexion } from './plan-pago-reconexion.entity';
import { EstadoServicioEnum } from './estado-servicio.entity';

export enum EstadoBoleta {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  PAGADA = 'pagada',
  VENCIDA = 'vencida',
  ANULADA = 'anulada',
}

@Entity('boletas')
export class Boleta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, usuario => usuario.boletas)
  usuario: Usuario;

  @Column({ type: 'int', nullable: true })
  tarifario_id: number;

  @ManyToOne(() => Tarifario)
  @JoinColumn({ name: 'tarifario_id' })
  tarifario: Tarifario;

  @Column({ type: 'int', nullable: true })
  lectura_id: number;

  @OneToOne(() => Lectura)
  @JoinColumn({ name: 'lectura_id' })
  lectura: Lectura;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  anio: number;

  // Datos del cálculo
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  consumo_m3: number;

  @Column({ type: 'boolean', default: false })
  tiene_medidor: boolean;

  // Montos desglosados
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_servicio_base: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_consumo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_cargos_extras: number;

  // Desglose detallado del consumo (guardado en el momento de generación)
  @Column({ type: 'jsonb', nullable: true })
  desglose_consumo: {
    desde: number;
    hasta: number | null;
    consumo_m3: number;
    precio_por_m3: number;
    subtotal: number;
  }[];

  // Plan de pago de reconexión (si aplica)
  @Column({ type: 'int', nullable: true })
  plan_pago_reconexion_id: number;

  @ManyToOne(() => PlanPagoReconexion)
  @JoinColumn({ name: 'plan_pago_reconexion_id' })
  planPagoReconexion: PlanPagoReconexion;

  @Column({ type: 'int', nullable: true })
  cuota_plan_numero: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_cuota_plan: number;

  // Fechas
  @Column({ type: 'date' })
  fechaEmision: Date;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  @Column({ type: 'date', nullable: true })
  fechaPago: Date;

  // Total final
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Estado del servicio al momento de generar la boleta
  @Column({ 
    type: 'enum', 
    enum: EstadoServicioEnum,
    nullable: true
  })
  estado_servicio_cliente: EstadoServicioEnum;

  // Legacy fields (mantener compatibilidad)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoBase: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  recargos: number;

  @Column({ 
    type: 'enum',
    enum: EstadoBoleta,
    default: EstadoBoleta.PENDIENTE 
  })
  estado: EstadoBoleta;

  @OneToMany(() => Pago, pago => pago.boleta)
  pagos: Pago[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

