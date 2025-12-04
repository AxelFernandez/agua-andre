import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tarifario } from './tarifario.entity';
import { TipoCliente } from './concepto-fijo.entity';

@Entity('escalas_consumo')
export class EscalaConsumo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tarifario_id: number;

  @ManyToOne(() => Tarifario, tarifario => tarifario.escalasConsumo)
  @JoinColumn({ name: 'tarifario_id' })
  tarifario: Tarifario;

  @Column({ 
    type: 'enum', 
    enum: TipoCliente,
    default: TipoCliente.PARTICULARES
  })
  tipo_cliente: TipoCliente;

  @Column({ type: 'int' })
  desde_m3: number;

  @Column({ type: 'int', nullable: true })
  hasta_m3: number; // null = infinito

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_por_m3: number;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}

