// test-env.js
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing environment...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform, process.arch);
console.log('Current directory:', process.cwd());

const testTsPath = path.join(__dirname, 'test-ts.ts');
const tsNodePath = path.join(__dirname, 'node_modules', '.bin', 'ts-node');

console.log('\nChecking ts-node at:', tsNodePath);

const child = spawn('node', [tsNodePath, testTsPath], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('exit', (code) => {
  console.log('\nTest completed with code:', code);
});

child.on('error', (err) => {
  console.error('Error:', err);
});
