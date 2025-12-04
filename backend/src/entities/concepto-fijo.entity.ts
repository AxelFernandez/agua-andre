import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tarifario } from './tarifario.entity';

export enum TipoCliente {
  PARTICULARES = 'Particulares',
  ENTIDAD_PUBLICA = 'Entidad Pública'
}

@Entity('conceptos_fijos')
export class ConceptoFijo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tarifario_id: number;

  @ManyToOne(() => Tarifario, tarifario => tarifario.conceptosFijos)
  @JoinColumn({ name: 'tarifario_id' })
  tarifario: Tarifario;

  @Column({ type: 'varchar', length: 100 })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ 
    type: 'enum', 
    enum: TipoCliente,
    default: TipoCliente.PARTICULARES
  })
  tipo_cliente: TipoCliente;

  @Column({ type: 'int', nullable: true })
  condicion_umbral_m3: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

