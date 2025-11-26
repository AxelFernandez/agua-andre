import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Lectura } from './lectura.entity';

@Entity('medidores')
export class Medidor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numeroSerie: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fechaInstalacion: Date;

  @Column({ type: 'date', nullable: true })
  fechaBaja: Date; // Fecha cuando se da de baja el medidor (se rompe, se reemplaza, etc.)

  @Column({ type: 'int', default: 0 })
  lecturaInicial: number; // Lectura inicial del medidor (normalmente 0, pero puede variar)

  @Column({ type: 'boolean', default: true })
  activo: boolean; // Solo un medidor activo por cliente

  @Column({ type: 'text', nullable: true })
  motivoBaja: string; // Razón por la que se dio de baja (roto, reemplazo, etc.)

  @ManyToOne(() => Usuario, usuario => usuario.medidores, { eager: true })
  usuario: Usuario;

  @OneToMany(() => Lectura, lectura => lectura.medidor)
  lecturas: Lectura[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

