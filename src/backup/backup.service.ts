import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly execAsync = promisify(exec);
  private readonly backupPath = process.env.BACKUP_PATH || './backups';

  constructor() {
    // Asegurar que los directorios de backup existen
    this.ensureBackupDirectories();
  }

  @Cron('0 2 * * *') // Diario a las 2 AM
  async createDailyBackup() {
    this.logger.log('Iniciando backup diario...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupPath, 'daily', timestamp);
      
      await this.createBackup(backupDir, 'daily');
      
      if (process.env.BACKUP_COMPRESSION === 'true') {
        await this.compressBackup(backupDir);
      }
      
      await this.cleanupOldBackups('daily', 7); // Mantener 7 días
      
      this.logger.log(`✅ Backup diario completado: ${timestamp}`);
    } catch (error) {
      this.logger.error('❌ Error en backup diario:', error);
      // Aquí podrías agregar notificaciones por email/slack
    }
  }

  @Cron('0 3 * * 0') // Semanal: Domingo a las 3 AM
  async createWeeklyBackup() {
    this.logger.log('Iniciando backup semanal...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupPath, 'weekly', timestamp);
      
      await this.createBackup(backupDir, 'weekly');
      
      if (process.env.BACKUP_COMPRESSION === 'true') {
        await this.compressBackup(backupDir);
      }
      
      await this.cleanupOldBackups('weekly', 4); // Mantener 4 semanas
      
      this.logger.log(`✅ Backup semanal completado: ${timestamp}`);
    } catch (error) {
      this.logger.error('❌ Error en backup semanal:', error);
    }
  }

  @Cron('0 4 1 * *') // Mensual: Día 1 a las 4 AM
  async createMonthlyBackup() {
    this.logger.log('Iniciando backup mensual...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupPath, 'monthly', timestamp);
      
      await this.createBackup(backupDir, 'monthly');
      
      if (process.env.BACKUP_COMPRESSION === 'true') {
        await this.compressBackup(backupDir);
      }
      
      await this.cleanupOldBackups('monthly', 12); // Mantener 12 meses
      
      this.logger.log(`✅ Backup mensual completado: ${timestamp}`);
    } catch (error) {
      this.logger.error('❌ Error en backup mensual:', error);
    }
  }

  // Método público para backups manuales
  async createManualBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.backupPath, 'manual', timestamp);
    
    await this.createBackup(backupDir, 'manual');
    
    if (process.env.BACKUP_COMPRESSION === 'true') {
      await this.compressBackup(backupDir);
      return `${backupDir}.zip`;
    }
    
    return backupDir;
  }

  private async ensureBackupDirectories() {
    const dirs = ['daily', 'weekly', 'monthly', 'manual'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.backupPath, dir));
    }
  }

  private async createBackup(backupDir: string, type: string) {
    await fs.ensureDir(backupDir);
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle';
    
    // Usar mongodump para crear el backup
    const command = `mongodump --uri="${mongoUri}" --out="${backupDir}"`;
    
    this.logger.log(`Ejecutando backup ${type}: ${command}`);
    
    try {
      const { stdout, stderr } = await this.execAsync(command);
      
      if (stderr) {
        this.logger.warn(`Advertencias en backup: ${stderr}`);
      }
      
      this.logger.log(`Backup ${type} creado exitosamente en: ${backupDir}`);
      
      // Crear archivo de metadatos
      await this.createBackupMetadata(backupDir, type);
      
    } catch (error) {
      this.logger.error(`Error ejecutando mongodump: ${error.message}`);
      throw error;
    }
  }

  private async createBackupMetadata(backupDir: string, type: string) {
    const metadata = {
      timestamp: new Date().toISOString(),
      type: type,
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle',
      nodeVersion: process.version,
      appVersion: process.env.npm_package_version || '0.0.1',
      size: await this.getDirectorySize(backupDir)
    };

    await fs.writeJson(path.join(backupDir, 'backup-metadata.json'), metadata, { spaces: 2 });
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        size += await this.getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    }
    
    return size;
  }

  private async compressBackup(backupDir: string): Promise<string> {
    const zipPath = `${backupDir}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compresión
    });

    return new Promise((resolve, reject) => {
      output.on('close', async () => {
        this.logger.log(`Backup comprimido: ${archive.pointer()} bytes`);
        
        // Eliminar carpeta sin comprimir para ahorrar espacio
        await fs.remove(backupDir);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        this.logger.error('Error comprimiendo backup:', err);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(backupDir, false);
      archive.finalize();
    });
  }

  private async cleanupOldBackups(type: string, retentionCount: number) {
    const backupTypeDir = path.join(this.backupPath, type);
    
    if (!await fs.pathExists(backupTypeDir)) {
      return;
    }

    const backups = await fs.readdir(backupTypeDir);
    
    // Filtrar solo archivos/directorios de backup (excluir .gitkeep, etc.)
    const validBackups = backups.filter(backup => 
      backup.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/) // Formato timestamp
    );

    // Ordenar por fecha (más recientes primero)
    validBackups.sort().reverse();

    // Eliminar backups antiguos
    if (validBackups.length > retentionCount) {
      const backupsToDelete = validBackups.slice(retentionCount);
      
      for (const backup of backupsToDelete) {
        const backupPath = path.join(backupTypeDir, backup);
        await fs.remove(backupPath);
        this.logger.log(`🗑️ Backup antiguo eliminado: ${backup}`);
      }
    }
  }

  // Método para restaurar backup
  async restoreBackup(backupPath: string): Promise<void> {
    this.logger.log(`Iniciando restauración desde: ${backupPath}`);
    
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup no encontrado: ${backupPath}`);
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle';
    
    // Si es un archivo zip, extraerlo primero
    let actualBackupPath = backupPath;
    if (path.extname(backupPath) === '.zip') {
      // Aquí podrías implementar la extracción del ZIP
      throw new Error('Restauración desde ZIP no implementada aún');
    }

    const command = `mongorestore --uri="${mongoUri}" --drop "${actualBackupPath}"`;
    
    try {
      const { stdout, stderr } = await this.execAsync(command);
      
      if (stderr) {
        this.logger.warn(`Advertencias en restauración: ${stderr}`);
      }
      
      this.logger.log('✅ Restauración completada exitosamente');
    } catch (error) {
      this.logger.error(`Error en restauración: ${error.message}`);
      throw error;
    }
  }

  // Método para obtener información de backups
  async getBackupInfo(): Promise<any> {
    const info = {
      daily: await this.getBackupTypeInfo('daily'),
      weekly: await this.getBackupTypeInfo('weekly'),
      monthly: await this.getBackupTypeInfo('monthly'),
      manual: await this.getBackupTypeInfo('manual')
    };

    return info;
  }

  private async getBackupTypeInfo(type: string): Promise<any> {
    const backupTypeDir = path.join(this.backupPath, type);
    
    if (!await fs.pathExists(backupTypeDir)) {
      return { count: 0, backups: [] };
    }

    const backups = await fs.readdir(backupTypeDir);
    const validBackups = backups.filter(backup => 
      backup.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)
    );

    const backupDetails: any[] = [];
    for (const backup of validBackups) {
      const backupPath = path.join(backupTypeDir, backup);
      const stat = await fs.stat(backupPath);
      
      backupDetails.push({
        name: backup,
        path: backupPath,
        size: stat.size,
        created: stat.birthtime,
        isCompressed: path.extname(backup) === '.zip'
      });
    }

    return {
      count: validBackups.length,
      backups: backupDetails.sort((a: any, b: any) => b.created.getTime() - a.created.getTime())
    };
  }
} 