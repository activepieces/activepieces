// test-run.js
const { spawn } = require('child_process');
const path = require('path');

const tsxBin = path.join(__dirname, 'node_modules', '.bin', 'tsx');
const testFile = path.join(__dirname, 'test-ts-esm.ts');

console.log('TSX Path:', tsxBin);
console.log('Test File:', testFile);

const child = spawn('node', [tsxBin, testFile], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('exit', (code) => {
  console.log('Exit code:', code);
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});
