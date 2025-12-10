import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { Pago } from '../entities/pago.entity';
import { Boleta } from '../entities/boleta.entity';
import { Usuario } from '../entities/usuario.entity';
import { TarifarioModule } from '../tarifario/tarifario.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Boleta, Usuario]),
    TarifarioModule,
    AuditoriaModule,
  ],
  providers: [PagosService],
  controllers: [PagosController],
  exports: [PagosService],
})
export class PagosModule {}

