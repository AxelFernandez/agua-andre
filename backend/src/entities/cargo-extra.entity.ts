import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tarifario } from './tarifario.entity';

export enum TipoAplicacionCargo {
  UNA_VEZ = 'UNA_VEZ',
  POR_EVENTO = 'POR_EVENTO',
  AUTOMATICO = 'AUTOMATICO',
  MANUAL = 'MANUAL'
}

@Entity('cargos_extras')
export class CargoExtra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tarifario_id: number;

  @ManyToOne(() => Tarifario, tarifario => tarifario.cargosExtras)
  @JoinColumn({ name: 'tarifario_id' })
  tarifario: Tarifario;

  @Column({ type: 'varchar', length: 100, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ 
    type: 'enum', 
    enum: TipoAplicacionCargo,
    default: TipoAplicacionCargo.MANUAL
  })
  tipo_aplicacion: TipoAplicacionCargo;

  @Column({ type: 'int', nullable: true })
  aplica_despues_meses: number;

  @Column({ type: 'int', nullable: true })
  aplica_despues_dias: number;

  @Column({ type: 'int', nullable: true })
  condicion_dias: number;

  @Column({ type: 'boolean', default: false })
  es_gratuito: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

