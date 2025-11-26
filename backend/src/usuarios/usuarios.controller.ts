import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(RolUsuario.ADMINISTRATIVO)
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Get('padron/:padron')
  findByPadron(@Param('padron') padron: string) {
    return this.usuariosService.findByPadron(padron);
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRATIVO)
  create(@Body() usuarioData: any) {
    return this.usuariosService.create(usuarioData);
  }

  @Post('importar')
  @Roles(RolUsuario.ADMINISTRATIVO)
  importar(@Body() usuarios: any[]) {
    return this.usuariosService.importarUsuarios(usuarios);
  }

  @Put(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  update(@Param('id') id: string, @Body() usuarioData: any) {
    return this.usuariosService.update(+id, usuarioData);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string) {
    return this.usuariosService.delete(+id);
  }
}

