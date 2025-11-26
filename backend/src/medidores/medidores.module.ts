import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedidoresController } from './medidores.controller';
import { MedidoresService } from './medidores.service';
import { Medidor } from '../entities/medidor.entity';
import { Usuario } from '../entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Medidor, Usuario])],
  controllers: [MedidoresController],
  providers: [MedidoresService],
  exports: [MedidoresService],
})
export class MedidoresModule {}
