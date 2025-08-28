// run-cli.cjs - Windows/PNPM compatible TypeScript launcher for ESM projects
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Enable debug logging
const debug = process.env.DEBUG === 'true';

// Resolve paths
const projectRoot = __dirname;
const cliFile = path.resolve(projectRoot, 'packages/cli/src/index.ts');
const tsconfigFile = path.resolve(projectRoot, 'packages/cli/tsconfig.json');

// Use tsx for ESM TypeScript execution
const tsxBin = path.join(projectRoot, 'node_modules', '.bin', 'tsx');

// Debug paths
if (debug) {
  console.log('\n🔍 Debug Info:');
  console.log('Project Root:', projectRoot);
  console.log('CLI File:', cliFile);
  console.log('TSConfig File:', tsconfigFile);
  console.log('TSX Binary:', tsxBin);
  console.log('Node Version:', process.version);
  console.log('Platform:', process.platform, process.arch, '\n');
}

// Verify tsx is installed
if (!fs.existsSync(tsxBin)) {
  console.error('❌ tsx not found. Run: pnpm add -D tsx -w');
  console.error(`Looked for: ${tsxBin}`);
  process.exit(1);
}

if (!fs.existsSync(cliFile)) {
  console.error(`❌ CLI entry not found: ${cliFile}`);
  process.exit(1);
}

if (!fs.existsSync(tsconfigFile)) {
  console.error(`❌ tsconfig not found: ${tsconfigFile}`);
  process.exit(1);
}

// Prepare command
const args = process.argv.slice(2);
const cmdArgs = [
  '--tsconfig', tsconfigFile,
  cliFile,
  ...args
];

console.log(`🚀 Starting CLI with tsx: ${tsxBin}`);
if (debug) {
  console.log('Command Args:', JSON.stringify(cmdArgs, null, 2));
}

try {
  // Execute with tsx for ESM TypeScript support
  const child = spawn(
    `"${tsxBin}"`, // Quote for Windows paths with spaces
    cmdArgs,
    { 
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--no-warnings',
        TS_NODE_PROJECT: tsconfigFile,
        DEBUG: debug ? 'true' : undefined
      }
    }
  );

  child.on('exit', (code, signal) => {
    if (debug) {
      console.log(`\nℹ️  Process exited with code ${code} and signal ${signal}`);
    }
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error('❌ Failed to start tsx:', err);
    console.error('💡 Try these steps:');
    console.error('1. pnpm add -D tsx -w');
    console.error('2. Set DEBUG=true to see more details');
    process.exit(1);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Terminating...');
    child.kill('SIGINT');
  });
} catch (error) {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}
