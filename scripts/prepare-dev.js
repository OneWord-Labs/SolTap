import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

function checkNgrok() {
  try {
    execSync('ngrok --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ ngrok is not installed. Please install it first:');
    console.log('npm install -g ngrok');
    return false;
  }
}

function updateEnvFile(ngrokUrl) {
  const envPath = path.join(rootDir, '.env');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  // Update NGROK_URL if provided
  if (ngrokUrl) {
    envContent = envContent.replace(
      /NGROK_URL=.*/,
      `NGROK_URL=${ngrokUrl}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated NGROK_URL in .env file');
  }
}

function startDevelopment() {
  console.log('🚀 Starting development environment...');

  if (!checkNgrok()) {
    process.exit(1);
  }

  // Start ngrok in the background
  const ngrok = execSync('npm run dev:ngrok', { stdio: 'pipe' });
  
  // Wait for ngrok to start and get the URL
  setTimeout(() => {
    try {
      const ngrokLog = fs.readFileSync('ngrok.log', 'utf8');
      const urlMatch = ngrokLog.match(/url=https:\/\/[^\\s]+/);
      if (urlMatch) {
        const ngrokUrl = urlMatch[0].split('=')[1];
        updateEnvFile(ngrokUrl);
        console.log(`✅ ngrok tunnel established at ${ngrokUrl}`);
      }
    } catch (error) {
      console.error('❌ Failed to get ngrok URL:', error);
    }
  }, 2000);

  console.log('✨ Development environment is ready!');
  console.log('📝 Run the following commands in separate terminals:');
  console.log('npm run dev:frontend');
  console.log('npm run dev:server');
}

startDevelopment(); 