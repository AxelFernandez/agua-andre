import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export enum TipoAccionAuditoria {
  CREACION = 'creacion',
  ACTUALIZACION = 'actualizacion',
  ELIMINACION = 'eliminacion',
  RECALCULO = 'recalculo',
}

@Entity('auditoria_registros')
export class AuditoriaRegistro {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  usuario?: Usuario;

  @Column({ type: 'varchar', length: 100 })
  modulo: string;

  @Column({ type: 'varchar', length: 100 })
  entidad: string;

  @Column({ type: 'varchar', length: 120 })
  registroId: string;

  @Column({ type: 'enum', enum: TipoAccionAuditoria })
  accion: TipoAccionAuditoria;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'jsonb', nullable: true })
  datosPrevios?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  datosNuevos?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  creadoEn: Date;
}


