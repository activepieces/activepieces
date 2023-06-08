#!/usr/bin/env node

const { execSync } = require('child_process');

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersion = 'v18';

if (nodeVersion.startsWith(requiredVersion)) {
  console.log('Node.js version is compatible (18.0).');
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



