import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MedidoresService } from './medidores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('medidores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedidoresController {
  constructor(private readonly medidoresService: MedidoresService) {}

  @Get()
  @Roles(RolUsuario.ADMINISTRATIVO)
  findAll() {
    return this.medidoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medidoresService.findOne(+id);
  }

  @Get('usuario/:usuarioId')
  findByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.medidoresService.findByUsuario(+usuarioId);
  }

  @Get('usuario/:usuarioId/activo')
  findMedidorActivo(@Param('usuarioId') usuarioId: string) {
    return this.medidoresService.findMedidorActivo(+usuarioId);
  }

  @Get('verificar-serie/:numeroSerie')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async verificarNumeroSerie(@Param('numeroSerie') numeroSerie: string) {
    const existe = await this.medidoresService.verificarNumeroSerieExiste(numeroSerie);
    return { existe, numeroSerie };
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRATIVO)
  create(@Body() medidorData: any) {
    return this.medidoresService.create(medidorData);
  }

  @Post('asignar/:usuarioId')
  @Roles(RolUsuario.ADMINISTRATIVO)
  asignarMedidorACliente(
    @Param('usuarioId') usuarioId: string,
    @Body() medidorData: any
  ) {
    return this.medidoresService.asignarMedidorACliente(+usuarioId, medidorData);
  }

  @Put(':id/dar-baja')
  @Roles(RolUsuario.ADMINISTRATIVO)
  darDeBaja(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return this.medidoresService.darDeBaja(+id, body.motivo);
  }

  @Post(':id/reemplazar')
  @Roles(RolUsuario.ADMINISTRATIVO)
  reemplazarMedidor(
    @Param('id') id: string,
    @Body() body: { nuevoMedidor: any; motivo?: string }
  ) {
    return this.medidoresService.reemplazarMedidor(
      +id,
      body.nuevoMedidor,
      body.motivo
    );
  }

  @Put(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  update(@Param('id') id: string, @Body() medidorData: any) {
    return this.medidoresService.update(+id, medidorData);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string) {
    return this.medidoresService.delete(+id);
  }
}
