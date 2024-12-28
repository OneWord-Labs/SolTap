import { execSync } from 'child_process';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deploy() {
  try {
    console.log('🚀 Starting deployment process...');

    // Check if git is initialized
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch {
      console.log('📦 Initializing Git repository...');
      execSync('git init');
    }

    // Get commit message
    const commitMessage = await question('Enter commit message: ');
    if (!commitMessage) {
      console.error('❌ Commit message is required');
      process.exit(1);
    }

    // Git operations
    console.log('📝 Committing changes...');
    execSync('git add .');
    execSync(`git commit -m "${commitMessage}"`);

    // Check if remote exists
    try {
      execSync('git remote get-url origin', { stdio: 'ignore' });
    } catch {
      console.log('🔗 Setting up GitHub repository...');
      execSync('npm run git:setup');
    }

    // Push to GitHub
    console.log('⬆️ Pushing to GitHub...');
    execSync('git push -u origin main');

    // Deploy to Vercel
    const deployToProd = await question('Deploy to production? (y/N): ');
    if (deployToProd.toLowerCase() === 'y') {
      console.log('🚀 Deploying to production...');
      execSync('npm run deploy:prod', { stdio: 'inherit' });
    } else {
      console.log('🔨 Deploying to preview...');
      execSync('npm run deploy', { stdio: 'inherit' });
    }

    console.log('✅ Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

deploy(); 