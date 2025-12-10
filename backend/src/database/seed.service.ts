import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Zona } from '../entities/zona.entity';
import { Usuario, RolUsuario, TipoUsuario } from '../entities/usuario.entity';
import { TarifarioSeedService } from './tarifario-seed.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Zona)
    private zonasRepository: Repository<Zona>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private tarifarioSeedService: TarifarioSeedService,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    // Verificar si ya hay datos
    const zonaCount = await this.zonasRepository.count();
    if (zonaCount > 0) {
      console.log('✅ La base de datos ya tiene datos iniciales');
      return;
    }

    console.log('🌱 Sembrando datos iniciales (zonas + usuarios base) ...');

    // Zonas según init-database.sql
    const zonas = await this.zonasRepository.save([
      {
        nombre: 'Gustavo André',
        valor: 100,
        descripcion: 'Operario: Luis Ríos',
      },
      {
        nombre: 'Asunción',
        valor: 200,
        descripcion: 'Operario: Jofre Javier',
      },
      {
        nombre: 'Retiro',
        valor: 300,
        descripcion: 'Operario: Perez Matias',
      },
      {
        nombre: 'San Miguel / Puerto',
        valor: 400,
        descripcion: 'Operario: Villegas Aldo / Lucero Ramon',
      },
      {
        nombre: 'Retamo / Forzudo',
        valor: 500,
        descripcion: 'Operario: Zalaba Juan / Soria Jose',
      },
      {
        nombre: 'San Jose',
        valor: 600,
        descripcion: 'Operario: Gonzalez Edgar',
      },
      {
        nombre: 'Lagunas Del Rosario',
        valor: 700,
        descripcion: 'Operario: Zalazar Juan',
      },
    ]);

    const zonaDefault = zonas[0];

    // Usuarios según init-database.sql
    const passwordHash = await bcrypt.hash('admin123', 10);

    await this.usuariosRepository.save({
      nombre: 'Admin Sistema',
      direccion: 'Oficina Central',
      email: 'admin@aguagandre.com',
      padron: null,
      rol: RolUsuario.ADMINISTRATIVO,
      password: passwordHash,
      zona: zonaDefault,
      tipo: TipoUsuario.PARTICULARES,
    });

    await this.usuariosRepository.save({
      nombre: 'Juan Pérez',
      direccion: 'Calle Principal 123',
      email: 'operario@aguagandre.com',
      padron: null,
      rol: RolUsuario.OPERARIO,
      password: passwordHash,
      zona: zonaDefault,
      tipo: TipoUsuario.PARTICULARES,
    });

    console.log('✅ Zonas y usuarios base creados');

    // Seed del tarifario (se mantiene)
    await this.tarifarioSeedService.seedTarifario();
    console.log('✅ Tarifario inicial creado');
  }
}

