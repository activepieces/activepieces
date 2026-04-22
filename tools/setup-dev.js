#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersions = ['v18','v22','v24'];

// Check operating system
const os = process.platform;
console.log(`Running on ${os} operating system.`)

if (requiredVersions.some(version=>nodeVersion.startsWith(version))) {
  console.log(`Node.js version is compatible ${nodeVersion}.`);
} else {
  console.log(`Node.js version is not compatible. Required version: ${requiredVersions.toString()}`);
  process.exit(1);
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

if (!fs.existsSync('node_modules')) {
  console.log("⚙️ Installing packages...");
  execSync('bun install', { stdio: 'inherit' });
} else {
  console.log("✅ Packages already installed. Skipping bun install.");
}

// Pre-build dev pieces so dist/ exists before the server starts
const dotenv = require('dotenv');
let envConfig = {};
try {
  envConfig = dotenv.parse(fs.readFileSync('.env.dev', 'utf-8'));
} catch {}
const devPieces = process.env.AP_DEV_PIECES || envConfig.AP_DEV_PIECES;

/*
if (devPieces) {
  const pieceNames = [...new Set(devPieces.split(',').map(n => n.trim()))];
  const pieceFilters = pieceNames
    .map(name => `--filter=@activepieces/piece-${name}`)
    .join(' ');
  console.log(`Building dev pieces: ${devPieces}`);
  execSync(`npx turbo run build ${pieceFilters}`, { stdio: 'inherit' });
}
*/
console.log("✅ Build phase skipped (Building manually).");
