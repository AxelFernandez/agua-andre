import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Lectura } from './lectura.entity';
import { Pago } from './pago.entity';

export enum EstadoBoleta {
  PENDIENTE = 'pendiente',
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

  @OneToOne(() => Lectura)
  @JoinColumn()
  lectura: Lectura;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'date' })
  fechaEmision: Date;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

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

