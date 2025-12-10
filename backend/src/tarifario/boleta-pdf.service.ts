import { Injectable } from '@nestjs/common';
import { Boleta } from '../entities/boleta.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class BoletaPdfService {
  private readonly ASOCIACION = {
    nombre: 'ASOCIACIÓN DE AGUA POTABLE',
    zona: 'ZONA OESTE GUSTAVO ANDRE',
    direccion: 'Corraleras Km.13 CP: 5535 | Gustavo André | Lavalle | Mendoza',
    whatsapp: '2616718105',
    tipoFactura: 'IVA EXENTO',
    // Ruta opcional a un logo institucional (PNG/SVG/JPG). Si no está presente, se muestra un marcador de posición.
    logoPath: process.env.ASOC_LOGO_PATH,
  };

  // Formatea un número como moneda argentina
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(value);
  }

  // Formatea una fecha
  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Nombre del mes
  private getNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
  }

  // Genera PDF de una sola boleta
  async generarBoletaIndividual(boleta: Boleta): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.dibujarBoleta(doc, boleta, 0);

      doc.end();
    });
  }

  // Genera PDF con múltiples boletas (2 por página)
  async generarBoletasMasivas(boletas: Boleta[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const boletasPorPagina = 2;
      const altoBoleta = 380;

      boletas.forEach((boleta, index) => {
        const posicionEnPagina = index % boletasPorPagina;
        
        // Nueva página cada 2 boletas (excepto la primera)
        if (index > 0 && posicionEnPagina === 0) {
          doc.addPage();
        }

        const offsetY = posicionEnPagina * altoBoleta;
        this.dibujarBoleta(doc, boleta, offsetY);

        // Línea de corte entre boletas
        if (posicionEnPagina === 0) {
          doc.moveTo(20, altoBoleta - 10)
             .lineTo(575, altoBoleta - 10)
             .dash(5, { space: 3 })
             .stroke('#999999')
             .undash();
        }
      });

      doc.end();
    });
  }

  private dibujarBoleta(doc: any, boleta: Boleta, offsetY: number) {
    const margenIzq = 40;
    const margenDer = 555;
    const anchoTotal = margenDer - margenIzq;
    let y = offsetY + 30;

    // ==========================================
    // ENCABEZADO
    // ==========================================
    
    // Recuadro azul superior
    doc.rect(margenIzq, y, anchoTotal, 32)
       .fillColor('#0066CC')
       .fill();

    // Logo institucional (reserva de espacio para subir imagen real)
    this.dibujarLogo(doc, margenIzq + 8, y + 4, 24, 24);

    // Nombre de la asociación
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text(this.ASOCIACION.nombre, margenIzq + 35, y + 7);
    
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#FFFFFF')
       .text(this.ASOCIACION.zona, margenIzq + 35, y + 19);

    // Tipo de documento (derecha)
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('BOLETA', margenDer - 85, y + 5, { width: 85, align: 'right' });

    y += 37;

    // Info de contacto
    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text(this.ASOCIACION.direccion, margenIzq, y, { width: 300 });
    
    doc.text(`WhatsApp: ${this.ASOCIACION.whatsapp}`, margenIzq, y + 8);

    // Período y vencimiento (derecha)
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text('PERÍODO:', margenDer - 170, y);
    
    doc.fillColor('#000000')
       .font('Helvetica')
       .text(`${this.getNombreMes(boleta.mes)} ${boleta.anio}`, margenDer - 115, y);

    doc.font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text('VENCIMIENTO:', margenDer - 170, y + 10);
    
    doc.fillColor('#000000')
       .font('Helvetica')
       .text(this.formatDate(boleta.fechaVencimiento), margenDer - 95, y + 10);

    y += 25;

    // Línea separadora
    doc.moveTo(margenIzq, y)
       .lineTo(margenDer, y)
       .strokeColor('#DEE2E6')
       .lineWidth(1)
       .stroke();

    y += 10;

    // ==========================================
    // DATOS DEL CLIENTE
    // ==========================================

    doc.rect(margenIzq, y, anchoTotal, 48)
       .fillColor('#F8F9FA')
       .fill()
       .strokeColor('#DEE2E6')
       .stroke();

    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text('DATOS DEL CLIENTE', margenIzq + 8, y + 5);

    const yCliente = y + 18;
    const col1 = margenIzq + 8;
    const col2 = margenIzq + 200;
    const col3 = margenIzq + 340;

    // Nombre
    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Nombre:', col1, yCliente);
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(boleta.usuario?.nombre || 'N/A', col1, yCliente + 8, { width: 180 });

    // Padrón
    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Padrón:', col2, yCliente);
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(boleta.usuario?.padron || 'N/A', col2, yCliente + 8);

    // Zona
    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Zona:', col3, yCliente);
    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(boleta.usuario?.zona?.nombre || 'N/A', col3, yCliente + 8);

    // Dirección
    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Domicilio:', col1, yCliente + 20);
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#000000')
       .text(boleta.usuario?.direccion || 'N/A', col1 + 35, yCliente + 20);

    y += 58;

    // ==========================================
    // MEDICIÓN
    // ==========================================

    const medidorActivo = boleta.usuario?.medidores?.find(m => m.activo);
    const lecturaActual = Number(boleta.lectura?.lecturaActual || 0);
    const consumoCalculado = Number(boleta.consumo_m3 || boleta.lectura?.consumoM3 || 0);

    // Mostrar como lectura anterior la base usada para calcular el consumo.
    // Si hay consumo y lectura actual, tomamos lecturaActual - consumo (no negativa).
    // Si no, usamos lecturaAnterior persistida o la lectura inicial del medidor.
    let lecturaAnterior = Number(
      boleta.lectura?.lecturaAnterior ??
      medidorActivo?.lecturaInicial ??
      0
    );

    if (!Number.isNaN(lecturaActual) && !Number.isNaN(consumoCalculado) && consumoCalculado >= 0) {
      const posibleLecturaAnterior = lecturaActual - consumoCalculado;
      if (posibleLecturaAnterior >= 0) {
        lecturaAnterior = posibleLecturaAnterior;
      }
    }

    doc.rect(margenIzq, y, anchoTotal, 35)
       .fillColor('#F0F7FF')
       .fill()
       .strokeColor('#0066CC')
       .stroke();

    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text('MEDICIÓN DEL PERÍODO', margenIzq + 8, y + 5);

    const yMed = y + 18;

    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Lectura Anterior:', margenIzq + 8, yMed)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(lecturaAnterior.toFixed(2), margenIzq + 85, yMed);

    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Lectura Actual:', margenIzq + 150, yMed)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(lecturaActual.toFixed(2), margenIzq + 215, yMed);

    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Consumo:', margenIzq + 280, yMed)
       .fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text(`${Number(boleta.consumo_m3 || 0).toFixed(2)} m³`, margenIzq + 325, yMed);

    y += 43;

    // ==========================================
    // DETALLE DE LA BOLETA
    // ==========================================

    doc.rect(margenIzq, y, anchoTotal, 15)
       .fillColor('#0066CC')
       .fill();

    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('DETALLE DE LA BOLETA', margenIzq + 8, y + 4)
       .text('CANTIDAD', margenDer - 210, y + 4, { width: 60, align: 'right' })
       .text('PRECIO UNIT.', margenDer - 140, y + 4, { width: 70, align: 'right' })
       .text('SUBTOTAL', margenDer - 60, y + 4, { width: 60, align: 'right' });

    y += 15;

    let yDetalle = y;
    let lineCount = 0;

    // Monto de cuota social (opcional). Si es 0 o no viene, no se muestra.
    const montoCuotaSocial = Number((boleta as any).monto_cuota_social ?? 0);

    // Conceptos fijos
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('CONCEPTOS FIJOS', margenIzq + 8, yDetalle + 5);
    
    yDetalle += 14;
    lineCount++;

    if (montoCuotaSocial > 0) {
      doc.fontSize(6.5)
         .font('Helvetica')
         .fillColor('#666666')
         .text('• Cuota Social', margenIzq + 15, yDetalle)
         .text('-', margenDer - 210, yDetalle, { width: 60, align: 'right' })
         .text('-', margenDer - 140, yDetalle, { width: 70, align: 'right' })
         .fillColor('#000000')
         .text(this.formatCurrency(montoCuotaSocial), margenDer - 60, yDetalle, { width: 60, align: 'right' });

      yDetalle += 11;
      lineCount++;
    }

    // Servicio de Agua Potable
    doc.fillColor('#666666')
       .text('• Servicio de Agua Potable', margenIzq + 15, yDetalle)
       .text('-', margenDer - 210, yDetalle, { width: 60, align: 'right' })
       .text('-', margenDer - 140, yDetalle, { width: 70, align: 'right' })
       .fillColor('#000000')
       .text(this.formatCurrency(Number(boleta.monto_servicio_base) || 0), margenDer - 60, yDetalle, { width: 60, align: 'right' });

    yDetalle += 14;
    lineCount++;

    // Desglose de consumo
    if (boleta.desglose_consumo && Array.isArray(boleta.desglose_consumo) && boleta.desglose_consumo.length > 0) {
      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('CONSUMO POR ESCALAS', margenIzq + 8, yDetalle);
      
      yDetalle += 14;
      lineCount++;

      for (const item of boleta.desglose_consumo) {
        if (item.consumo_m3 > 0 && item.precio_por_m3 > 0) {
          const rangoTexto = item.hasta 
            ? `• ${item.desde} - ${item.hasta} m³`
            : `• Más de ${item.desde} m³`;
          
          doc.fontSize(6.5)
             .font('Helvetica')
             .fillColor('#666666')
             .text(rangoTexto, margenIzq + 15, yDetalle)
             .fillColor('#000000')
             .text(`${Number(item.consumo_m3).toFixed(2)} m³`, margenDer - 210, yDetalle, { width: 60, align: 'right' })
             .text(this.formatCurrency(Number(item.precio_por_m3)), margenDer - 140, yDetalle, { width: 70, align: 'right' })
             .text(this.formatCurrency(Number(item.subtotal)), margenDer - 60, yDetalle, { width: 60, align: 'right' });

          yDetalle += 11;
          lineCount++;
        }
      }
    }

    // Ajustar altura del recuadro según líneas
    const alturaDetalle = lineCount * 11 + 10;
    doc.rect(margenIzq, y, anchoTotal, alturaDetalle)
       .strokeColor('#DEE2E6')
       .stroke();

    y = yDetalle + 5;

    // ==========================================
    // SUBTOTAL Y TOTAL
    // ==========================================

    // Línea separadora antes del total
    doc.moveTo(margenIzq, y)
       .lineTo(margenDer, y)
       .strokeColor('#DEE2E6')
       .lineWidth(1)
       .stroke();

    y += 8;

    // Subtotal
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#666666')
       .text('SUBTOTAL:', margenDer - 180, y)
       .fillColor('#000000')
       .text(this.formatCurrency(Number(boleta.subtotal) || 0), margenDer - 60, y, { width: 60, align: 'right' });

    y += 12;

    // Cargos extras si existen
    if (Number(boleta.total_cargos_extras) > 0) {
      doc.fillColor('#666666')
         .text('CARGOS EXTRAS:', margenDer - 180, y)
         .fillColor('#000000')
         .text(this.formatCurrency(Number(boleta.total_cargos_extras)), margenDer - 60, y, { width: 60, align: 'right' });
      
      y += 12;
    }

    // Cuota de plan si existe
    if (Number(boleta.monto_cuota_plan) > 0) {
      doc.fillColor('#666666')
         .text(`CUOTA ${boleta.cuota_plan_numero}/${boleta.planPagoReconexion ? 5 : 0}:`, margenDer - 180, y)
         .fillColor('#000000')
         .text(this.formatCurrency(Number(boleta.monto_cuota_plan)), margenDer - 60, y, { width: 60, align: 'right' });
      
      y += 12;
    }

    // Línea antes del total
    doc.moveTo(margenDer - 200, y)
       .lineTo(margenDer, y)
       .strokeColor('#0066CC')
       .lineWidth(2)
       .stroke();

    y += 8;

    // TOTAL destacado
    doc.rect(margenDer - 200, y, 200, 28)
       .fillColor('#0066CC')
       .fill();

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('TOTAL A PAGAR', margenDer - 190, y + 5);
    
    doc.fontSize(14)
       .text(this.formatCurrency(Number(boleta.total) || 0), margenDer - 190, y + 15);

    y += 35;

    // ==========================================
    // INFORMACIÓN DE PAGO
    // ==========================================

    doc.fontSize(6)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('SON PESOS: ', margenIzq, y);
    
    doc.font('Helvetica')
       .text(this.numeroALetras(Number(boleta.total) || 0).toUpperCase(), margenIzq + 38, y, { width: 350 });

    y += 12;

    // Recuadro de información de pago
    doc.rect(margenIzq, y, anchoTotal, 22)
       .fillColor('#FFF9E6')
       .fill()
       .strokeColor('#FFC107')
       .stroke();

    doc.fontSize(6)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('💳 FORMAS DE PAGO:', margenIzq + 8, y + 5);
    
    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Banco Nación | Oficina Comercial | Transferencia: AGUA.GUSTAVO.ANDRE', margenIzq + 90, y + 5, { width: anchoTotal - 100 });

    doc.fontSize(5.5)
       .fillColor('#666666')
       .text('⚠️ Abone antes del vencimiento para evitar recargos. Conserve el comprobante y presente este talón si paga en ventanilla.', margenIzq + 8, y + 14, { width: anchoTotal - 16 });

    y += 30;

    // ==========================================
    // TALÓN PARA EL CLIENTE
    // ==========================================

    // Línea de corte
    doc.moveTo(margenIzq - 10, y)
       .lineTo(margenDer + 10, y)
       .dash(3, { space: 3 })
       .strokeColor('#999999')
       .lineWidth(0.5)
       .stroke()
       .undash();

    doc.fontSize(5)
       .font('Helvetica')
       .fillColor('#999999')
       .text('✂ CORTAR AQUÍ - TALÓN PARA EL CLIENTE', margenIzq + 150, y - 2);

    y += 10;

    // Talón compacto
    doc.rect(margenIzq, y, anchoTotal, 38)
       .fillColor('#F8F9FA')
       .fill()
       .strokeColor('#DEE2E6')
       .stroke();

    // Logo y nombre en el talón
    this.dibujarLogo(doc, margenIzq + 8, y + 7, 16, 16, '#0066CC', '#0066CC');

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#0066CC')
       .text(this.ASOCIACION.nombre, margenIzq + 28, y + 6, { width: 260 });

    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text(this.ASOCIACION.zona, margenIzq + 8, y + 17);

    // Datos del talón
    const yTalon = y + 27;

    doc.fontSize(6)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Padrón:', margenIzq + 8, yTalon);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(boleta.usuario?.padron || 'N/A', margenIzq + 33, yTalon);

    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Zona:', margenIzq + 85, yTalon);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(boleta.usuario?.zona?.nombre || 'N/A', margenIzq + 102, yTalon);

    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Período:', margenIzq + 180, yTalon);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(`${this.getNombreMes(boleta.mes)}/${boleta.anio}`, margenIzq + 207, yTalon);

    doc.font('Helvetica')
       .fillColor('#666666')
       .text('Vence:', margenIzq + 270, yTalon);
    doc.font('Helvetica-Bold')
       .fillColor('#000000')
       .text(this.formatDate(boleta.fechaVencimiento), margenIzq + 291, yTalon);

    // Total en el talón (destacado)
    doc.rect(margenDer - 95, y + 8, 95, 24)
       .fillColor('#0066CC')
       .fill();

    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text('TOTAL', margenDer - 85, y + 11);
    
    doc.fontSize(11)
       .text(this.formatCurrency(Number(boleta.total) || 0), margenDer - 85, y + 20);
  }

  private dibujarLogo(
    doc: any,
    x: number,
    y: number,
    width: number,
    height: number,
    strokeColor = '#FFFFFF',
    textColor = '#FFFFFF',
  ) {
    const padding = 2;

    doc.save();
    doc.rect(x, y, width, height)
       .lineWidth(0.8)
       .strokeColor(strokeColor)
       .stroke();

    const logoDisponible = this.ASOCIACION.logoPath;

    if (logoDisponible) {
      try {
        doc.image(logoDisponible, x + padding, y + padding, {
          fit: [width - padding * 2, height - padding * 2],
          align: 'left',
          valign: 'center',
        });
        doc.restore();
        return;
      } catch (err) {
        // Si falla la carga del logo, se mostrará el marcador de posición.
      }
    }

    doc.fontSize(Math.min(7, height - 6))
       .font('Helvetica-Bold')
       .fillColor(textColor)
       .text('LOGO', x, y + height / 2 - 4, { width, align: 'center' });

    doc.restore();
  }

  // Convierte número a letras (básico)
  private numeroALetras(num: number): string {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince'];

    if (num === 0) return 'cero';

    const entero = Math.floor(num);
    const centavos = Math.round((num - entero) * 100);

    let resultado = '';

    if (entero >= 1000) {
      const miles = Math.floor(entero / 1000);
      if (miles === 1) {
        resultado += 'mil ';
      } else {
        resultado += this.numeroALetras(miles) + ' mil ';
      }
    }

    const resto = entero % 1000;
    if (resto >= 100) {
      const centenas = Math.floor(resto / 100);
      const centenasTexto = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
      if (resto === 100) {
        resultado += 'cien ';
      } else {
        resultado += centenasTexto[centenas] + ' ';
      }
    }

    const ultimos = resto % 100;
    if (ultimos > 0 && ultimos <= 15 && ultimos >= 10) {
      resultado += especiales[ultimos - 10] + ' ';
    } else {
      if (ultimos >= 10) {
        resultado += decenas[Math.floor(ultimos / 10)] + ' ';
        if (ultimos % 10 > 0) {
          resultado += 'y ' + unidades[ultimos % 10] + ' ';
        }
      } else if (ultimos > 0) {
        resultado += unidades[ultimos] + ' ';
      }
    }

    resultado = resultado.trim();

    if (centavos > 0) {
      resultado += ` con ${centavos}/100`;
    }

    return resultado;
  }
}

