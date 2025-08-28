// build-piece-bootstrap.cjs
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Enhanced logging
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',  // Cyan
    error: '\x1b[31m', // Red
    debug: '\x1b[35m', // Magenta
    success: '\x1b[32m' // Green
  };
  const color = colors[level] || '\x1b[0m';
  console.error(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}\x1b[0m`);
}

// Debug environment
log('Process Info:', 'debug');
log(`Node Version: ${process.version}`, 'debug');
log(`Platform: ${process.platform} ${process.arch}`, 'debug');
log(`Current Directory: ${process.cwd()}`, 'debug');
log(`__dirname: ${__dirname}`, 'debug');

// Verify paths
const cliPath = path.resolve(__dirname, 'packages/cli/src/index.ts');
const tsconfigPath = path.resolve(__dirname, 'packages/cli/tsconfig.json');
const nodeModulesPath = path.resolve(__dirname, 'node_modules/.bin/ts-node');

log(`CLI Path: ${cliPath}`, 'debug');
log(`TSConfig Path: ${tsconfigPath}`, 'debug');
log(`Node Modules Path: ${nodeModulesPath}`, 'debug');

// Check if files exist
if (!fs.existsSync(cliPath)) {
  log(`Error: CLI file not found at ${cliPath}`, 'error');
  process.exit(1);
}

if (!fs.existsSync(tsconfigPath)) {
  log(`Error: tsconfig.json not found at ${tsconfigPath}`, 'error');
  process.exit(1);
}

// Check if ts-node exists in node_modules
if (!fs.existsSync(nodeModulesPath)) {
  log(`Error: ts-node not found in node_modules at ${nodeModulesPath}`, 'error');
  log('Please run: pnpm install', 'info');
  process.exit(1);
}

// Get the command and any additional arguments
const args = process.argv.slice(2);
log(`Running with arguments: ${args.join(' ')}`, 'debug');

// Prepare environment variables
const env = {
  ...process.env,
  NODE_OPTIONS: '--no-warnings --enable-source-maps',
  DEBUG: 'ts-node*',
  TS_NODE_DEBUG: 'true',
  TS_NODE_DEBUG_BRK: 'false',
  TS_NODE_PROJECT: tsconfigPath,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

log('Environment Variables:', 'debug');
Object.entries(env).forEach(([key, value]) => {
  log(`  ${key}=${value}`, 'debug');
});

// Use the local ts-node from node_modules
const command = process.platform === 'win32' ? 'node' : 'node';
const commandArgs = [
  nodeModulesPath,
  '--esm',
  '--project', tsconfigPath,
  '--show-config',
  cliPath,
  ...args
];

log(`Executing: ${command} ${commandArgs.join(' ')}`, 'info');

// Log the full command for debugging
const fullCommand = `"${command}" ${commandArgs.map(arg => `"${arg}"`).join(' ')}`;
log(`Full command: ${fullCommand}`, 'debug');

const child = spawn(command, commandArgs, { 
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env,
  windowsHide: true
});

child.on('error', (error) => {
  log(`Failed to start process: ${error.message}`, 'error');
  log(`Error stack: ${error.stack}`, 'error');
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== 0) {
    log(`Process exited with code ${code} and signal ${signal}`, 'error');
  } else {
    log('Process completed successfully', 'success');
  }
  process.exit(code || 0);
});

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT. Terminating...', 'info');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  log('Received SIGTERM. Terminating...', 'info');
  child.kill('SIGTERM');
});
