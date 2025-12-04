import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

export enum EstadoServicioEnum {
  ACTIVO = 'ACTIVO',
  AVISO_DEUDA = 'AVISO_DEUDA',
  AVISO_CORTE = 'AVISO_CORTE',
  CORTADO = 'CORTADO'
}

@Entity('estados_servicio')
export class EstadoServicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ 
    type: 'enum', 
    enum: EstadoServicioEnum
  })
  estado: EstadoServicioEnum;

  @Column({ type: 'timestamp' })
  fecha_cambio: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'boolean', default: true })
  automatico: boolean;

  @Column({ type: 'int', nullable: true })
  usuario_admin_id: number;

  @CreateDateColumn()
  created_at: Date;
}

