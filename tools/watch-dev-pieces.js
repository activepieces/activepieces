#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const chokidar = require('chokidar');

const devPieces = process.argv[2];
if (!devPieces) {
  process.exit(0);
}

const pieceNames = [...new Set(devPieces.split(',').map(n => n.trim()))];
const watchPaths = pieceNames.flatMap(name => [
  path.resolve(`packages/pieces/community/${name}/src`),
  path.resolve(`packages/pieces/community/${name}/package.json`),
]);

const pieceSegments = pieceNames.map(name => ({
  segment: path.join('community', name) + path.sep,
  name,
}));

const rebuilding = new Set();
const debounceTimers = new Map();
const pendingRebuild = new Set();

function buildPiece(pieceName) {
  rebuilding.add(pieceName);
  const filter = `--filter=@activepieces/piece-${pieceName}`;
  console.log(`\n[piece-watcher] Rebuilding ${pieceName}...`);
  const buildProcess = spawn('npx', ['turbo', 'run', 'build', filter], {
    stdio: 'inherit',
  });
  buildProcess.on('close', (code) => {
    rebuilding.delete(pieceName);
    if (code === 0) {
      console.log(`[piece-watcher] ${pieceName} rebuilt successfully.`);
    } else {
      console.error(`[piece-watcher] ${pieceName} build failed (exit code ${code}).`);
    }
    if (pendingRebuild.has(pieceName)) {
      pendingRebuild.delete(pieceName);
      buildPiece(pieceName);
    }
  });
}

const watcher = chokidar.watch(watchPaths, { ignoreInitial: true });
watcher.on('all', (_event, filePath) => {
  const match = pieceSegments.find(p => filePath.includes(p.segment));
  if (!match) return;

  const pieceName = match.name;
  clearTimeout(debounceTimers.get(pieceName));
  debounceTimers.set(pieceName, setTimeout(() => {
    debounceTimers.delete(pieceName);
    if (rebuilding.has(pieceName)) {
      pendingRebuild.add(pieceName);
      return;
    }
    buildPiece(pieceName);
  }, 300));
});

console.log(`[piece-watcher] Watching for changes in: ${pieceNames.join(', ')}`);
