#!/usr/bin/env node

/**
 * Migration script for custom pieces from Nx to Turbo.
 *
 * This script migrates a custom piece (or all pieces in a directory) from the
 * old Nx-based build system to the new Turbo-based build system.
 *
 * Changes made:
 * 1. Updates package.json with build/lint scripts and workspace dependencies
 * 2. Updates tsconfig.lib.json with correct outDir and baseUrl/paths/rootDir
 * 3. Deletes project.json (Nx configuration)
 *
 * Usage:
 *   npx ts-node tools/scripts/migrate-custom-piece-to-turbo.ts [piece-path]
 *
 * If no path is provided, it scans packages/pieces/custom/ for all pieces.
 */

import * as fs from 'fs';
import * as path from 'path';

const CUSTOM_PIECES_DIR = path.resolve(__dirname, '../../packages/pieces/custom');

function getPieceCategory(pieceDir: string): string {
  if (pieceDir.includes('/pieces/community/')) return 'community';
  if (pieceDir.includes('/pieces/custom/')) return 'custom';
  return 'custom';
}

function getRelativeRoot(pieceDir: string): string {
  const piecesIndex = pieceDir.indexOf('/packages/pieces/');
  if (piecesIndex === -1) {
    throw new Error(`Unexpected piece directory structure: ${pieceDir}`);
  }
  const relative = path.relative(pieceDir, pieceDir.substring(0, piecesIndex));
  return relative;
}

function migratePiece(pieceDir: string): void {
  const pieceName = path.basename(pieceDir);
  const category = getPieceCategory(pieceDir);
  const relativeRoot = getRelativeRoot(pieceDir);

  console.log(`\nMigrating piece: ${pieceName} (${category})`);

  let changes = 0;

  // 1. Update package.json
  const pkgPath = path.join(pieceDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    let pkgChanged = false;

    // Ensure scripts exist
    if (!pkg.scripts) {
      pkg.scripts = {};
    }

    if (pkg.scripts.build !== 'tsc -p tsconfig.lib.json') {
      pkg.scripts.build = 'tsc -p tsconfig.lib.json';
      pkgChanged = true;
    }

    if (pkg.scripts.lint !== "eslint 'src/**/*.ts'") {
      pkg.scripts.lint = "eslint 'src/**/*.ts'";
      pkgChanged = true;
    }

    // Ensure workspace dependencies are present
    const requiredDeps: Record<string, string> = {
      '@activepieces/pieces-framework': 'workspace:*',
      '@activepieces/shared': 'workspace:*',
      'tslib': '2.6.2',
    };

    if (!pkg.dependencies) {
      pkg.dependencies = {};
    }

    for (const [dep, version] of Object.entries(requiredDeps)) {
      if (!pkg.dependencies[dep]) {
        pkg.dependencies[dep] = version;
        pkgChanged = true;
      }
    }

    if (pkgChanged) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`  ✓ Updated package.json`);
      changes++;
    } else {
      console.log(`  - package.json already up to date`);
    }
  } else {
    console.log(`  ✗ No package.json found — skipping`);
    return;
  }

  // 2. Update tsconfig.lib.json
  const tsconfigLibPath = path.join(pieceDir, 'tsconfig.lib.json');
  if (fs.existsSync(tsconfigLibPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigLibPath, 'utf-8'));
    let tsconfigChanged = false;

    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }

    // Update outDir from old Nx pattern to new Turbo pattern
    const expectedOutDir = `${relativeRoot}/dist/packages/pieces/${category}/${pieceName}`;
    if (tsconfig.compilerOptions.outDir !== expectedOutDir) {
      tsconfig.compilerOptions.outDir = expectedOutDir;
      tsconfigChanged = true;
    }

    // Ensure rootDir and baseUrl are set
    if (tsconfig.compilerOptions.rootDir !== '.') {
      tsconfig.compilerOptions.rootDir = '.';
      tsconfigChanged = true;
    }
    if (tsconfig.compilerOptions.baseUrl !== '.') {
      tsconfig.compilerOptions.baseUrl = '.';
      tsconfigChanged = true;
    }

    // Ensure paths is empty (no Nx path mappings)
    if (JSON.stringify(tsconfig.compilerOptions.paths) !== '{}') {
      tsconfig.compilerOptions.paths = {};
      tsconfigChanged = true;
    }

    // Ensure declaration is true
    if (tsconfig.compilerOptions.declaration !== true) {
      tsconfig.compilerOptions.declaration = true;
      tsconfigChanged = true;
    }

    // Ensure types includes node
    if (!tsconfig.compilerOptions.types || !tsconfig.compilerOptions.types.includes('node')) {
      tsconfig.compilerOptions.types = ['node'];
      tsconfigChanged = true;
    }

    if (tsconfigChanged) {
      fs.writeFileSync(tsconfigLibPath, JSON.stringify(tsconfig, null, 2) + '\n');
      console.log(`  ✓ Updated tsconfig.lib.json`);
      changes++;
    } else {
      console.log(`  - tsconfig.lib.json already up to date`);
    }
  } else {
    // Create tsconfig.lib.json if it doesn't exist
    const tsconfig = {
      extends: './tsconfig.json',
      compilerOptions: {
        module: 'commonjs',
        rootDir: '.',
        baseUrl: '.',
        paths: {},
        outDir: `${relativeRoot}/dist/packages/pieces/${category}/${pieceName}`,
        declaration: true,
        types: ['node'],
      },
      exclude: ['jest.config.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
      include: ['src/**/*.ts'],
    };
    fs.writeFileSync(tsconfigLibPath, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log(`  ✓ Created tsconfig.lib.json`);
    changes++;
  }

  // 3. Ensure tsconfig.json exists and extends root
  const tsconfigPath = path.join(pieceDir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    const tsconfig = {
      extends: `${relativeRoot}/tsconfig.base.json`,
      files: [],
      include: [],
      references: [{ path: './tsconfig.lib.json' }],
      compilerOptions: {
        forceConsistentCasingInFileNames: true,
        strict: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
      },
    };
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log(`  ✓ Created tsconfig.json`);
    changes++;
  }

  // 4. Delete project.json (Nx config)
  const projectJsonPath = path.join(pieceDir, 'project.json');
  if (fs.existsSync(projectJsonPath)) {
    fs.unlinkSync(projectJsonPath);
    console.log(`  ✓ Deleted project.json (Nx config)`);
    changes++;
  }

  // 5. Delete workspace.json if present
  const workspaceJsonPath = path.join(pieceDir, 'workspace.json');
  if (fs.existsSync(workspaceJsonPath)) {
    fs.unlinkSync(workspaceJsonPath);
    console.log(`  ✓ Deleted workspace.json`);
    changes++;
  }

  if (changes === 0) {
    console.log(`  Already migrated — no changes needed`);
  } else {
    console.log(`  Done — ${changes} change(s) applied`);
  }
}

function findPieceDirs(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  return fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .filter(d => d.name !== 'node_modules' && d.name !== '.turbo' && d.name !== 'dist')
    .map(d => path.join(baseDir, d.name))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')));
}

// Main
const args = process.argv.slice(2);

if (args.length > 0) {
  // Migrate a specific piece path
  const piecePath = path.resolve(args[0]);
  if (!fs.existsSync(piecePath)) {
    console.error(`Error: Path not found: ${piecePath}`);
    process.exit(1);
  }
  migratePiece(piecePath);
} else {
  // Migrate all custom pieces
  console.log(`Scanning ${CUSTOM_PIECES_DIR} for pieces...`);
  const pieceDirs = findPieceDirs(CUSTOM_PIECES_DIR);

  if (pieceDirs.length === 0) {
    console.log('No custom pieces found to migrate.');
    process.exit(0);
  }

  console.log(`Found ${pieceDirs.length} piece(s) to check.\n`);

  for (const dir of pieceDirs) {
    migratePiece(dir);
  }

  console.log('\nMigration complete.');
}
