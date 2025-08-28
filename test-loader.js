// test-loader.js
const { spawn } = require('child_process');

console.log('Testing Node.js ESM loader...');
console.log('Node version:', process.version);

const testTsPath = __dirname + '/test-ts.ts';

console.log('Running:', `node --loader ts-node/esm ${testTsPath}`);

const child = spawn('node', [
  '--loader', 'ts-node/esm',
  testTsPath
], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-warnings',
    TS_NODE_PROJECT: __dirname + '/tsconfig.json'
  }
});

child.on('exit', (code) => {
  console.log('Test completed with code:', code);});

child.on('error', (err) => {
  console.error('Error:', err);
});
