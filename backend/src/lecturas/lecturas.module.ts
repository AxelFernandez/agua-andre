import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LecturasService } from './lecturas.service';
import { LecturasController } from './lecturas.controller';
import { Lectura } from '../entities/lectura.entity';
import { Medidor } from '../entities/medidor.entity';
import { Usuario } from '../entities/usuario.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lectura, Medidor, Usuario]), AuditoriaModule],
  providers: [LecturasService],
  controllers: [LecturasController],
  exports: [LecturasService],
})
export class LecturasModule {}

