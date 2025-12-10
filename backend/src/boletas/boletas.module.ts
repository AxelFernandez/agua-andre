import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletasService } from './boletas.service';
import { BoletasController } from './boletas.controller';
import { Boleta } from '../entities/boleta.entity';
import { Lectura } from '../entities/lectura.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [TypeOrmModule.forFeature([Boleta, Lectura]), AuditoriaModule],
  providers: [BoletasService],
  controllers: [BoletasController],
  exports: [BoletasService],
})
export class BoletasModule {}

