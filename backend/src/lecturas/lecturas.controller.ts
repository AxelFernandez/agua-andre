import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { LecturasService } from './lecturas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('lecturas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LecturasController {
  constructor(private readonly lecturasService: LecturasService) {}

  @Get()
  @Roles(RolUsuario.ADMINISTRATIVO, RolUsuario.OPERARIO)
  findAll(@Query('medidorId') medidorId?: string) {
    if (medidorId) {
      return this.lecturasService.findByMedidor(+medidorId);
    }
    return this.lecturasService.findAll();
  }

  @Get('medidor/:medidorId')
  findByMedidor(@Param('medidorId') medidorId: string) {
    return this.lecturasService.findByMedidor(+medidorId);
  }

  @Get('medidor/:medidorId/ultima')
  findUltimaLectura(@Param('medidorId') medidorId: string) {
    return this.lecturasService.findUltimaLectura(+medidorId);
  }

  @Post()
  @Roles(RolUsuario.OPERARIO, RolUsuario.ADMINISTRATIVO)
  create(@Body() lecturaData: any, @Request() req) {
    return this.lecturasService.create(
      {
        ...lecturaData,
        operario: { id: req.user.userId },
      },
      req.user.userId,
    );
  }

  @Put(':id')
  @Roles(RolUsuario.OPERARIO, RolUsuario.ADMINISTRATIVO)
  update(@Param('id') id: string, @Body() lecturaData: any, @Request() req) {
    return this.lecturasService.update(+id, lecturaData, req.user.userId);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  delete(@Param('id') id: string, @Request() req) {
    return this.lecturasService.delete(+id, req.user.userId);
  }
}

