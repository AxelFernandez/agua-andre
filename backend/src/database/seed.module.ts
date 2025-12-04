import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { TarifarioSeedService } from './tarifario-seed.service';
import { Zona } from '../entities/zona.entity';
import { Usuario } from '../entities/usuario.entity';
import { Tarifario } from '../entities/tarifario.entity';
import { ConceptoFijo } from '../entities/concepto-fijo.entity';
import { EscalaConsumo } from '../entities/escala-consumo.entity';
import { CargoExtra } from '../entities/cargo-extra.entity';
import { ConfiguracionAvisos } from '../entities/configuracion-avisos.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Zona,
      Usuario,
      Tarifario,
      ConceptoFijo,
      EscalaConsumo,
      CargoExtra,
      ConfiguracionAvisos,
    ])
  ],
  providers: [SeedService, TarifarioSeedService],
})
export class SeedModule {}

