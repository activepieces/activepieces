#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersions = ['v18','v20','v22'];

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


try {
  // Try to get bun version to check if installed
  execSync("bun --version", { stdio: "ignore" });
  console.log("✅ Bun is already installed.");
} catch {
  console.log("⚙️ Bun not found. Installing globally...");
  try {
    execSync("npm install -g bun", { stdio: "inherit" });
    console.log("✅ Bun installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install Bun:", err.message);
    process.exit(1);
  }
}

execSync('bun install', { stdio: 'inherit' });

execSync('npx pnpm store add \
  @tsconfig/node18@1.0.0 \
  @types/node@18.17.1 \
  typescript@4.8.4', { stdio: 'inherit' });
