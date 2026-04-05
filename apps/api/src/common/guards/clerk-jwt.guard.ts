import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class ClerkJwtGuard implements CanActivate {
  private readonly logger = new Logger(ClerkJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.jwtService.verifyAsync(token);
      (request as FastifyRequest & { user: unknown }).user = payload;
      return true;
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${String(error)}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
