// test-ts-esm.ts
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('TypeScript ESM test running!');
console.log('Node version:', process.version);
console.log('Platform:', process.platform, process.arch);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
