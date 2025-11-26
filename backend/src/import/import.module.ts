import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { Usuario } from '../entities/usuario.entity';
import { Zona } from '../entities/zona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Zona])],
  providers: [ImportService],
  controllers: [ImportController],
  exports: [ImportService],
})
export class ImportModule {}

