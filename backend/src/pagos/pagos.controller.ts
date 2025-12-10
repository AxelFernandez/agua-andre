import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Get('pendientes-revision')
  @Roles(RolUsuario.ADMINISTRATIVO)
  findPendientesRevision() {
    return this.pagosService.findPendientesRevision();
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
  @UseInterceptors(FileInterceptor('comprobante', {
    storage: diskStorage({
      destination: './uploads/comprobantes',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  create(
    @Body() pagoData: any,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    return this.pagosService.create({
      boletaId: parseInt(pagoData.boletaId),
      monto: parseFloat(pagoData.monto),
      comprobanteUrl: file ? file.filename : null,
      metodoPago: 'transferencia',
    });
  }

  @Post('efectivo')
  @Roles(RolUsuario.ADMINISTRATIVO)
  registrarEfectivo(
    @Body() data: { boletaId: number; monto?: number; fechaPago?: string; observaciones?: string },
    @Request() req,
  ) {
    return this.pagosService.registrarPagoEfectivo(data, req.user.userId);
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

