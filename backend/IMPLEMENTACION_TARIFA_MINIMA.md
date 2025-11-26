# 📋 GUÍA: IMPLEMENTACIÓN DE TARIFA MÍNIMA

## 🎯 Objetivo
Cuando un cliente **NO tiene medidor activo**, se le debe cobrar una **tarifa mínima** en lugar de calcular por consumo.

---

## 📍 UBICACIÓN DE LA LÓGICA

### 1️⃣ **LUGAR PRINCIPAL: `BoletasService`**

**Archivo:** `/backend/src/boletas/boletas.service.ts`

**Método a modificar:** `generarBoleta()` (líneas 46-80)

**Lógica actual:**
```typescript
async generarBoleta(lecturaId: number, tarifaBase: number = 500): Promise<Boleta> {
  const lectura = await this.lecturasRepository.findOne({
    where: { id: lecturaId },
    relations: ['medidor', 'medidor.usuario'],
  });

  // ❌ PROBLEMA: Asume que SIEMPRE hay lectura
  const montoBase = tarifaBase + (lectura.consumoM3 * 50);
}
```

**Lógica futura con tarifa mínima:**
```typescript
async generarBoleta(
  usuarioId: number,        // ← Ahora recibe el ID del usuario
  lecturaId?: number,       // ← La lectura es opcional
  periodo?: { mes: number, anio: number }  // ← Período de facturación
): Promise<Boleta> {
  
  // 1. Obtener el usuario con su medidor activo
  const usuario = await this.usuariosRepository.findOne({
    where: { id: usuarioId },
    relations: ['medidores'],
  });
  
  // 2. Verificar si tiene medidor activo
  const medidorActivo = usuario.medidores.find(m => m.activo);
  
  // 3. LÓGICA DECISIÓN: ¿Tiene medidor o no?
  if (!medidorActivo) {
    // ⚠️ CASO A: SIN MEDIDOR → TARIFA MÍNIMA
    return this.generarBoletaTarifaMinima(usuario, periodo);
  } else {
    // ✅ CASO B: CON MEDIDOR → CÁLCULO POR CONSUMO
    return this.generarBoletaPorConsumo(usuario, lecturaId, medidorActivo);
  }
}
```

---

## 2️⃣ **MÉTODOS NUEVOS A CREAR**

### A) `generarBoletaTarifaMinima()`

**Propósito:** Generar boleta cuando el cliente NO tiene medidor.

**Ubicación:** Dentro de `BoletasService`

**Código de ejemplo:**
```typescript
private async generarBoletaTarifaMinima(
  usuario: Usuario,
  periodo: { mes: number, anio: number }
): Promise<Boleta> {
  
  // 1. Obtener la tarifa mínima del tarifador
  const tarifaMinima = await this.tarifasService.obtenerTarifaMinima(usuario);
  
  // 2. Crear boleta SIN lectura asociada
  const boleta = this.boletasRepository.create({
    usuario,
    lectura: null,  // ← Sin lectura porque no hay medidor
    mes: periodo.mes,
    anio: periodo.anio,
    fechaEmision: new Date(),
    fechaVencimiento: this.calcularFechaVencimiento(),
    montoBase: tarifaMinima,
    montoTotal: tarifaMinima,
    recargos: 0,
    estado: EstadoBoleta.PENDIENTE,
    // ✨ Opcionalmente agregar un campo "motivo" o "observaciones"
    // observaciones: 'Tarifa mínima - Sin medidor activo'
  });
  
  return this.boletasRepository.save(boleta);
}
```

### B) `generarBoletaPorConsumo()`

**Propósito:** Generar boleta cuando el cliente SÍ tiene medidor (lógica actual).

**Ubicación:** Dentro de `BoletasService`

**Código de ejemplo:**
```typescript
private async generarBoletaPorConsumo(
  usuario: Usuario,
  lecturaId: number,
  medidor: Medidor
): Promise<Boleta> {
  
  // 1. Obtener la lectura
  const lectura = await this.lecturasRepository.findOne({
    where: { id: lecturaId },
    relations: ['medidor'],
  });
  
  if (!lectura) {
    throw new NotFoundException('Lectura no encontrada');
  }
  
  // 2. Obtener las tarifas del tarifador según la zona, tipo de cliente, etc.
  const tarifa = await this.tarifasService.calcularTarifa(
    usuario,
    lectura.consumoM3
  );
  
  // 3. Calcular monto
  const montoBase = tarifa.cargo_fijo + (lectura.consumoM3 * tarifa.precio_m3);
  const montoTotal = montoBase;
  
  // 4. Crear boleta con lectura
  const boleta = this.boletasRepository.create({
    usuario,
    lectura,
    mes: lectura.mes,
    anio: lectura.anio,
    fechaEmision: new Date(),
    fechaVencimiento: this.calcularFechaVencimiento(),
    montoBase,
    montoTotal,
    recargos: 0,
    estado: EstadoBoleta.PENDIENTE,
  });
  
  return this.boletasRepository.save(boleta);
}
```

---

## 3️⃣ **ENTIDAD NUEVA: `Tarifa` o `Tarifador`**

**Archivo a crear:** `/backend/src/entities/tarifa.entity.ts`

**Propósito:** Definir las tarifas (mínima, por consumo, etc.)

**Código de ejemplo:**
```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum TipoTarifa {
  MINIMA = 'minima',               // Para clientes sin medidor
  PARTICULARES = 'Particulares',   // Para clientes particulares
  ENTIDAD_PUBLICA = 'Entidad Pública', // Para entidades públicas
}

@Entity('tarifas')
export class Tarifa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string; // "Tarifa Mínima", "Tarifa Residencial", etc.

  @Column({ 
    type: 'enum',
    enum: TipoTarifa,
  })
  tipo: TipoTarifa;

  // ⭐ TARIFA MÍNIMA (cuando no hay medidor)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto_minimo: number; // Ej: $300

  // Tarifas por consumo (cuando SÍ hay medidor)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cargo_fijo: number; // Cargo base mensual

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precio_m3: number; // Precio por metro cúbico

  // Rangos de consumo (opcional, para tarifas escalonadas)
  @Column({ type: 'int', nullable: true })
  consumo_minimo: number; // Ej: 0 m³

  @Column({ type: 'int', nullable: true })
  consumo_maximo: number; // Ej: 50 m³

  // Aplicabilidad
  @Column({ type: 'int', nullable: true })
  zona_id: number; // Opcional: tarifa por zona

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ type: 'date', nullable: true })
  fecha_vigencia_desde: Date;

  @Column({ type: 'date', nullable: true })
  fecha_vigencia_hasta: Date;
}
```

---

## 4️⃣ **SERVICIO NUEVO: `TarifasService`**

**Archivo a crear:** `/backend/src/tarifas/tarifas.service.ts`

**Propósito:** Lógica de negocio para consultar y aplicar tarifas.

**Código de ejemplo:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifa, TipoTarifa } from '../entities/tarifa.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class TarifasService {
  constructor(
    @InjectRepository(Tarifa)
    private tarifasRepository: Repository<Tarifa>,
  ) {}

  // ⭐ MÉTODO PRINCIPAL: Obtener tarifa mínima
  async obtenerTarifaMinima(usuario: Usuario): Promise<number> {
    // Buscar tarifa mínima activa
    const tarifa = await this.tarifasRepository.findOne({
      where: {
        tipo: TipoTarifa.MINIMA,
        activa: true,
      },
    });

    if (!tarifa) {
      // Valor por defecto si no hay tarifa configurada
      return 300; // $300 por defecto
    }

    return parseFloat(tarifa.monto_minimo.toString());
  }

  // Método para calcular tarifa por consumo
  async calcularTarifa(usuario: Usuario, consumoM3: number): Promise<{
    cargo_fijo: number;
    precio_m3: number;
    monto_total: number;
  }> {
    // Obtener tarifa según tipo de usuario (residencial, comercial, etc.)
    const tipoTarifa = this.determinarTipoTarifa(usuario);
    
    const tarifa = await this.tarifasRepository.findOne({
      where: {
        tipo: tipoTarifa,
        activa: true,
      },
    });

    if (!tarifa) {
      // Valores por defecto
      return {
        cargo_fijo: 500,
        precio_m3: 50,
        monto_total: 500 + (consumoM3 * 50),
      };
    }

    const monto_total = parseFloat(tarifa.cargo_fijo.toString()) + 
                        (consumoM3 * parseFloat(tarifa.precio_m3.toString()));

    return {
      cargo_fijo: parseFloat(tarifa.cargo_fijo.toString()),
      precio_m3: parseFloat(tarifa.precio_m3.toString()),
      monto_total,
    };
  }

  private determinarTipoTarifa(usuario: Usuario): TipoTarifa {
    // Según el campo "tipo" del usuario
    switch (usuario.tipo) {
      case 'Particulares':
        return TipoTarifa.PARTICULARES;
      case 'Entidad Pública':
        return TipoTarifa.ENTIDAD_PUBLICA;
      default:
        return TipoTarifa.PARTICULARES;
    }
  }
}
```

---

## 5️⃣ **MODIFICACIÓN EN `Boleta` ENTITY**

**Archivo:** `/backend/src/entities/boleta.entity.ts`

**Cambios necesarios:**

```typescript
@Entity('boletas')
export class Boleta {
  // ... campos existentes ...

  // ⚠️ MODIFICAR: La lectura ahora es OPCIONAL
  @OneToOne(() => Lectura, { nullable: true })  // ← Agregado nullable: true
  @JoinColumn()
  lectura: Lectura | null;  // ← Puede ser null

  // ✨ NUEVO CAMPO (opcional): Para identificar el tipo de boleta
  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_boleta: string; // 'consumo' | 'tarifa_minima'

  // ✨ NUEVO CAMPO (opcional): Observaciones
  @Column({ type: 'text', nullable: true })
  observaciones: string; // 'Tarifa mínima - Sin medidor activo'
}
```

---

## 6️⃣ **INYECCIÓN DE DEPENDENCIAS**

**Archivo:** `/backend/src/boletas/boletas.module.ts`

**Modificación necesaria:**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletasService } from './boletas.service';
import { BoletasController } from './boletas.controller';
import { Boleta } from '../entities/boleta.entity';
import { Usuario } from '../entities/usuario.entity';
import { Lectura } from '../entities/lectura.entity';
import { Tarifa } from '../entities/tarifa.entity';  // ← NUEVO
import { TarifasModule } from '../tarifas/tarifas.module'; // ← NUEVO

@Module({
  imports: [
    TypeOrmModule.forFeature([Boleta, Usuario, Lectura, Tarifa]),
    TarifasModule,  // ← Importar el módulo de tarifas
  ],
  providers: [BoletasService],
  controllers: [BoletasController],
  exports: [BoletasService],
})
export class BoletasModule {}
```

**Archivo:** `/backend/src/boletas/boletas.service.ts`

```typescript
@Injectable()
export class BoletasService {
  constructor(
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Lectura)
    private lecturasRepository: Repository<Lectura>,
    // ⭐ NUEVA INYECCIÓN
    private tarifasService: TarifasService,
  ) {}
}
```

---

## 7️⃣ **PROCESO DE GENERACIÓN AUTOMÁTICA DE BOLETAS**

**Archivo a crear:** `/backend/src/boletas/boletas-cron.service.ts`

**Propósito:** Generar boletas automáticamente cada mes.

**Código de ejemplo:**
```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BoletasService } from './boletas.service';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class BoletasCronService {
  constructor(
    private boletasService: BoletasService,
    private usuariosService: UsuariosService,
  ) {}

  // Se ejecuta el día 1 de cada mes a las 00:00
  @Cron('0 0 1 * *')
  async generarBoletasMensuales() {
    console.log('🔄 Generando boletas mensuales...');
    
    const ahora = new Date();
    const mesAnterior = ahora.getMonth() === 0 ? 12 : ahora.getMonth();
    const anio = ahora.getMonth() === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear();
    
    // Obtener todos los clientes activos
    const clientes = await this.usuariosService.findAllClientes();
    
    for (const cliente of clientes) {
      try {
        // El método generarBoleta decidirá si usa tarifa mínima o consumo
        await this.boletasService.generarBoleta(
          cliente.id,
          null, // lecturaId opcional
          { mes: mesAnterior, anio }
        );
        
        console.log(`✅ Boleta generada para: ${cliente.nombre}`);
      } catch (error) {
        console.error(`❌ Error generando boleta para ${cliente.nombre}:`, error);
      }
    }
    
    console.log('✅ Generación de boletas completada');
  }
}
```

---

## 📊 FLUJO COMPLETO

```
┌─────────────────────────────────────────┐
│  INICIO: Generar Boleta Mensual        │
│  (Día 1 de cada mes, automático)       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  1. Obtener Cliente                      │
│     - usuario.id                         │
│     - usuario.medidores[]                │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  2. Verificar Medidor Activo             │
│     medidorActivo = medidores.find(m =>  │
│                     m.activo === true)   │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌────────────┐    ┌────────────┐
│ SIN Medidor│    │ CON Medidor│
└─────┬──────┘    └─────┬──────┘
      │                 │
      ▼                 ▼
┌─────────────────┐ ┌──────────────────┐
│ TARIFA MÍNIMA   │ │ CÁLCULO CONSUMO  │
│                 │ │                  │
│ 1. Consultar    │ │ 1. Obtener       │
│    TarifasService│ │    última lectura│
│                 │ │                  │
│ 2. Obtener      │ │ 2. Consultar     │
│    monto_minimo │ │    TarifasService│
│    Ej: $300     │ │                  │
│                 │ │ 3. Calcular:     │
│ 3. Crear Boleta:│ │    cargo_fijo +  │
│    - lectura:null│ │    (m3 * precio) │
│    - monto: $300│ │                  │
│    - obs: "Sin  │ │ 4. Crear Boleta: │
│      medidor"   │ │    - lectura: id │
│                 │ │    - monto: calc │
└─────┬───────────┘ └──────┬───────────┘
      │                    │
      └────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Boleta Guardada en BD                   │
│  - Estado: PENDIENTE                     │
│  - Vencimiento: +15 días                 │
└──────────────────────────────────────────┘
```

---

## ✅ RESUMEN: DÓNDE IMPLEMENTAR

| **Componente** | **Archivo** | **Qué hacer** |
|----------------|-------------|---------------|
| **Lógica principal** | `boletas.service.ts` línea 46 | Modificar `generarBoleta()` para detectar si hay medidor |
| **Tarifa mínima** | `boletas.service.ts` nuevo método | Crear `generarBoletaTarifaMinima()` |
| **Consumo normal** | `boletas.service.ts` nuevo método | Crear `generarBoletaPorConsumo()` |
| **Entidad Tarifa** | `entities/tarifa.entity.ts` | Crear nueva entidad con `monto_minimo` |
| **Servicio Tarifas** | `tarifas/tarifas.service.ts` | Crear servicio para consultar tarifas |
| **Boleta nullable** | `entities/boleta.entity.ts` línea 21 | Hacer `lectura` nullable |
| **Generación auto** | `boletas/boletas-cron.service.ts` | Crear cron job mensual |

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Crear entidad `Tarifa`
2. ✅ Crear módulo y servicio `TarifasService`
3. ✅ Modificar `Boleta.lectura` a nullable
4. ✅ Modificar `BoletasService.generarBoleta()`
5. ✅ Crear métodos `generarBoletaTarifaMinima()` y `generarBoletaPorConsumo()`
6. ✅ Seedear tarifas iniciales en la base de datos
7. ✅ Crear endpoints CRUD para administrar tarifas
8. ✅ Crear interfaz de administración de tarifas en el frontend

---

**💡 Nota:** Esta es una guía de referencia. Cuando estés listo para implementar, podemos hacerlo paso a paso.

