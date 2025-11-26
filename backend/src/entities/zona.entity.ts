import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('zonas')
export class Zona {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'int', unique: true })
  valor: number; // Ej: 100 para Gustavo André

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => Usuario, usuario => usuario.zona)
  usuarios: Usuario[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

