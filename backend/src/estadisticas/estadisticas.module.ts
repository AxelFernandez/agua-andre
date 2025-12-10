import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';
import { Pago } from '../entities/pago.entity';
import { Usuario } from '../entities/usuario.entity';
import { Medidor } from '../entities/medidor.entity';
import { Boleta } from '../entities/boleta.entity';
import { Zona } from '../entities/zona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Usuario, Medidor, Boleta, Zona])],
  providers: [EstadisticasService],
  controllers: [EstadisticasController],
})
export class EstadisticasModule {}

