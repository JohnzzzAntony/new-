const { spawn } = require('child_process');
const path = require('path');

function startServer() {
  console.log(`[${new Date().toISOString()}] Starting Next.js dev server...`);
  
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    detached: true,
    stdio: 'ignore'
  });
  
  child.unref();
  
  child.on('exit', (code) => {
    console.log(`[${new Date().toISOString()}] Server exited with code ${code}, restarting in 3s...`);
    setTimeout(startServer, 3000);
  });
}

startServer();
