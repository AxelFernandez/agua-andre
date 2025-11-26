import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LecturasService } from './lecturas.service';
import { LecturasController } from './lecturas.controller';
import { Lectura } from '../entities/lectura.entity';
import { Medidor } from '../entities/medidor.entity';
import { Usuario } from '../entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lectura, Medidor, Usuario])],
  providers: [LecturasService],
  controllers: [LecturasController],
  exports: [LecturasService],
})
export class LecturasModule {}

