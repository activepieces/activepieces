/**
 * Creates symlinks in node_modules for workspace packages and hoists
 * transitive dependencies from bun's internal cache (.bun/) into
 * standard node_modules/ locations.
 *
 * Bun's default linker stores transitive dependencies in .bun/ which
 * is only accessible via bun's runtime. Node.js (used by vitest)
 * cannot resolve packages from .bun/. This script creates symlinks
 * to make all packages accessible via standard Node.js resolution.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const bunCacheDir = path.join(nodeModulesDir, '.bun');

const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const workspacePatterns = rootPkg.workspaces || [];

function resolveWorkspaces(patterns) {
  const results = [];
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const baseDir = path.join(rootDir, pattern.replace('/*', ''));
      if (!fs.existsSync(baseDir)) continue;
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pkgPath = path.join(baseDir, entry.name, 'package.json');
          if (fs.existsSync(pkgPath)) {
            results.push({ dir: path.join(baseDir, entry.name), pkgPath });
          }
        }
      }
    } else {
      const dir = path.join(rootDir, pattern);
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        results.push({ dir, pkgPath });
      }
    }
  }
  return results;
}

function targetExists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function createSymlink(targetDir, sourceDir) {
  if (targetExists(targetDir)) {
    try {
      const stat = fs.lstatSync(targetDir);
      if (stat.isSymbolicLink()) {
        const existing = fs.readlinkSync(targetDir);
        if (path.resolve(path.dirname(targetDir), existing) === sourceDir) {
          return false; // Already correctly linked
        }
        fs.unlinkSync(targetDir); // Remove incorrect symlink
      } else {
        return false; // Real directory/file, don't touch
      }
    } catch {
      return false;
    }
  }
  fs.symlinkSync(sourceDir, targetDir, 'dir');
  return true;
}

// Step 1: Link workspace packages
const workspaces = resolveWorkspaces(workspacePatterns);
let workspaceLinked = 0;

for (const { dir, pkgPath } of workspaces) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const name = pkg.name;
  if (!name) continue;

  const parts = name.split('/');
  let targetDir;
  if (parts.length === 2) {
    const scopeDir = path.join(nodeModulesDir, parts[0]);
    fs.mkdirSync(scopeDir, { recursive: true });
    targetDir = path.join(scopeDir, parts[1]);
  } else {
    targetDir = path.join(nodeModulesDir, name);
  }

  if (createSymlink(targetDir, dir)) {
    workspaceLinked++;
  }
}

// Step 2: Hoist transitive dependencies from .bun/ cache
// Bun stores packages in .bun/<name>@<version>+<hash>/node_modules/<name>/
// We create symlinks in root node_modules/ for packages not already present
let hoisted = 0;

if (fs.existsSync(bunCacheDir)) {
  const entries = fs.readdirSync(bunCacheDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Parse package name from directory like "axios@1.13.5" or "@scope+name@1.0.0+hash"
    const dirName = entry.name;
    let pkgName;

    if (dirName.startsWith('@')) {
      // Scoped package: @scope+name@version+hash
      const scopeAndRest = dirName.split('+');
      if (scopeAndRest.length < 2) continue;
      const scope = scopeAndRest[0]; // @scope
      const nameAndVersion = scopeAndRest.slice(1).join('+');
      const atIndex = nameAndVersion.indexOf('@');
      if (atIndex === -1) continue;
      const name = nameAndVersion.substring(0, atIndex);
      pkgName = `${scope}/${name}`;
    } else {
      // Unscoped package: name@version or name@version+hash
      const atIndex = dirName.indexOf('@');
      if (atIndex === -1) continue;
      pkgName = dirName.substring(0, atIndex);
    }

    if (!pkgName) continue;

    // Find the actual package directory inside the bun cache entry
    const parts = pkgName.split('/');
    let sourcePath;
    if (parts.length === 2) {
      sourcePath = path.join(bunCacheDir, dirName, 'node_modules', parts[0], parts[1]);
    } else {
      sourcePath = path.join(bunCacheDir, dirName, 'node_modules', pkgName);
    }

    if (!fs.existsSync(sourcePath)) continue;

    // Create symlink in root node_modules
    let targetDir;
    if (parts.length === 2) {
      const scopeDir = path.join(nodeModulesDir, parts[0]);
      fs.mkdirSync(scopeDir, { recursive: true });
      targetDir = path.join(scopeDir, parts[1]);
    } else {
      targetDir = path.join(nodeModulesDir, pkgName);
    }

    // Only hoist if not already present (don't overwrite bun's directly installed packages)
    if (!targetExists(targetDir) && createSymlink(targetDir, sourcePath)) {
      hoisted++;
    }
  }
}

if (workspaceLinked > 0 || hoisted > 0) {
  console.log(`Linked ${workspaceLinked} workspace packages, hoisted ${hoisted} transitive dependencies`);
}
