const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

async function testBackupSystem() {
  console.log('🧪 Iniciando test del sistema de backups...\n');

  const tests = [
    { name: 'Verificar dependencias', test: testDependencies },
    { name: 'Verificar configuración', test: testConfiguration },
    { name: 'Verificar directorios', test: testDirectories },
    { name: 'Verificar MongoDB Tools', test: testMongoTools },
    { name: 'Test backup manual', test: testManualBackup },
    { name: 'Test listado de backups', test: testBackupListing },
    { name: 'Test limpieza (modo dry-run)', test: testCleanupDryRun },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      await test.test();
      console.log(`✅ ${test.name} - PASSED\n`);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Resultados del test:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron! El sistema de backups está listo para usar.');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Revisa los errores arriba.');
    process.exit(1);
  }
}

async function testDependencies() {
  const packageJson = await fs.readJson('./package.json');
  
  const requiredDeps = [
    '@nestjs/schedule',
    'fs-extra',
    'archiver',
    'unzipper'
  ];

  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  for (const dep of requiredDeps) {
    if (!allDeps[dep]) {
      throw new Error(`Dependencia faltante: ${dep}`);
    }
  }

  console.log('   📦 Todas las dependencias están instaladas');
}

async function testConfiguration() {
  const requiredVars = [
    'MONGODB_URI'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
  }

  const backupPath = process.env.BACKUP_PATH || './backups';
  console.log(`   🔧 Configuración OK - Backup path: ${backupPath}`);
}

async function testDirectories() {
  const backupPath = process.env.BACKUP_PATH || './backups';
  const requiredDirs = ['daily', 'weekly', 'monthly', 'manual'];

  for (const dir of requiredDirs) {
    const dirPath = path.join(backupPath, dir);
    await fs.ensureDir(dirPath);
  }

  console.log(`   📁 Todos los directorios están creados en ${backupPath}`);
}

async function testMongoTools() {
  try {
    const version = execSync('mongodump --version', { encoding: 'utf8' });
    console.log(`   🔧 MongoDB Tools disponible: ${version.split('\n')[0]}`);
  } catch (error) {
    throw new Error('mongodump no está disponible. Instala MongoDB Database Tools.');
  }
}

async function testManualBackup() {
  console.log('   📦 Creando backup de prueba...');
  
  try {
    // Ejecutar script de backup
    execSync('node scripts/backup/backup-database.js', { 
      encoding: 'utf8',
      timeout: 60000 // 1 minuto timeout
    });
    
    // Verificar que se creó el backup
    const backupPath = process.env.BACKUP_PATH || './backups';
    const manualDir = path.join(backupPath, 'manual');
    const backups = await fs.readdir(manualDir);
    const latestBackup = backups
      .filter(b => b.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/))
      .sort()
      .pop();

    if (!latestBackup) {
      throw new Error('No se encontró backup creado');
    }

    console.log(`   ✅ Backup creado: ${latestBackup}`);
  } catch (error) {
    throw new Error(`Error creando backup: ${error.message}`);
  }
}

async function testBackupListing() {
  try {
    const output = execSync('node scripts/backup/restore-database.js --list', { 
      encoding: 'utf8',
      timeout: 10000
    });
    
    if (!output.includes('Backups disponibles')) {
      throw new Error('El listado de backups no funciona correctamente');
    }
    
    console.log('   📋 Listado de backups funciona correctamente');
  } catch (error) {
    throw new Error(`Error en listado: ${error.message}`);
  }
}

async function testCleanupDryRun() {
  try {
    const output = execSync('node scripts/backup/cleanup-backups.js --status', { 
      encoding: 'utf8',
      timeout: 10000
    });
    
    if (!output.includes('Estado actual de backups')) {
      throw new Error('El comando de status no funciona correctamente');
    }
    
    console.log('   🧹 Script de limpieza funciona correctamente');
  } catch (error) {
    throw new Error(`Error en cleanup: ${error.message}`);
  }
}

async function showSystemInfo() {
  console.log('📋 Información del sistema de backups:\n');
  
  const backupPath = process.env.BACKUP_PATH || './backups';
  const compression = process.env.BACKUP_COMPRESSION === 'true';
  
  console.log(`🔧 Configuración actual:`);
  console.log(`   • Ruta de backups: ${backupPath}`);
  console.log(`   • Compresión: ${compression ? 'Habilitada' : 'Deshabilitada'}`);
  console.log(`   • MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/green-cycle'}`);
  
  console.log(`\n📅 Políticas de retención:`);
  console.log(`   • Diarios: ${process.env.DAILY_RETENTION_DAYS || 7} días`);
  console.log(`   • Semanales: ${process.env.WEEKLY_RETENTION_WEEKS || 4} semanas`);
  console.log(`   • Mensuales: ${process.env.MONTHLY_RETENTION_MONTHS || 12} meses`);
  console.log(`   • Manuales: ${process.env.MANUAL_RETENTION_DAYS || 30} días`);
  
  console.log(`\n📝 Scripts disponibles:`);
  console.log(`   • npm run backup:create    - Crear backup manual`);
  console.log(`   • npm run backup:list      - Listar backups disponibles`);
  console.log(`   • npm run backup:restore   - Restaurar backup`);
  console.log(`   • npm run backup:cleanup   - Limpiar backups antiguos`);
  console.log(`   • npm run backup:status    - Ver estado del sistema`);
  console.log(`   • npm run backup:test      - Crear backup de prueba`);
  
  console.log(`\n🌐 API Endpoints (requieren autenticación):`);
  console.log(`   • POST /backup/create      - Crear backup manual`);
  console.log(`   • GET  /backup/info        - Información de backups`);
  console.log(`   • POST /backup/restore     - Restaurar backup`);
  console.log(`   • POST /backup/daily       - Ejecutar backup diario`);
  console.log(`   • POST /backup/weekly      - Ejecutar backup semanal`);
  console.log(`   • POST /backup/monthly     - Ejecutar backup mensual`);
  
  console.log('\n');
}

// Manejo de argumentos
const args = process.argv.slice(2);

if (require.main === module) {
  if (args.includes('--info') || args.includes('-i')) {
    showSystemInfo().catch(console.error);
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🧪 Test del sistema de backups\n');
    console.log('Uso:');
    console.log('  node test-backup-system.js        # Ejecutar todos los tests');
    console.log('  node test-backup-system.js --info # Mostrar información del sistema');
    console.log('  node test-backup-system.js --help # Mostrar esta ayuda');
  } else {
    testBackupSystem().catch(console.error);
  }
}

module.exports = { testBackupSystem, showSystemInfo }; 