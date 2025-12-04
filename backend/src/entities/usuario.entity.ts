import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Zona } from './zona.entity';
import { Medidor } from './medidor.entity';
import { Boleta } from './boleta.entity';
import { EstadoServicioEnum } from './estado-servicio.entity';

export enum RolUsuario {
  CLIENTE = 'cliente',
  OPERARIO = 'operario',
  ADMINISTRATIVO = 'administrativo',
}

export enum TipoUsuario {
  PARTICULARES = 'Particulares',
  ENTIDAD_PUBLICA = 'Entidad Pública',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  localidad: string;

  @Column({ nullable: true })
  codigoPosta: string;

  @Column({ nullable: true })
  codigoPostal: string;

  @ManyToOne(() => Zona, zona => zona.usuarios, { eager: true })
  zona: Zona;

  @Column()
  direccion: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ unique: true, nullable: true })
  padron: string; // Formato: zona-idUsuario (ej: "10-0050") - Solo para clientes

  @Column({ 
    type: 'enum',
    enum: TipoUsuario,
    default: TipoUsuario.PARTICULARES 
  })
  tipo: TipoUsuario;

  @Column({ nullable: true })
  cuit: string;

  @Column({ nullable: true })
  email: string;

  @Column({ 
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.CLIENTE 
  })
  rol: RolUsuario;

  @Column({ nullable: true })
  password: string; // Solo para operarios y administrativos

  @Column({ default: true })
  activo: boolean; // Estado del cliente (activo/inactivo)

  // Campos de estado del servicio
  @Column({ 
    type: 'enum', 
    enum: EstadoServicioEnum,
    default: EstadoServicioEnum.ACTIVO
  })
  estado_servicio: EstadoServicioEnum;

  @Column({ type: 'timestamp', nullable: true })
  fecha_aviso_deuda: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_aviso_corte: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_corte: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_ultima_reconexion: Date;

  // Flags de control
  @Column({ type: 'boolean', default: false })
  tiene_aviso_deuda_activo: boolean;

  @Column({ type: 'boolean', default: false })
  tiene_aviso_corte_activo: boolean;

  @Column({ type: 'boolean', default: false })
  servicio_cortado: boolean;

  @OneToMany(() => Medidor, medidor => medidor.usuario)
  medidores: Medidor[]; // Historial de medidores del cliente

  @OneToMany(() => Boleta, boleta => boleta.usuario)
  boletas: Boleta[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

