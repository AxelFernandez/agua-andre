import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ZonasModule } from './zonas/zonas.module';
import { MedidoresModule } from './medidores/medidores.module';
import { LecturasModule } from './lecturas/lecturas.module';
import { BoletasModule } from './boletas/boletas.module';
import { PagosModule } from './pagos/pagos.module';
import { SeedModule } from './database/seed.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres123',
      database: process.env.DATABASE_NAME || 'agua_potable',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // En producción debe ser false y usar migraciones
      logging: true,
    }),
    AuthModule,
    UsuariosModule,
    ZonasModule,
    MedidoresModule,
    LecturasModule,
    BoletasModule,
    PagosModule,
    SeedModule,
    ImportModule,
  ],
})
export class AppModule {}

