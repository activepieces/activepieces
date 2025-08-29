// test-ts-node.js
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing ts-node execution...');

const testScript = `
  console.log('TypeScript execution test:');
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform, process.arch);
  console.log('Current directory:', process.cwd());
  console.log('__dirname:', __dirname);
`;

const tempFile = path.join(__dirname, 'temp-test.ts');
require('fs').writeFileSync(tempFile, testScript);

console.log('Created test file at:', tempFile);

const child = spawn('npx', [
  'ts-node',
  '--esm',
  '--project',
  path.join(__dirname, 'packages', 'cli', 'tsconfig.ts-node.json'),
  tempFile
], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-warnings --enable-source-maps',
    DEBUG: 'ts-node*',
    TS_NODE_DEBUG: 'true'
  }
});

child.on('exit', (code) => {
  // Clean up
  try {
    require('fs').unlinkSync(tempFile);
  } catch (e) {}
  
  console.log(`Test completed with code ${code}`);
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Error executing test:', err);
  process.exit(1);
});
