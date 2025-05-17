import { Body, Controller, Post, Get, UseGuards, Req, ValidationPipe  } from '@nestjs/common';
import { AuthService } from 'src/services/auth.services';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { Request } from 'express';
import { GoogleAuth } from 'src/DTO/googleAuth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body( new ValidationPipe({whitelist: true})) body: GoogleAuth) {
    return this.authService.validateGoogleToken(body.credential);
  }

  @Get('profile')
  @UseGuards(AuthTokenGuard)
  async getProfile(@Req() req:Request) {
    return await this.authService.getProfile(req);
  }

  @Post('logout')
  @UseGuards(AuthTokenGuard)
  logout(@Req() req:Request) {
    return this.authService.logout(req);
  }
}
