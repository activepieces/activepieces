// run-cli.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the CLI entry point
const cliPath = path.resolve(__dirname, 'packages/cli/src/index.ts');
const tsConfigPath = path.resolve(__dirname, 'packages/cli/tsconfig.ts-node.json');

// Verify files exist
if (!fs.existsSync(cliPath)) {
  console.error(`Error: CLI file not found at ${cliPath}`);
  process.exit(1);
}

if (!fs.existsSync(tsConfigPath)) {
  console.error(`Error: tsconfig.json not found at ${tsConfigPath}`);
  process.exit(1);
}

// Get the command and any additional arguments
const args = process.argv.slice(2);

// Log the command being executed
console.log(`Running: ts-node --esm --project ${tsConfigPath} ${cliPath} ${args.join(' ')}`);

// Set up environment variables
const env = {
  ...process.env,
  NODE_OPTIONS: '--no-warnings --enable-source-maps',
  DEBUG: 'ts-node*',
  TS_NODE_DEBUG: 'true',
  TS_NODE_PROJECT: tsConfigPath,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Spawn the process
const child = spawn(
  'npx',
  [
    'ts-node',
    '--esm',
    '--project', tsConfigPath,
    '--show-config',
    cliPath,
    ...args
  ],
  {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
    env,
    windowsHide: true
  }
);

child.on('error', (error) => {
  console.error('Error:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code} and signal ${signal}`);
  }
  process.exit(code || 0);
});

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Terminating...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Terminating...');
  child.kill('SIGTERM');
});
