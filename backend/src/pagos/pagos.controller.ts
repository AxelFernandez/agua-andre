import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get()
  @Roles(RolUsuario.ADMINISTRATIVO)
  findAll() {
    return this.pagosService.findAll();
  }

  @Get('boleta/:boletaId')
  findByBoleta(@Param('boletaId') boletaId: string) {
    return this.pagosService.findByBoleta(+boletaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagosService.findOne(+id);
  }

  @Post()
  @Roles(RolUsuario.CLIENTE)
  create(@Body() pagoData: any) {
    return this.pagosService.create(pagoData);
  }

  @Put(':id/aprobar')
  @Roles(RolUsuario.ADMINISTRATIVO)
  aprobar(@Param('id') id: string, @Request() req) {
    return this.pagosService.aprobarPago(+id, req.user.userId);
  }

  @Put(':id/rechazar')
  @Roles(RolUsuario.ADMINISTRATIVO)
  rechazar(@Param('id') id: string, @Body() data: { observaciones: string }, @Request() req) {
    return this.pagosService.rechazarPago(+id, req.user.userId, data.observaciones);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string) {
    return this.pagosService.delete(+id);
  }
}

