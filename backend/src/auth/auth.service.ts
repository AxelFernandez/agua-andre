import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario, RolUsuario } from '../entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const usuario = await this.usuariosRepository.findOne({
      where: [
        { email: username },
        { padron: username },
      ],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Los clientes acceden solo con padrón, sin contraseña
    if (usuario.rol === RolUsuario.CLIENTE) {
      return usuario;
    }

    // Operarios y administrativos necesitan contraseña
    if (usuario.password && await bcrypt.compare(password, usuario.password)) {
      const { password, ...result } = usuario;
      return result;
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  async loginPorPadron(padron: string) {
    const usuario = await this.usuariosRepository.findOne({
      where: { padron },
      relations: ['zona', 'medidor'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Padrón inválido. Formato esperado: 10-0001');
    }

    if (usuario.rol !== RolUsuario.CLIENTE) {
      throw new UnauthorizedException('Este padrón no corresponde a un cliente');
    }

    const payload = { 
      sub: usuario.id, 
      email: usuario.email, 
      rol: usuario.rol,
      padron: usuario.padron,
    };

    // Obtener medidor activo
    const medidorActivo = (usuario as any).medidores?.find((m: any) => m.activo === true) || null;
    
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        padron: usuario.padron,
        rol: usuario.rol,
        zona: usuario.zona,
        medidor: medidorActivo,
      },
    };
  }

  async loginInterno(email: string, password: string) {
    const usuario = await this.validateUser(email, password);
    
    if (usuario.rol === RolUsuario.CLIENTE) {
      throw new UnauthorizedException('Acceso no autorizado');
    }

    const payload = { 
      sub: usuario.id, 
      email: usuario.email, 
      rol: usuario.rol,
      padron: usuario.padron,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

