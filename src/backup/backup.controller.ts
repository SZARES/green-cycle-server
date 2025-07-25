import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('backup')
@UseGuards(JwtAuthGuard) // Solo usuarios autenticados pueden acceder
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  async createManualBackup() {
    try {
      const backupPath = await this.backupService.createManualBackup();
      return {
        success: true,
        message: 'Backup manual creado exitosamente',
        backupPath: backupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error creando backup manual',
        error: error.message
      };
    }
  }

  @Post('restore')
  async restoreBackup(@Body() body: { backupPath: string }) {
    try {
      await this.backupService.restoreBackup(body.backupPath);
      return {
        success: true,
        message: 'Backup restaurado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error restaurando backup',
        error: error.message
      };
    }
  }

  @Get('info')
  async getBackupInfo() {
    try {
      const info = await this.backupService.getBackupInfo();
      return {
        success: true,
        data: info
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error obteniendo información de backups',
        error: error.message
      };
    }
  }

  @Post('daily')
  async triggerDailyBackup() {
    try {
      await this.backupService.createDailyBackup();
      return {
        success: true,
        message: 'Backup diario ejecutado manualmente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en backup diario',
        error: error.message
      };
    }
  }

  @Post('weekly')
  async triggerWeeklyBackup() {
    try {
      await this.backupService.createWeeklyBackup();
      return {
        success: true,
        message: 'Backup semanal ejecutado manualmente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en backup semanal',
        error: error.message
      };
    }
  }

  @Post('monthly')
  async triggerMonthlyBackup() {
    try {
      await this.backupService.createMonthlyBackup();
      return {
        success: true,
        message: 'Backup mensual ejecutado manualmente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en backup mensual',
        error: error.message
      };
    }
  }
} 