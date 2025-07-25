import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Decorador para endpoints de autenticación (login, register)
 * Límites más estrictos para prevenir ataques de fuerza bruta
 */
export const AuthThrottle = () => 
  applyDecorators(
    Throttle({
      short: { ttl: 60000, limit: 5 },  // 5 intentos por minuto
      medium: { ttl: 300000, limit: 10 }, // 10 intentos por 5 minutos
      long: { ttl: 900000, limit: 15 }   // 15 intentos por 15 minutos
    })
  );

/**
 * Decorador para endpoints públicos de lectura (GET products, categories)
 * Límites más permisivos para browsing normal
 */
export const PublicReadThrottle = () =>
  applyDecorators(
    Throttle({
      short: { ttl: 60000, limit: 20 },  // 20 requests por minuto
      medium: { ttl: 300000, limit: 30 }, // 30 requests por 5 minutos
      long: { ttl: 900000, limit: 50 }   // 50 requests por 15 minutos
    })
  );

/**
 * Decorador para endpoints de búsqueda y filtrado
 * Límites balanceados para permitir exploración activa
 */
export const SearchThrottle = () =>
  applyDecorators(
    Throttle({
      short: { ttl: 60000, limit: 50 },  // 50 búsquedas por minuto
      medium: { ttl: 300000, limit: 100 }, // 100 búsquedas por 5 minutos
      long: { ttl: 900000, limit: 150 }  // 150 búsquedas por 15 minutos
    })
  );

