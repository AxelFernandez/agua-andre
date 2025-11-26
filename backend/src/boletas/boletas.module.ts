import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletasService } from './boletas.service';
import { BoletasController } from './boletas.controller';
import { Boleta } from '../entities/boleta.entity';
import { Usuario } from '../entities/usuario.entity';
import { Lectura } from '../entities/lectura.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boleta, Usuario, Lectura])],
  providers: [BoletasService],
  controllers: [BoletasController],
  exports: [BoletasService],
})
export class BoletasModule {}

