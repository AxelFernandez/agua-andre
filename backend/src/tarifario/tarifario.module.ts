import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarifarioService } from './tarifario.service';
import { BoletaGeneratorService } from './boleta-generator.service';
import { EstadoServicioService } from './estado-servicio.service';
import { ReconexionService } from './reconexion.service';
import { PagoBoletaService } from './pago-boleta.service';
import { TarifarioController } from './tarifario.controller';
import { TarifarioSchedulerService } from './tarifario-scheduler.service';
import { BoletaPdfService } from './boleta-pdf.service';
import { Tarifario } from '../entities/tarifario.entity';
import { ConceptoFijo } from '../entities/concepto-fijo.entity';
import { EscalaConsumo } from '../entities/escala-consumo.entity';
import { CargoExtra } from '../entities/cargo-extra.entity';
import { ConfiguracionAvisos } from '../entities/configuracion-avisos.entity';
import { EstadoServicio } from '../entities/estado-servicio.entity';
import { PlanPagoReconexion } from '../entities/plan-pago-reconexion.entity';
import { CuotaReconexion } from '../entities/cuota-reconexion.entity';
import { BoletaCargoExtra } from '../entities/boleta-cargo-extra.entity';
import { Boleta } from '../entities/boleta.entity';
import { Usuario } from '../entities/usuario.entity';
import { Lectura } from '../entities/lectura.entity';
import { Medidor } from '../entities/medidor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tarifario,
      ConceptoFijo,
      EscalaConsumo,
      CargoExtra,
      ConfiguracionAvisos,
      EstadoServicio,
      PlanPagoReconexion,
      CuotaReconexion,
      BoletaCargoExtra,
      Boleta,
      Usuario,
      Lectura,
      Medidor,
    ]),
  ],
  controllers: [TarifarioController],
  providers: [
    TarifarioService,
    BoletaGeneratorService,
    EstadoServicioService,
    ReconexionService,
    PagoBoletaService,
    TarifarioSchedulerService,
    BoletaPdfService,
  ],
  exports: [
    TarifarioService,
    BoletaGeneratorService,
    EstadoServicioService,
    ReconexionService,
    PagoBoletaService,
    BoletaPdfService,
  ],
})
export class TarifarioModule {}
