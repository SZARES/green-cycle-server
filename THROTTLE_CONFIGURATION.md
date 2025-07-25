# Configuración de Throttling (Rate Limiting)

Este documento describe la implementación de throttling/rate limiting para proteger los endpoints públicos de la aplicación Green Cycle Server.

## Configuración Global

### ThrottlerModule
La configuración global está definida en `src/app.module.ts` con tres niveles de throttling:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 60000, // 1 minuto
    limit: 20, // 20 requests por minuto por IP (general)
  },
  {
    name: 'medium', 
    ttl: 300000, // 5 minutos
    limit: 50, // 50 requests por 5 minutos por IP
  },
  {
    name: 'long',
    ttl: 900000, // 15 minutos
    limit: 100, // 100 requests por 15 minutos por IP
  }
])
```

## Decoradores Personalizados

Los decoradores están definidos en `src/auth/decorators/throttle.decorator.ts`:

### 1. @AuthThrottle()
**Uso:** Endpoints de autenticación (login, register)
**Propósito:** Prevenir ataques de fuerza bruta

- **1 minuto:** 5 intentos máximo
- **5 minutos:** 10 intentos máximo  
- **15 minutos:** 15 intentos máximo

**Endpoints aplicados:**
- `POST /auth/login`
- `POST /auth/register`

### 2. @PublicReadThrottle()
**Uso:** Endpoints públicos de lectura (GET)
**Propósito:** Permitir browsing normal con protección contra scraping

- **1 minuto:** 30 requests máximo
- **5 minutos:** 100 requests máximo
- **15 minutos:** 200 requests máximo

**Endpoints aplicados:**
- `GET /products/:id`
- `GET /categories`
- `GET /categories/:id`

### 3. @SearchThrottle()
**Uso:** Endpoints de búsqueda y filtrado
**Propósito:** Balancear exploración activa con protección

- **1 minuto:** 20 búsquedas máximo
- **5 minutos:** 60 búsquedas máximo
- **15 minutos:** 120 búsquedas máximo

**Endpoints aplicados:**
- `GET /products` (con query parameters)
- `GET /products/active` (con filtros)

### 4. @PublicWriteThrottle()
**Uso:** Endpoints públicos de escritura/registro
**Propósito:** Prevenir spam moderadamente

- **1 minuto:** 10 requests máximo
- **5 minutos:** 25 requests máximo
- **15 minutos:** 50 requests máximo

**Nota:** Actualmente no hay endpoints públicos de escritura, pero el decorador está disponible para uso futuro.

## Endpoints Protegidos

### Autenticación (Strict Limits)
- `POST /auth/login` - @AuthThrottle()
- `POST /auth/register` - @AuthThrottle()

### Productos (Public Access)
- `GET /products` - @SearchThrottle() (permite filtros y búsqueda)
- `GET /products/active` - @SearchThrottle() (permite filtros)
- `GET /products/:id` - @PublicReadThrottle() (lectura de producto específico)

### Categorías (Public Access)
- `GET /categories` - @PublicReadThrottle()
- `GET /categories/:id` - @PublicReadThrottle()

## Funcionamiento

### Identificación por IP
El throttling se aplica por dirección IP del cliente. Cada IP tiene sus propios contadores para cada ventana de tiempo.

### Múltiples Ventanas
El sistema usa múltiples ventanas de tiempo (1 min, 5 min, 15 min) para proporcionar protección en diferentes escalas temporales.

### Headers de Respuesta
Las respuestas incluyen headers informativos:
- `X-RateLimit-Limit`: Límite máximo
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp de reset

### Error Response
Cuando se excede el límite, se retorna:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

## Consideraciones de Seguridad

### Protección Anti-Brute Force
Los endpoints de autenticación tienen límites muy estrictos para prevenir ataques de fuerza bruta.

### Protección Anti-Scraping
Los endpoints de lectura tienen límites que permiten uso normal pero dificultan el scraping masivo.

### Protección Anti-DoS
Los límites globales y específicos proporcionan protección básica contra ataques de denegación de servicio.

## Monitoreo y Métricas

### Logs
El sistema registra automáticamente cuando se exceden los límites de throttling.

### Métricas Recomendadas
- Número de requests throttled por endpoint
- Distribución de requests por IP
- Patrones de uso que podrían indicar abuso

## Configuración Recomendada para Producción

### Variables de Entorno
Considerar hacer los límites configurables via variables de entorno:

```env
# Auth throttling
AUTH_THROTTLE_SHORT_LIMIT=5
AUTH_THROTTLE_MEDIUM_LIMIT=10
AUTH_THROTTLE_LONG_LIMIT=15

# Public read throttling
PUBLIC_READ_SHORT_LIMIT=30
PUBLIC_READ_MEDIUM_LIMIT=100
PUBLIC_READ_LONG_LIMIT=200

# Search throttling
SEARCH_SHORT_LIMIT=20
SEARCH_MEDIUM_LIMIT=60
SEARCH_LONG_LIMIT=120
```

### Redis para Almacenamiento
Para aplicaciones distribuidas, considerar usar Redis como storage backend:

```typescript
ThrottlerModule.forRoot({
  storage: new ThrottlerStorageRedisService(),
  // ... rest of config
})
```

## Extensiones Futuras

### Throttling por Usuario
Implementar límites diferentes para usuarios autenticados vs anónimos.

### Whitelist de IPs
Permitir configurar IPs que no estén sujetas a throttling.

### Rate Limiting Dinámico
Ajustar límites basado en carga del servidor o patrones de tráfico.

### Captcha Integration
Requerir captcha después de cierto número de requests fallidos. 