import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Boleta } from './boleta.entity';
import { CargoExtra } from './cargo-extra.entity';

@Entity('boleta_cargos_extras')
export class BoletaCargoExtra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  boleta_id: number;

  @ManyToOne(() => Boleta)
  @JoinColumn({ name: 'boleta_id' })
  boleta: Boleta;

  @Column({ type: 'int' })
  cargo_extra_id: number;

  @ManyToOne(() => CargoExtra)
  @JoinColumn({ name: 'cargo_extra_id' })
  cargoExtra: CargoExtra;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'boolean', default: true })
  aplicado_automaticamente: boolean;

  @CreateDateColumn()
  created_at: Date;
}

