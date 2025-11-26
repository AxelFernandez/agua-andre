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
  generarBoleta(@Body() data: { lecturaId: number; tarifaBase?: number }) {
    return this.boletasService.generarBoleta(data.lecturaId, data.tarifaBase);
  }

  @Put(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  update(@Param('id') id: string, @Body() boletaData: any) {
    return this.boletasService.update(+id, boletaData);
  }

  @Put(':id/marcar-pagada')
  @Roles(RolUsuario.ADMINISTRATIVO)
  marcarComoPagada(@Param('id') id: string) {
    return this.boletasService.marcarComoPagada(+id);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string) {
    return this.boletasService.delete(+id);
  }
}

