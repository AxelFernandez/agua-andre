import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login/padron')
  async loginPorPadron(@Body('padron') padron: string) {
    return this.authService.loginPorPadron(padron);
  }

  @Post('login/interno')
  async loginInterno(@Body() body: { email: string; password: string }) {
    return this.authService.loginInterno(body.email, body.password);
  }
}

