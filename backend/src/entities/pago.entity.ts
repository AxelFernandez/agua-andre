import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Boleta } from './boleta.entity';
import { Usuario } from './usuario.entity';

export enum MetodoPago {
  TRANSFERENCIA = 'transferencia',
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
}

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Boleta, boleta => boleta.pagos)
  boleta: Boleta;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fechaPago: Date;

  @Column({ 
    type: 'enum',
    enum: MetodoPago,
    default: MetodoPago.TRANSFERENCIA 
  })
  metodoPago: MetodoPago;

  @Column({ nullable: true })
  comprobanteUrl: string; // URL del comprobante subido

  @Column({ nullable: true })
  referencia: string; // Referencia de la transferencia

  @Column({ 
    type: 'enum',
    enum: EstadoPago,
    default: EstadoPago.PENDIENTE 
  })
  estado: EstadoPago;

  @ManyToOne(() => Usuario, { nullable: true })
  verificadoPor: Usuario; // Administrativo que verificó el pago

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

