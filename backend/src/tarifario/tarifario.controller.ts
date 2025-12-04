import { Controller, Get, Post, Put, Body, Param, UseGuards, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TarifarioService } from './tarifario.service';
import { BoletaGeneratorService } from './boleta-generator.service';
import { EstadoServicioService } from './estado-servicio.service';
import { ReconexionService } from './reconexion.service';
import { PagoBoletaService } from './pago-boleta.service';
import { BoletaPdfService } from './boleta-pdf.service';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('tarifario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TarifarioController {
  constructor(
    private readonly tarifarioService: TarifarioService,
    private readonly boletaGeneratorService: BoletaGeneratorService,
    private readonly estadoServicioService: EstadoServicioService,
    private readonly reconexionService: ReconexionService,
    private readonly pagoBoletaService: PagoBoletaService,
    private readonly boletaPdfService: BoletaPdfService,
  ) {}

  // ==========================================
  // OBTENER TARIFARIO ACTIVO
  // ==========================================

  @Get('activo')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async obtenerTarifarioActivo() {
    return this.tarifarioService.obtenerTarifarioActivo();
  }

  @Get('escalas-consumo')
  @Roles(RolUsuario.CLIENTE, RolUsuario.ADMINISTRATIVO, RolUsuario.OPERARIO)
  async obtenerEscalasConsumo(@Query('tipo') tipoCliente: string) {
    return this.tarifarioService.obtenerEscalasConsumo(tipoCliente);
  }

  @Get('conceptos-fijos')
  @Roles(RolUsuario.CLIENTE, RolUsuario.ADMINISTRATIVO, RolUsuario.OPERARIO)
  async obtenerConceptosFijos(@Query('tipo') tipoCliente: string) {
    return this.tarifarioService.obtenerConceptosFijos(tipoCliente);
  }

  @Get('configuracion-avisos')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async obtenerConfiguracionAvisos() {
    return this.tarifarioService.obtenerConfiguracionAvisos();
  }

  // ==========================================
  // GENERAR BOLETA
  // ==========================================

  @Post('generar-boleta')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async generarBoleta(
    @Body() body: { usuarioId: number; mes: number; anio: number }
  ) {
    return this.boletaGeneratorService.generarBoletaMensual(
      body.usuarioId,
      body.mes,
      body.anio
    );
  }

  // ==========================================
  // VERIFICAR ESTADOS (Job manual)
  // ==========================================

  @Post('verificar-estados')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async verificarEstados() {
    await this.estadoServicioService.verificarYActualizarEstados();
    return { message: 'Verificación de estados completada' };
  }

  // ==========================================
  // RECONEXIÓN
  // ==========================================

  @Post('reconexion/:usuarioId')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async procesarReconexion(
    @Param('usuarioId') usuarioId: number,
    @Body() body: { pagoContado: boolean; cantidadCuotas?: number }
  ) {
    return this.reconexionService.procesarReconexion(
      Number(usuarioId),
      body.pagoContado,
      body.cantidadCuotas
    );
  }

  // ==========================================
  // PROCESAR PAGO
  // ==========================================

  @Post('pagar-boleta/:boletaId')
  @Roles(RolUsuario.ADMINISTRATIVO, RolUsuario.CLIENTE)
  async pagarBoleta(
    @Param('boletaId') boletaId: number,
    @Body() body: { montoPagado: number; fechaPago?: string }
  ) {
    const fechaPago = body.fechaPago ? new Date(body.fechaPago) : new Date();
    return this.pagoBoletaService.procesarPagoBoleta(
      Number(boletaId),
      body.montoPagado,
      fechaPago
    );
  }

  // ==========================================
  // ACTUALIZAR VALORES
  // ==========================================

  @Put('concepto-fijo/:id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async actualizarConceptoFijo(
    @Param('id') id: number,
    @Body() body: { monto: number }
  ) {
    return this.tarifarioService.actualizarConceptoFijo(Number(id), body.monto);
  }

  @Put('escala-consumo/:id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async actualizarEscalaConsumo(
    @Param('id') id: number,
    @Body() body: { precio: number }
  ) {
    return this.tarifarioService.actualizarEscalaConsumo(Number(id), body.precio);
  }

  @Put('cargo-extra/:id')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async actualizarCargoExtra(
    @Param('id') id: number,
    @Body() body: { monto: number }
  ) {
    return this.tarifarioService.actualizarCargoExtra(Number(id), body.monto);
  }

  @Put('configuracion-avisos')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async actualizarConfiguracionAvisos(@Body() body: any) {
    return this.tarifarioService.actualizarConfiguracionAvisos(body);
  }

  // ==========================================
  // CONSULTAS
  // ==========================================

  @Get('historial-estados/:usuarioId')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async obtenerHistorialEstados(@Param('usuarioId') usuarioId: number) {
    return this.estadoServicioService.obtenerHistorialEstados(Number(usuarioId));
  }

  @Get('plan-reconexion/:usuarioId')
  @Roles(RolUsuario.ADMINISTRATIVO, RolUsuario.CLIENTE)
  async obtenerPlanReconexion(@Param('usuarioId') usuarioId: number) {
    return this.reconexionService.obtenerPlanReconexionActivo(Number(usuarioId));
  }

  @Get('deuda-total/:usuarioId')
  @Roles(RolUsuario.ADMINISTRATIVO, RolUsuario.CLIENTE)
  async obtenerDeudaTotal(@Param('usuarioId') usuarioId: number) {
    const deuda = await this.estadoServicioService.calcularDeudaTotal(Number(usuarioId));
    return { usuarioId: Number(usuarioId), deudaTotal: deuda };
  }

  // ==========================================
  // GENERACIÓN MASIVA DE BOLETAS
  // ==========================================

  @Post('generar-boletas-masivas')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async generarBoletasMasivas(
    @Body() body: { mes: number; anio: number }
  ) {
    return this.boletaGeneratorService.generarBoletasMasivas(body.mes, body.anio);
  }

  // ==========================================
  // GENERACIÓN DE PDF
  // ==========================================

  @Get('pdf/boleta/:boletaId')
  @Roles(RolUsuario.ADMINISTRATIVO, RolUsuario.CLIENTE)
  async descargarBoletaPdf(
    @Param('boletaId') boletaId: number,
    @Res() res: Response,
  ) {
    const boleta = await this.boletaGeneratorService.obtenerBoletaPorId(Number(boletaId));
    
    if (!boleta) {
      return res.status(404).json({ message: 'Boleta no encontrada' });
    }

    const pdfBuffer = await this.boletaPdfService.generarBoletaIndividual(boleta);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="boleta-${boleta.usuario?.padron}-${boleta.mes}-${boleta.anio}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('pdf/boletas-masivas')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async descargarBoletasMasivasPdf(
    @Query('mes') mes: number,
    @Query('anio') anio: number,
    @Res() res: Response,
  ) {
    const boletas = await this.boletaGeneratorService.obtenerBoletasParaPDF(Number(mes), Number(anio));
    
    if (!boletas || boletas.length === 0) {
      return res.status(404).json({ message: 'No hay boletas para el período seleccionado' });
    }

    const pdfBuffer = await this.boletaPdfService.generarBoletasMasivas(boletas);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="boletas-${mes}-${anio}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('boletas-periodo')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async obtenerBoletasPeriodo(
    @Query('mes') mes: number,
    @Query('anio') anio: number,
  ) {
    return this.boletaGeneratorService.obtenerBoletasParaPDF(Number(mes), Number(anio));
  }

  @Post('recalcular-boleta/:boletaId')
  @Roles(RolUsuario.ADMINISTRATIVO)
  async recalcularBoleta(@Param('boletaId') boletaId: number) {
    return this.boletaGeneratorService.forzarRecalculoBoleta(Number(boletaId));
  }
}
