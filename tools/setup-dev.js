#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Check Node.js version
// Note: Node 18 and v20 are no longer supported. Node v22+ is required because
// zstdCompress/zstdDecompress from node:zlib are only available from Node v22.15.0+
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersions = ['v22', 'v24'];

// Check operating system
const os = process.platform;
console.log(`Running on ${os} operating system.`)

if (requiredVersions.some(version=>nodeVersion.startsWith(version))) {
  console.log(`Node.js version is compatible ${nodeVersion}.`);
} else {
  console.log(`Node.js version is not compatible. Required version: ${requiredVersions.toString()}. Node v18 and v20 are no longer supported due to missing zstd compression support in node:zlib (requires Node v22.15.0+).`);
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
execSync('bun install', { stdio: 'inherit' });
execSync('npx pnpm store add \
  @tsconfig/node18@1.0.0 \
  @types/node@18.17.1 \
  typescript@4.8.4', { stdio: 'inherit' });
