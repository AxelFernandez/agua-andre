import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ZonasModule } from './zonas/zonas.module';
import { MedidoresModule } from './medidores/medidores.module';
import { LecturasModule } from './lecturas/lecturas.module';
import { BoletasModule } from './boletas/boletas.module';
import { PagosModule } from './pagos/pagos.module';
import { SeedModule } from './database/seed.module';
import { ImportModule } from './import/import.module';
import { TarifarioModule } from './tarifario/tarifario.module';
import { HealthModule } from './health/health.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres123',
      database: process.env.DATABASE_NAME || 'agua_potable',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: !isProduction, // Deshabilitado en producción
      logging: !isProduction,     // Sin logs en producción
    }),
    HealthModule,
    AuthModule,
    UsuariosModule,
    ZonasModule,
    MedidoresModule,
    LecturasModule,
    BoletasModule,
    PagosModule,
    SeedModule,
    ImportModule,
    TarifarioModule,
  ],
})
export class AppModule {}

