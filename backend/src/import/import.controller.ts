import { 
  Controller, 
  Post, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('usuarios/csv')
  @Roles(RolUsuario.ADMINISTRATIVO)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importarUsuariosCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar que sea un archivo CSV
    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('El archivo debe ser un CSV');
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es demasiado grande (máximo 10MB)');
    }

    console.log(`📁 Recibido archivo: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

    try {
      const result = await this.importService.importarCSV(file.buffer);
      
      return {
        success: true,
        message: `Importación completada: ${result.exitosos} de ${result.total} registros`,
        data: {
          total: result.total,
          exitosos: result.exitosos,
          errores: result.errores.length,
          detalleErrores: result.errores,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  @Post('usuarios/csv/preview')
  @Roles(RolUsuario.ADMINISTRATIVO)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async previewCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('El archivo debe ser un CSV');
    }

    try {
      const preview = await this.importService.previewCSV(file.buffer, 10);
      
      return {
        success: true,
        message: `Vista previa de ${preview.length} registros`,
        data: preview,
      };
    } catch (error) {
      throw new BadRequestException(`Error al leer el archivo: ${error.message}`);
    }
  }
}

