import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('configuracion_avisos')
export class ConfiguracionAvisos {
  @PrimaryGeneratedColumn()
  id: number;

  // AVISO DE DEUDA
  @Column({ type: 'int', default: 2 })
  aviso_deuda_meses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 4000 })
  aviso_deuda_monto: number;

  // AVISO DE CORTE
  @Column({ type: 'int', default: 15 })
  aviso_corte_dias_despues: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  aviso_corte_monto: number;

  // CORTE DE SERVICIO
  @Column({ type: 'int', default: 2 })
  corte_dias_despues_aviso: number;

  // RECONEXIÓN
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 74000 })
  reconexion_monto: number;

  @Column({ type: 'int', default: 5 })
  reconexion_cuotas_max: number;

  // RECARGO MORA
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 400 })
  recargo_mora_monto: number;

  @Column({ type: 'boolean', default: true })
  recargo_mora_activo: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

