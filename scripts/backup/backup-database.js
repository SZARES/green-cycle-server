const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
require('dotenv').config();

// Configuración
const BACKUP_PATH = process.env.BACKUP_PATH || './backups';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle';
const COMPRESSION = process.env.BACKUP_COMPRESSION === 'true';

async function createBackup() {
  try {
    console.log('🚀 Iniciando backup manual de la base de datos...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(BACKUP_PATH, 'manual', timestamp);
    
    // Asegurar que el directorio existe
    await fs.ensureDir(backupDir);
    
    console.log(`📁 Directorio de backup: ${backupDir}`);
    
    // Ejecutar mongodump
    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupDir}"`;
    console.log(`⚡ Ejecutando: ${command}`);
    
    await new Promise((resolve, reject) => {
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error en backup:', error.message);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.warn('⚠️ Advertencias:', stderr);
        }
        
        console.log('✅ Mongodump completado');
        if (stdout) console.log(stdout);
        
        // Crear archivo de metadatos
        await createBackupMetadata(backupDir);
        
        // Comprimir si está habilitado
        if (COMPRESSION) {
          await compressBackup(backupDir);
        }
        
        console.log(`🎉 Backup completado exitosamente: ${timestamp}`);
        console.log(`📍 Ubicación: ${backupDir}${COMPRESSION ? '.zip' : ''}`);
        
        resolve();
      });
    });
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
    process.exit(1);
  }
}

async function createBackupMetadata(backupDir) {
  const metadata = {
    timestamp: new Date().toISOString(),
    type: 'manual',
    mongoUri: MONGODB_URI,
    nodeVersion: process.version,
    size: await getDirectorySize(backupDir),
    compressed: COMPRESSION
  };

  await fs.writeJson(path.join(backupDir, 'backup-metadata.json'), metadata, { spaces: 2 });
  console.log('📋 Metadatos del backup creados');
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

async function compressBackup(backupDir) {
  return new Promise((resolve, reject) => {
    console.log('🗜️ Comprimiendo backup...');
    
    const zipPath = `${backupDir}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compresión
    });

    output.on('close', async () => {
      const compressedSize = archive.pointer();
      console.log(`✅ Compresión completada: ${Math.round(compressedSize / 1024 / 1024 * 100) / 100} MB`);
      
      // Eliminar carpeta sin comprimir
      await fs.remove(backupDir);
      console.log('🗑️ Directorio temporal eliminado');
      
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      console.error('❌ Error comprimiendo:', err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(backupDir, false);
    archive.finalize();
  });
}

// Ejecutar backup si este script se ejecuta directamente
if (require.main === module) {
  createBackup().catch(console.error);
}

module.exports = { createBackup }; 