import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { CuotaReconexion } from './cuota-reconexion.entity';

export enum EstadoPlanPago {
  ACTIVO = 'ACTIVO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO'
}

@Entity('planes_pago_reconexion')
export class PlanPagoReconexion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto_reconexion: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_deuda_anterior: number;

  @Column({ type: 'int' })
  cantidad_cuotas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto_cuota: number;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ 
    type: 'enum', 
    enum: EstadoPlanPago,
    default: EstadoPlanPago.ACTIVO
  })
  estado: EstadoPlanPago;

  @OneToMany(() => CuotaReconexion, cuota => cuota.planPagoReconexion)
  cuotas: CuotaReconexion[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

