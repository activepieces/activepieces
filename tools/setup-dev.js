#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check Node.js version
const nodeVersion = execSync('node --version').toString().trim();
const requiredVersions = ['v22.15+', 'v24'];

// Check operating system
const os = process.platform;
console.log(`Running on ${os} operating system.`)

const [major, minor = 0] = nodeVersion.replace(/^v/, '').split('.').map(Number);
const isCompatibleNodeVersion = requiredVersions.some((version) => {
  const [requiredMajor, requiredMinor = 0] = version.match(/\d+/g).map(Number);
  return major === requiredMajor && (minor >= requiredMinor);
});

if (isCompatibleNodeVersion) {
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

// The engine spawns AP_DENO_PATH directly with a minimal env, so it must be the
// real deno binary — an npm .bin shim (#!/usr/bin/env node) dies with
// "env: node: No such file or directory" (exit 127). The global npm `deno`
// package downloads the real binary into <npm root -g>/deno on install.
const isNodeShimScript = (candidatePath) => {
  try {
    const header = Buffer.alloc(32);
    const fd = fs.openSync(candidatePath, 'r');
    fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);
    return header.toString('utf-8').startsWith('#!/usr/bin/env node');
  } catch {
    return true;
  }
};

const denoBinaryName = os === 'win32' ? 'deno.exe' : 'deno';

const resolveDenoPath = () => {
  const found = execSync(os === 'win32' ? 'where deno' : 'command -v deno').toString().trim().split('\n')[0];
  if (!isNodeShimScript(found)) {
    return found;
  }
  const globalNpmBinary = path.join(execSync('npm root -g').toString().trim(), 'deno', denoBinaryName);
  if (fs.existsSync(globalNpmBinary) && !isNodeShimScript(globalNpmBinary)) {
    return globalNpmBinary;
  }
  throw new Error(`deno on PATH (${found}) is an npm shim script and no real global binary was found`);
};

let denoPath;
try {
  denoPath = resolveDenoPath();
  console.log(`✅ Deno is already installed at ${denoPath}.`);
} catch {
  console.log("⚙️ Deno not found. Installing globally...");
  try {
    execSync("npm install -g deno", { stdio: "inherit" });
    denoPath = resolveDenoPath();
    console.log(`✅ Deno installed successfully at ${denoPath}.`);
  } catch (err) {
    console.error("❌ Failed to install Deno:", err.message);
    process.exit(1);
  }
}

const envDevPath = path.resolve('.env.dev');
let envDev = fs.existsSync(envDevPath) ? fs.readFileSync(envDevPath, 'utf-8') : '';
const originalEnvDev = envDev;

const existingDenoLine = envDev.match(/^AP_DENO_PATH=(.*)$/m);
const existingDenoPath = existingDenoLine ? existingDenoLine[1].trim() : null;
const isRepoLocalPath = existingDenoPath !== null && existingDenoPath.startsWith(path.resolve('.'));
if (!existingDenoLine) {
  envDev += `${envDev.endsWith('\n') || envDev === '' ? '' : '\n'}AP_DENO_PATH=${denoPath}\n`;
} else if (isNodeShimScript(existingDenoPath) || isRepoLocalPath) {
  envDev = envDev.replace(existingDenoLine[0], `AP_DENO_PATH=${denoPath}`);
  console.log(`⚙️ Updated AP_DENO_PATH to the global deno binary at ${denoPath}.`);
}

if (envDev !== originalEnvDev) {
  fs.writeFileSync(envDevPath, envDev);
  console.log('✅ Updated .env.dev with AP_DENO_PATH.');
}

execSync('bun install', { stdio: 'inherit' });

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'framework', 'common']);

const findAllPieceFolders = (folderPath) => {
  const results = [];
  for (const entry of fs.readdirSync(folderPath)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = path.join(folderPath, entry);
    if (!fs.statSync(full).isDirectory()) continue;
    if (fs.existsSync(path.join(full, 'package.json'))) {
      results.push(full);
    } else {
      results.push(...findAllPieceFolders(full));
    }
  }
  return results;
};

// Pre-build dev pieces so dist/ exists before the server starts
const dotenv = require('dotenv');
let envConfig = {};
try {
  envConfig = dotenv.parse(fs.readFileSync('.env.dev', 'utf-8'));
} catch { }

const devPieces = process.env.AP_DEV_PIECES || envConfig.AP_DEV_PIECES;

if (devPieces) {
  const pieceNames = [...new Set(devPieces.split(',').map(n => n.trim()))];
  const allFolders = findAllPieceFolders(path.resolve('packages', 'pieces'));

  const pieceFilters = pieceNames.map(name => {
    const dir = allFolders.find(p => p.endsWith(path.sep + name));
    if (!dir) {
      throw new Error(`❌ Piece folder not found for: "${name}".`);
    }
    const packageName = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')).name;
    return `--filter=${packageName}`;
  }).join(' ');

  console.log(`Building dev pieces: ${devPieces}`);
  execSync(`npx turbo run build ${pieceFilters}`, { stdio: 'inherit' });
}
