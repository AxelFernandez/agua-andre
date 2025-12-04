import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ConceptoFijo } from './concepto-fijo.entity';
import { EscalaConsumo } from './escala-consumo.entity';
import { CargoExtra } from './cargo-extra.entity';

@Entity('tarifarios')
export class Tarifario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'date' })
  vigencia_desde: Date;

  @Column({ type: 'date', nullable: true })
  vigencia_hasta: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => ConceptoFijo, conceptoFijo => conceptoFijo.tarifario)
  conceptosFijos: ConceptoFijo[];

  @OneToMany(() => EscalaConsumo, escalaConsumo => escalaConsumo.tarifario)
  escalasConsumo: EscalaConsumo[];

  @OneToMany(() => CargoExtra, cargoExtra => cargoExtra.tarifario)
  cargosExtras: CargoExtra[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

