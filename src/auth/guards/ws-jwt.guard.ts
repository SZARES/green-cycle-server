import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token = client.handshake.auth.token;
      
      if (!token) {
        throw new WsException('Token no proporcionado');
      }

      const payload = this.jwtService.verify(token);
      client.user = payload;
      
      return true;
    } catch (err) {
      throw new WsException('Token inválido');
    }
  }
} 