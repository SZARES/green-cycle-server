const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
require('dotenv').config();

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle';

async function restoreBackup(backupPath) {
  try {
    if (!backupPath) {
      console.error('❌ Debes especificar la ruta del backup');
      console.log('💡 Uso: node restore-database.js <ruta-del-backup>');
      console.log('💡 Ejemplo: node restore-database.js ./backups/manual/2024-01-15T02-00-00-000Z');
      process.exit(1);
    }

    console.log('🚀 Iniciando restauración de la base de datos...');
    console.log(`📁 Backup a restaurar: ${backupPath}`);

    // Verificar que el backup existe
    if (!await fs.pathExists(backupPath)) {
      console.error(`❌ Backup no encontrado: ${backupPath}`);
      process.exit(1);
    }

    let actualBackupPath = backupPath;

    // Si es un archivo ZIP, extraerlo primero
    if (path.extname(backupPath) === '.zip') {
      console.log('📦 Extrayendo archivo ZIP...');
      actualBackupPath = await extractZipBackup(backupPath);
    }

    // Verificar que es un directorio válido de backup
    const backupDirs = await fs.readdir(actualBackupPath);
    if (backupDirs.length === 0) {
      console.error('❌ El directorio de backup está vacío');
      process.exit(1);
    }

    console.log('⚠️ ¡ADVERTENCIA! Esta operación eliminará todos los datos actuales de la base de datos');
    console.log('⚠️ ¿Estás seguro de que quieres continuar? (Presiona Ctrl+C para cancelar)');
    
    // Esperar 5 segundos para que el usuario pueda cancelar
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Ejecutar mongorestore
    const command = `mongorestore --uri="${MONGODB_URI}" --drop "${actualBackupPath}"`;
    console.log(`⚡ Ejecutando: ${command}`);

    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error en restauración:', error.message);
          reject(error);
          return;
        }

        if (stderr) {
          console.warn('⚠️ Advertencias:', stderr);
        }

        console.log('✅ Restauración completada exitosamente');
        if (stdout) console.log(stdout);

        resolve();
      });
    });

    // Limpiar archivos temporales si se extrajo un ZIP
    if (path.extname(backupPath) === '.zip' && actualBackupPath !== backupPath) {
      await fs.remove(actualBackupPath);
      console.log('🗑️ Archivos temporales eliminados');
    }

    console.log('🎉 Restauración completada exitosamente');

  } catch (error) {
    console.error('💥 Error general:', error.message);
    process.exit(1);
  }
}

async function extractZipBackup(zipPath) {
  const tempDir = path.join(path.dirname(zipPath), 'temp_restore_' + Date.now());
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: tempDir }))
      .on('close', () => {
        console.log('✅ Archivo ZIP extraído');
        resolve(tempDir);
      })
      .on('error', reject);
  });
}

async function listAvailableBackups() {
  console.log('📋 Backups disponibles:');
  console.log('');

  const backupTypes = ['daily', 'weekly', 'monthly', 'manual'];
  const BACKUP_PATH = process.env.BACKUP_PATH || './backups';

  for (const type of backupTypes) {
    const typeDir = path.join(BACKUP_PATH, type);
    
    if (await fs.pathExists(typeDir)) {
      const backups = await fs.readdir(typeDir);
      const validBackups = backups
        .filter(backup => backup.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/))
        .sort()
        .reverse()
        .slice(0, 5); // Mostrar solo los 5 más recientes

      if (validBackups.length > 0) {
        console.log(`📁 ${type.toUpperCase()}:`);
        for (const backup of validBackups) {
          const backupPath = path.join(typeDir, backup);
          const stats = await fs.stat(backupPath);
          const size = stats.isDirectory() ? 
            'directorio' : 
            `${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`;
          
          console.log(`   • ${backup} (${size})`);
          console.log(`     Ruta: ${backupPath}`);
        }
        console.log('');
      }
    }
  }
}

// Manejo de argumentos de línea de comandos
const args = process.argv.slice(2);

if (require.main === module) {
  if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    listAvailableBackups().catch(console.error);
  } else {
    const backupPath = args[0];
    restoreBackup(backupPath).catch(console.error);
  }
}

module.exports = { restoreBackup, listAvailableBackups }; 