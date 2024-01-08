#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersions = ['v18','v20'];

// Check operating system
const os = process.platform;
console.log(`Running on ${os} operating system.`)

if (requiredVersions.some(version=>nodeVersion.startsWith(version))) {
  console.log(`Node.js version is compatible ${nodeVersion}.`);
} else {
  console.log(`Node.js version is not compatible. Required version: ${requiredVersions.toString()}`);
  process.exit(1);
}

// Proceed with your commands
if (os === 'win32') {
  if (fs.existsSync('node_modules')) {
    execSync('rmdir node_modules /s /q');
  }
}
else {
  execSync('rm -rf node_modules');
}
execSync('npm ci');
execSync('npx pnpm store add \
  @tsconfig/node18@1.0.0 \
  @types/node@18.17.1 \
  typescript@4.8.4');
