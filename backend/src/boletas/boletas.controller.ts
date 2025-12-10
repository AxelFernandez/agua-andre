import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BoletasService } from './boletas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('boletas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoletasController {
  constructor(private readonly boletasService: BoletasService) {}

  @Get()
  @Roles(RolUsuario.ADMINISTRATIVO)
  findAll() {
    return this.boletasService.findAll();
  }

  @Get('usuario/:usuarioId')
  findByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.boletasService.findByUsuario(+usuarioId);
  }

  @Get('mis-boletas')
  @Roles(RolUsuario.CLIENTE)
  misBoletas(@Request() req) {
    return this.boletasService.findByUsuario(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boletasService.findOne(+id);
  }

  @Post('generar')
  @Roles(RolUsuario.ADMINISTRATIVO)
  generarBoleta(
    @Body() data: { lecturaId: number; tarifaBase?: number },
    @Request() req,
  ) {
    return this.boletasService.generarBoleta(
      data.lecturaId,
      data.tarifaBase,
      req.user.userId,
    );
  }

  @Put(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  update(@Param('id') id: string, @Body() boletaData: any, @Request() req) {
    return this.boletasService.update(+id, boletaData, req.user.userId);
  }

  @Put(':id/marcar-pagada')
  @Roles(RolUsuario.ADMINISTRATIVO)
  marcarComoPagada(@Param('id') id: string, @Request() req) {
    return this.boletasService.marcarComoPagada(+id, req.user.userId);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string, @Request() req) {
    return this.boletasService.delete(+id, req.user.userId);
  }
}

