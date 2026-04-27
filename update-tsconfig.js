const fs = require('fs');
const tsconfig = JSON.parse(fs.readFileSync('tsconfig.base.json', 'utf8'));
tsconfig.compilerOptions.paths['@activepieces/piece-mockify'] = ['packages/pieces/community/mockify/src/index.ts'];
tsconfig.compilerOptions.paths['@activepieces/piece-fakely'] = ['packages/pieces/community/fakely/src/index.ts'];
tsconfig.compilerOptions.paths['@activepieces/piece-captcha-solver'] = ['packages/pieces/community/captcha-solver/src/index.ts'];
fs.writeFileSync('tsconfig.base.json', JSON.stringify(tsconfig, null, 2));
console.log('Updated tsconfig.base.json');
