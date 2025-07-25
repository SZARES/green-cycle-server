import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Determinar el tipo de endpoint para personalizar el mensaje
    const path = request.url;
    let message = 'Has excedido el límite de solicitudes. Por favor, espera un momento antes de intentar nuevamente.';
    let suggestion = 'Intenta nuevamente en unos minutos.';

    // Personalizar mensaje según el endpoint
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      message = 'Has intentado demasiadas veces. Por seguridad, tu acceso ha sido temporalmente limitado.';
      suggestion = 'Espera 1 minuto antes de intentar iniciar sesión nuevamente.';
    } else if (path.includes('/products') || path.includes('/categories')) {
      message = 'Has realizado demasiadas consultas muy rápido.';
      suggestion = 'Reduce la velocidad de navegación para una mejor experiencia.';
    }

    // Calcular tiempo de espera estimado (en segundos)
    const retryAfterSeconds = 60; // Por defecto 1 minuto

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      success: false,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Rate Limit Exceeded',
      message,
      suggestion,
      details: {
        retryAfter: retryAfterSeconds,
        retryAfterHuman: `${Math.ceil(retryAfterSeconds / 60)} minuto(s)`,
        timestamp: new Date().toISOString(),
        path: request.url
      },
      help: {
        es: 'Si continúas teniendo problemas, contacta a soporte técnico.',
        en: 'If you continue having issues, please contact technical support.'
      }
    });
  }
} 