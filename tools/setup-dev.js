#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

  // Modify packages/backend/.env key AP_NODE_EXECUTABLE_PATH with absolute path to node executable
  const os = require('os');
  const fs = require('fs');

  try {
    let nodeExecutablePath;
    if (os.platform() === 'win32') {
      nodeExecutablePath = execSync('where node').toString().trim();
    } else {
      nodeExecutablePath = execSync('which node').toString().trim();
    }
    const absoluteNodeExecutablePath = path.resolve(nodeExecutablePath);
    console.info(`Found path to node executable: ${absoluteNodeExecutablePath}`);

    const envFilePath = path.join('.', 'packages', 'backend', '.env');
    const envFileContent = fs.readFileSync(envFilePath, 'utf8');
    const updatedEnvFileContent = envFileContent.replace(/AP_NODE_EXECUTABLE_PATH=.*/, `AP_NODE_EXECUTABLE_PATH=${absoluteNodeExecutablePath}`);
    fs.writeFileSync(envFilePath, updatedEnvFileContent);
  } catch (error) {
    console.error(error);
    console.error('Error: Could not find path to node executable. ',);
    process.exit(1);
  }

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersion = 'v18';

if (nodeVersion.startsWith(requiredVersion)) {
  console.log('Node.js version is compatible (> 18.0).');
} else {
  console.log(`Node.js version is not compatible. Required version: ${requiredVersion}`);
  process.exit(1);
}

// Proceed with your commands
execSync('rm -rf node_modules');
execSync('npm ci');
execSync('npx pnpm store add \
  @tsconfig/node18@1.0.1 \
  ts-loader@9.4.2 \
  typescript@4.8.4 \
  webpack@5.74.0 \
  webpack-cli@4.10.0');



