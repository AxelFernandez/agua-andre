import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';
import { TipoAccionAuditoria } from '../entities/auditoria-registro.entity';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Roles(RolUsuario.ADMINISTRATIVO)
  findAll(
    @Query('modulo') modulo?: string,
    @Query('entidad') entidad?: string,
    @Query('registroId') registroId?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('accion') accion?: TipoAccionAuditoria,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditoriaService.findAll({
      modulo,
      entidad,
      registroId,
      usuarioId: usuarioId ? Number(usuarioId) : undefined,
      accion,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  findOne(@Param('id') id: string) {
    return this.auditoriaService.findOne(+id);
  }
}


