const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// Configuración
const BACKUP_PATH = process.env.BACKUP_PATH || './backups';
const RETENTION_POLICIES = {
  daily: parseInt(process.env.DAILY_RETENTION_DAYS) || 7,
  weekly: parseInt(process.env.WEEKLY_RETENTION_WEEKS) || 4,
  monthly: parseInt(process.env.MONTHLY_RETENTION_MONTHS) || 12,
  manual: parseInt(process.env.MANUAL_RETENTION_DAYS) || 30
};

async function cleanupBackups() {
  try {
    console.log('🧹 Iniciando limpieza de backups antiguos...');
    console.log('📋 Políticas de retención:');
    
    for (const [type, retention] of Object.entries(RETENTION_POLICIES)) {
      const unit = type === 'weekly' ? 'semanas' : 
                   type === 'monthly' ? 'meses' : 'días';
      console.log(`   • ${type}: ${retention} ${unit}`);
    }
    
    console.log('');

    let totalCleaned = 0;
    let totalSpaceSaved = 0;

    for (const [type, retentionCount] of Object.entries(RETENTION_POLICIES)) {
      const { cleaned, spaceSaved } = await cleanupBackupType(type, retentionCount);
      totalCleaned += cleaned;
      totalSpaceSaved += spaceSaved;
    }

    console.log('');
    console.log('🎉 Limpieza completada:');
    console.log(`   • Backups eliminados: ${totalCleaned}`);
    console.log(`   • Espacio liberado: ${formatBytes(totalSpaceSaved)}`);

  } catch (error) {
    console.error('💥 Error en limpieza:', error.message);
    process.exit(1);
  }
}

async function cleanupBackupType(type, retentionCount) {
  const backupTypeDir = path.join(BACKUP_PATH, type);
  
  if (!await fs.pathExists(backupTypeDir)) {
    console.log(`⚠️ Directorio ${type} no existe, saltando...`);
    return { cleaned: 0, spaceSaved: 0 };
  }

  const backups = await fs.readdir(backupTypeDir);
  
  // Filtrar solo archivos/directorios de backup válidos
  const validBackups = backups.filter(backup => 
    backup.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/) // Formato timestamp
  );

  // Ordenar por fecha (más recientes primero)
  validBackups.sort().reverse();

  console.log(`📁 ${type.toUpperCase()}: ${validBackups.length} backups encontrados`);

  if (validBackups.length <= retentionCount) {
    console.log(`   ✅ No hay backups que eliminar (límite: ${retentionCount})`);
    return { cleaned: 0, spaceSaved: 0 };
  }

  // Backups a eliminar (los más antiguos)
  const backupsToDelete = validBackups.slice(retentionCount);
  let spaceSaved = 0;

  console.log(`   🗑️ Eliminando ${backupsToDelete.length} backups antiguos:`);

  for (const backup of backupsToDelete) {
    const backupPath = path.join(backupTypeDir, backup);
    
    try {
      // Calcular tamaño antes de eliminar
      const size = await getPathSize(backupPath);
      spaceSaved += size;
      
      // Eliminar backup
      await fs.remove(backupPath);
      
      console.log(`      • ${backup} (${formatBytes(size)})`);
    } catch (error) {
      console.error(`      ❌ Error eliminando ${backup}:`, error.message);
    }
  }

  return { 
    cleaned: backupsToDelete.length, 
    spaceSaved: spaceSaved 
  };
}

async function getPathSize(pathToCheck) {
  const stat = await fs.stat(pathToCheck);
  
  if (stat.isDirectory()) {
    return await getDirectorySize(pathToCheck);
  } else {
    return stat.size;
  }
}

async function getDirectorySize(dirPath) {
  let size = 0;
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      size += await getDirectorySize(filePath);
    } else {
      size += stat.size;
    }
  }
  
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function showBackupStatus() {
  console.log('📊 Estado actual de backups:');
  console.log('');

  for (const type of Object.keys(RETENTION_POLICIES)) {
    const backupTypeDir = path.join(BACKUP_PATH, type);
    
    if (await fs.pathExists(backupTypeDir)) {
      const backups = await fs.readdir(backupTypeDir);
      const validBackups = backups.filter(backup => 
        backup.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)
      );
      
      let totalSize = 0;
      for (const backup of validBackups) {
        const backupPath = path.join(backupTypeDir, backup);
        totalSize += await getPathSize(backupPath);
      }
      
      console.log(`📁 ${type.toUpperCase()}:`);
      console.log(`   • Cantidad: ${validBackups.length} backups`);
      console.log(`   • Tamaño total: ${formatBytes(totalSize)}`);
      console.log(`   • Límite: ${RETENTION_POLICIES[type]}`);
      
      if (validBackups.length > RETENTION_POLICIES[type]) {
        const excess = validBackups.length - RETENTION_POLICIES[type];
        console.log(`   ⚠️ Exceso: ${excess} backups para limpiar`);
      } else {
        console.log(`   ✅ Dentro del límite`);
      }
      console.log('');
    } else {
      console.log(`📁 ${type.toUpperCase()}: Directorio no existe`);
      console.log('');
    }
  }
}

// Manejo de argumentos de línea de comandos
const args = process.argv.slice(2);

if (require.main === module) {
  if (args.includes('--status') || args.includes('-s')) {
    showBackupStatus().catch(console.error);
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🧹 Script de limpieza de backups');
    console.log('');
    console.log('Uso:');
    console.log('  node cleanup-backups.js           # Ejecutar limpieza');
    console.log('  node cleanup-backups.js --status  # Mostrar estado actual');
    console.log('  node cleanup-backups.js --help    # Mostrar esta ayuda');
    console.log('');
    console.log('Variables de entorno:');
    console.log('  BACKUP_PATH                 # Ruta de backups (default: ./backups)');
    console.log('  DAILY_RETENTION_DAYS         # Días a mantener backups diarios (default: 7)');
    console.log('  WEEKLY_RETENTION_WEEKS       # Semanas a mantener backups semanales (default: 4)');
    console.log('  MONTHLY_RETENTION_MONTHS     # Meses a mantener backups mensuales (default: 12)');
    console.log('  MANUAL_RETENTION_DAYS        # Días a mantener backups manuales (default: 30)');
  } else {
    cleanupBackups().catch(console.error);
  }
}

module.exports = { cleanupBackups, showBackupStatus }; 