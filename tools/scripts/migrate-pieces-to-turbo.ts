import * as fs from 'fs';
import * as path from 'path';

const PIECES_DIR = path.resolve(__dirname, '../../packages/pieces/community');

const dirs = fs.readdirSync(PIECES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let updated = 0;
let tsconfigUpdated = 0;
let projectJsonDeleted = 0;

for (const name of dirs) {
  const pieceDir = path.join(PIECES_DIR, name);

  // Skip framework and common - already handled manually
  if (name === 'framework' || name === 'common') {
    continue;
  }

  // 1. Update package.json - add build/lint scripts
  const pkgPath = path.join(pieceDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (!pkg.scripts) {
      pkg.scripts = {};
    }
    pkg.scripts.build = 'tsc -p tsconfig.lib.json';
    pkg.scripts.lint = "eslint 'src/**/*.ts'";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    updated++;
  }

  // 2. Update tsconfig.lib.json outDir
  const tsconfigPath = path.join(pieceDir, 'tsconfig.lib.json');
  if (fs.existsSync(tsconfigPath)) {
    let content = fs.readFileSync(tsconfigPath, 'utf-8');
    const oldOutDir = '../../../../dist/out-tsc';
    const newOutDir = `../../../../dist/packages/pieces/community/${name}`;
    if (content.includes(oldOutDir)) {
      content = content.replace(oldOutDir, newOutDir);
      fs.writeFileSync(tsconfigPath, content);
      tsconfigUpdated++;
    }
  }

  // 3. Delete project.json
  const projectJsonPath = path.join(pieceDir, 'project.json');
  if (fs.existsSync(projectJsonPath)) {
    fs.unlinkSync(projectJsonPath);
    projectJsonDeleted++;
  }
}

console.log(`Updated ${updated} package.json files`);
console.log(`Updated ${tsconfigUpdated} tsconfig.lib.json files`);
console.log(`Deleted ${projectJsonDeleted} project.json files`);
