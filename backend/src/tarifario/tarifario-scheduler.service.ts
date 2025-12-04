import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EstadoServicioService } from './estado-servicio.service';

@Injectable()
export class TarifarioSchedulerService {
  private readonly logger = new Logger(TarifarioSchedulerService.name);

  constructor(private readonly estadoServicioService: EstadoServicioService) {}

  // Ejecutar todos los días a las 2:00 AM
  @Cron('0 2 * * *')
  async verificarEstadosServicio() {
    this.logger.log('🔍 Iniciando verificación diaria de estados de servicio...');
    
    try {
      await this.estadoServicioService.verificarYActualizarEstados();
      this.logger.log('✅ Verificación de estados completada');
    } catch (error) {
      this.logger.error('❌ Error en verificación de estados:', error);
    }
  }

  // Ejecutar el día 20 de cada mes a las 3:00 AM (generación masiva de boletas)
  @Cron('0 3 20 * *')
  async generarBoletasMensuales() {
    this.logger.log('📄 Iniciando generación masiva de boletas mensuales...');
    
    try {
      // TODO: Implementar generación masiva
      // Por ahora solo log
      this.logger.log('⏸️  Generación masiva pendiente de implementar');
    } catch (error) {
      this.logger.error('❌ Error en generación de boletas:', error);
    }
  }
}
