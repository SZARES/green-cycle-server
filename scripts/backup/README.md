# 📦 Sistema de Backups - Green Cycle Server

Este sistema proporciona una solución completa y automatizada para backups de la base de datos MongoDB del proyecto Green Cycle.

## 🚀 Características

- **Backups automáticos** con cron jobs
- **Múltiples tipos** de backup (diario, semanal, mensual, manual)
- **Compresión automática** para ahorrar espacio
- **Limpieza automática** de backups antiguos
- **Restauración fácil** desde cualquier backup
- **API REST** para gestión via HTTP
- **Scripts manuales** para operaciones puntuales

## 📁 Estructura de Archivos

```
scripts/backup/
├── backup-database.js      # Script manual para crear backups
├── restore-database.js     # Script manual para restaurar backups
├── cleanup-backups.js      # Script para limpiar backups antiguos
└── README.md              # Esta documentación

src/backup/
├── backup.service.ts       # Servicio NestJS con cron jobs
├── backup.controller.ts    # API REST endpoints
└── backup.module.ts        # Módulo de NestJS

backups/                   # Directorio donde se almacenan los backups
├── daily/                 # Backups diarios (mantiene 7 días)
├── weekly/                # Backups semanales (mantiene 4 semanas)
├── monthly/               # Backups mensuales (mantiene 12 meses)
└── manual/                # Backups manuales (mantiene 30 días)
```

## ⚙️ Configuración

### Variables de Entorno

Copia `.env.backup.example` a tu archivo `.env` y configura:

```bash
# Configuración básica
BACKUP_PATH=./backups
MONGODB_URI=mongodb://localhost:27017/green-cycle
BACKUP_COMPRESSION=true

# Políticas de retención
DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_WEEKS=4
MONTHLY_RETENTION_MONTHS=12
MANUAL_RETENTION_DAYS=30
```

### Prerequisitos

1. **MongoDB Tools** instalado en el servidor:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb-database-tools
   
   # Windows
   # Descargar desde: https://www.mongodb.com/try/download/database-tools
   ```

2. **Dependencias de Node.js** (ya instaladas):
   ```bash
   npm install @nestjs/schedule fs-extra archiver unzipper
   ```

## 🕒 Horarios Automáticos

Los backups se ejecutan automáticamente en estos horarios:

- **Diario**: Todos los días a las 2:00 AM
- **Semanal**: Domingos a las 3:00 AM
- **Mensual**: Día 1 de cada mes a las 4:00 AM

## 📝 Scripts Manuales

### Crear Backup Manual

```bash
# Usando npm script
npm run backup:create

# Directamente
node scripts/backup/backup-database.js
```

### Restaurar Backup

```bash
# Listar backups disponibles
npm run backup:list

# Restaurar backup específico
npm run backup:restore -- ./backups/manual/2024-01-15T02-00-00-000Z

# O directamente
node scripts/backup/restore-database.js ./backups/manual/2024-01-15T02-00-00-000Z.zip
```

### Limpiar Backups Antiguos

```bash
# Ver estado actual
npm run backup:status

# Ejecutar limpieza
npm run backup:cleanup

# Directamente
node scripts/backup/cleanup-backups.js --status
node scripts/backup/cleanup-backups.js
```

### Backup de Prueba

```bash
# Crear backup y verificar
npm run backup:test
```

## 🌐 API REST Endpoints

Una vez que la aplicación esté ejecutándose, puedes usar estos endpoints:

### Crear Backup Manual
```http
POST /backup/create
Authorization: Bearer <jwt-token>
```

### Obtener Información de Backups
```http
GET /backup/info
Authorization: Bearer <jwt-token>
```

### Restaurar Backup
```http
POST /backup/restore
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "backupPath": "./backups/manual/2024-01-15T02-00-00-000Z"
}
```

### Ejecutar Backups Manualmente
```http
POST /backup/daily
POST /backup/weekly  
POST /backup/monthly
Authorization: Bearer <jwt-token>
```

## 🔧 Personalización

### Cambiar Horarios de Cron Jobs

Edita `src/backup/backup.service.ts`:

```typescript
@Cron('0 2 * * *') // Diario a las 2 AM
async createDailyBackup() { ... }

@Cron('0 3 * * 0') // Semanal domingo 3 AM
async createWeeklyBackup() { ... }

@Cron('0 4 1 * *') // Mensual día 1 a las 4 AM
async createMonthlyBackup() { ... }
```

### Cambiar Políticas de Retención

Modifica las variables de entorno:

```bash
DAILY_RETENTION_DAYS=14      # Mantener 14 días en lugar de 7
WEEKLY_RETENTION_WEEKS=8     # Mantener 8 semanas en lugar de 4
MONTHLY_RETENTION_MONTHS=24  # Mantener 24 meses en lugar de 12
```

## 🛡️ Seguridad y Mejores Prácticas

### Permisos de Archivos

```bash
# Asegurar que solo el usuario de la app puede acceder
chmod 700 backups/
chmod 600 backups/*
```

### Encriptación (Opcional)

Para encriptar backups, puedes usar GPG:

```bash
# Encriptar backup
gpg --symmetric --cipher-algo AES256 backup.zip

# Desencriptar
gpg --output backup.zip --decrypt backup.zip.gpg
```

### Almacenamiento Remoto

Considera subir backups a:
- **AWS S3**
- **Google Cloud Storage**
- **Azure Blob Storage**
- **Dropbox / Google Drive**

## 🚨 Troubleshooting

### Error: "mongodump command not found"

**Solución**: Instalar MongoDB Database Tools
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mongodb-database-tools

# verificar instalación
mongodump --version
```

### Error: "Permission denied writing to backup directory"

**Solución**: Verificar permisos del directorio
```bash
sudo chown -R $(whoami):$(whoami) ./backups
chmod 755 ./backups
```

### Backups muy grandes

**Soluciones**:
1. Habilitar compresión: `BACKUP_COMPRESSION=true`
2. Reducir retención: ajustar `*_RETENTION_*` variables
3. Implementar backup incremental (requiere desarrollo adicional)

### Fallos en cron jobs

**Verificación**:
1. Revisar logs de la aplicación NestJS
2. Verificar que el servicio esté funcionando
3. Comprobar variables de entorno
4. Verificar permisos de MongoDB

## 📊 Monitoreo

### Logs

Los logs de backup se almacenan en:
- Aplicación NestJS: logs estándar de la app
- Scripts manuales: `./backups/backup.log`

### Health Check

```bash
# Verificar último backup
ls -la backups/daily/ | head -5

# Verificar espacio en disco
df -h backups/

# Estado del sistema
npm run backup:status
```

## 🔮 Próximas Mejoras

- [ ] Backups incrementales
- [ ] Notificaciones por email/Slack
- [ ] Almacenamiento en la nube
- [ ] Dashboard web de monitoreo
- [ ] Encriptación automática
- [ ] Verificación de integridad
- [ ] Backups de archivos de la aplicación
- [ ] Métricas y alertas
- [ ] Restauración point-in-time

## 📞 Soporte

Si tienes problemas con el sistema de backups:

1. Revisa esta documentación
2. Verifica los logs de la aplicación
3. Ejecuta `npm run backup:status` para diagnóstico
4. Verifica que todas las dependencias estén instaladas

---

**¡Importante!** 🚨 Siempre prueba el proceso de restauración en un entorno de desarrollo antes de confiar completamente en los backups. 