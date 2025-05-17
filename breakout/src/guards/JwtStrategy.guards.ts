// auth-token.guard.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { AuthService } from 'src/services/auth.services';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private jwtService: JwtService,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['authorization']?.split(' ')[1] // e.g., "Bearer <token>"
    console.log(token)
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const cachedToken = await this.cacheManager.get<string>(`token:${token}`);
    if (!cachedToken) {
      throw new UnauthorizedException('Invalid token or token expired');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = this.jwtService.decode(cachedToken);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    request['user'] = user; // Attach user to request
    return true;
  }
}
