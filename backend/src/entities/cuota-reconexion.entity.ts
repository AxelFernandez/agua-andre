import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PlanPagoReconexion } from './plan-pago-reconexion.entity';

export enum EstadoCuota {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  VENCIDO = 'VENCIDO'
}

@Entity('cuotas_reconexion')
export class CuotaReconexion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  plan_pago_reconexion_id: number;

  @ManyToOne(() => PlanPagoReconexion, plan => plan.cuotas)
  @JoinColumn({ name: 'plan_pago_reconexion_id' })
  planPagoReconexion: PlanPagoReconexion;

  @Column({ type: 'int' })
  numero_cuota: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'int', nullable: true })
  boleta_id: number; // FK a boletas (en qué boleta se cobra esta cuota)

  @Column({ type: 'date' })
  fecha_vencimiento: Date;

  @Column({ type: 'date', nullable: true })
  fecha_pago: Date;

  @Column({ 
    type: 'enum', 
    enum: EstadoCuota,
    default: EstadoCuota.PENDIENTE
  })
  estado: EstadoCuota;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

