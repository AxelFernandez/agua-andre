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

    console.log('🌱 Sembrando datos iniciales...');

    // Crear zonas (valores reales del sistema)
    const zonaGustavoAndre = await this.zonasRepository.save({
      nombre: 'Gustavo André',
      valor: 10,
      descripcion: 'Zona principal de Gustavo André',
    });

    const zonaElRetiro = await this.zonasRepository.save({
      nombre: 'El Retiro',
      valor: 30,
      descripcion: 'Zona El Retiro',
    });

    const zonaElPuerto = await this.zonasRepository.save({
      nombre: 'El Puerto',
      valor: 40,
      descripcion: 'Zona El Puerto - San Miguel',
    });

    const zonaLosHuarpes = await this.zonasRepository.save({
      nombre: 'Los Huarpes',
      valor: 70,
      descripcion: 'Zona Los Huarpes',
    });

    console.log('✅ Zonas creadas');

    // Crear usuarios
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Administrativo (NO tiene padrón)
    await this.usuariosRepository.save({
      nombre: 'Admin Sistema',
      direccion: 'Oficina Central',
      email: 'admin@aguagandre.com',
      padron: null,
      rol: RolUsuario.ADMINISTRATIVO,
      password: passwordHash,
      zona: zonaGustavoAndre,
      tipo: TipoUsuario.PARTICULARES,
    });

    // Operario (NO tiene padrón)
    await this.usuariosRepository.save({
      nombre: 'Juan Pérez',
      direccion: 'Calle Principal 123',
      email: 'operario@aguagandre.com',
      padron: null,
      rol: RolUsuario.OPERARIO,
      password: passwordHash,
      zona: zonaGustavoAndre,
      tipo: TipoUsuario.PARTICULARES,
    });

    // Clientes (SÍ tienen padrón - formato correcto: ZONA-ID)
    await this.usuariosRepository.save({
      nombre: 'María González',
      direccion: 'Av. San Martín 456',
      email: 'maria@example.com',
      padron: '10-0001',
      rol: RolUsuario.CLIENTE,
      zona: zonaGustavoAndre,
      tipo: TipoUsuario.PARTICULARES,
      whatsapp: '2613456789',
      telefono: '2613456789',
    });

    await this.usuariosRepository.save({
      nombre: 'Pedro Rodríguez',
      direccion: 'Calle Belgrano 789',
      email: 'pedro@example.com',
      padron: '10-0002',
      rol: RolUsuario.CLIENTE,
      zona: zonaGustavoAndre,
      tipo: TipoUsuario.PARTICULARES,
      whatsapp: '2613456790',
      telefono: '2613456790',
    });

    await this.usuariosRepository.save({
      nombre: 'Municipalidad El Retiro',
      direccion: 'Calle Mitre 321',
      email: 'ana@example.com',
      padron: '30-0001',
      rol: RolUsuario.CLIENTE,
      zona: zonaElRetiro,
      tipo: TipoUsuario.ENTIDAD_PUBLICA,
      whatsapp: '2613456791',
      telefono: '2613456791',
    });

    console.log('✅ Usuarios de prueba creados');
    console.log('');
    console.log('👤 Credenciales de acceso:');
    console.log('');
    console.log('   CLIENTES (acceso por padrón):');
    console.log('   - Padrón: 10-0001 (María González)');
    console.log('   - Padrón: 10-0002 (Pedro Rodríguez)');
    console.log('   - Padrón: 30-0001 (Ana López)');
    console.log('');
    console.log('   ADMINISTRATIVO (sin padrón):');
    console.log('   - Email: admin@aguagandre.com');
    console.log('   - Contraseña: admin123');
    console.log('');
    console.log('   OPERARIO (sin padrón):');
    console.log('   - Email: operario@aguagandre.com');
    console.log('   - Contraseña: admin123');
    console.log('');

    // Seed del tarifario
    await this.tarifarioSeedService.seedTarifario();
    console.log('');
  }
}

