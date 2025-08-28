// test-js.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Hello from Node.js!');
console.log('Node version:', process.version);
console.log('Platform:', process.platform, process.arch);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
