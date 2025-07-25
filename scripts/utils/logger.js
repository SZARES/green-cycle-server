const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor(name) {
    this.name = name;
    this.logFile = process.env.BACKUP_LOG_FILE || './backups/backup.log';
    this.ensureLogFile();
  }

  async ensureLogFile() {
    await fs.ensureDir(path.dirname(this.logFile));
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.name}] ${message}`;
  }

  async writeToFile(level, message) {
    try {
      const logMessage = this.formatMessage(level, message) + '\n';
      await fs.appendFile(this.logFile, logMessage);
    } catch (error) {
      console.error('Error escribiendo al log:', error.message);
    }
  }

  log(message) {
    const formatted = this.formatMessage('INFO', message);
    console.log(formatted);
    this.writeToFile('INFO', message);
  }

  error(message, error = null) {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    const formatted = this.formatMessage('ERROR', errorMessage);
    console.error(formatted);
    this.writeToFile('ERROR', errorMessage);
  }

  warn(message) {
    const formatted = this.formatMessage('WARN', message);
    console.warn(formatted);
    this.writeToFile('WARN', message);
  }

  success(message) {
    const formatted = this.formatMessage('SUCCESS', message);
    console.log(`✅ ${formatted}`);
    this.writeToFile('SUCCESS', message);
  }

  async rotateLogs() {
    try {
      const stats = await fs.stat(this.logFile);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        const rotatedFile = `${this.logFile}.${Date.now()}`;
        await fs.move(this.logFile, rotatedFile);
        this.log('Log rotado por tamaño máximo');
      }
    } catch (error) {
      // Archivo no existe, no hay problema
    }
  }
}

module.exports = Logger; 