import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const requiredFiles = [
  'dist/server/index.js',
  'dist/server/services/telegram/telegram.service.js',
  'dist/index.html',
];

const errors = [];

console.log('Verifying build output...');

// Check for required files
requiredFiles.forEach(file => {
  const fullPath = join(rootDir, file);
  if (!existsSync(fullPath)) {
    errors.push(`Missing required file: ${file}`);
  } else {
    console.log(`✓ Found ${file}`);
  }
});

// Check package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
if (!packageJson.type === 'module') {
  errors.push('package.json must have "type": "module"');
}

// Check for ES modules syntax in server code
const serverIndex = readFileSync(join(rootDir, 'dist/server/index.js'), 'utf8');
if (!serverIndex.includes('export') && !serverIndex.includes('import')) {
  errors.push('Server code does not appear to use ES modules');
}

if (errors.length > 0) {
  console.error('\nBuild verification failed:');
  errors.forEach(error => console.error(`❌ ${error}`));
  process.exit(1);
} else {
  console.log('\n✓ Build verification passed');
} 