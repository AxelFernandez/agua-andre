import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from '../entities/usuario.entity';
import { Zona } from '../entities/zona.entity';
import { Medidor } from '../entities/medidor.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { TarifarioModule } from '../tarifario/tarifario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Zona, Medidor]),
    AuditoriaModule,
    TarifarioModule,
  ],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService],
})
export class UsuariosModule {}

