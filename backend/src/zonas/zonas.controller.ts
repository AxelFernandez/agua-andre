import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ZonasService } from './zonas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('zonas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Get()
  findAll() {
    return this.zonasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonasService.findOne(+id);
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRATIVO)
  create(@Body() zonaData: any) {
    return this.zonasService.create(zonaData);
  }

  @Put(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  update(@Param('id') id: string, @Body() zonaData: any) {
    return this.zonasService.update(+id, zonaData);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string) {
    return this.zonasService.delete(+id);
  }
}

