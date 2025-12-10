import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('resumen')
  @Roles(RolUsuario.ADMINISTRATIVO)
  obtenerResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('diasVencimiento') diasVencimiento?: string,
  ) {
    return this.estadisticasService.obtenerResumen({
      desde,
      hasta,
      diasVencimiento: diasVencimiento ? parseInt(diasVencimiento, 10) : undefined,
    });
  }

  @Get('tendencias')
  @Roles(RolUsuario.ADMINISTRATIVO)
  obtenerTendencias(
    @Query('meses') meses?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.estadisticasService.obtenerTendencias({
      meses: meses ? parseInt(meses, 10) : 12,
      hasta,
    });
  }

  @Get('deuda-por-zona')
  @Roles(RolUsuario.ADMINISTRATIVO)
  obtenerDeudaPorZona(@Query('limit') limit?: string) {
    return this.estadisticasService.obtenerDeudaPorZona({
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('top-deuda-clientes')
  @Roles(RolUsuario.ADMINISTRATIVO)
  obtenerTopDeudaClientes(@Query('limit') limit?: string) {
    return this.estadisticasService.obtenerTopDeudaClientes({
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}

