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
      console.error('Error en validación de token WebSocket:', err.message);
      if (err.name === 'JsonWebTokenError') {
        throw new WsException('Token inválido o mal formado');
      } else if (err.name === 'TokenExpiredError') {
        throw new WsException('Token expirado');
      }
      throw new WsException('Error en autenticación');
    }
  }
} 