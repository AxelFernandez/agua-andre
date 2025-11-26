import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Medidor } from './medidor.entity';
import { Usuario } from './usuario.entity';

@Entity('lecturas')
export class Lectura {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Medidor, medidor => medidor.lecturas)
  medidor: Medidor;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lecturaActual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  lecturaAnterior: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consumoM3: number; // Metros cúbicos consumidos

  @Column({ type: 'date' })
  fechaLectura: Date;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  anio: number;

  @ManyToOne(() => Usuario, { nullable: true })
  operario: Usuario; // El operario que tomó la lectura

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

