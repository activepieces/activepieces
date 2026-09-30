import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { __unstable__loadDesignSystem } from '@tailwindcss/node';
import ts from 'typescript';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(WEB_ROOT, 'src');
const ENTRY_CSS = path.join(SRC, 'styles.css');
const require = createRequire(path.join(WEB_ROOT, 'package.json'));

const CLASS_FUNCTIONS = new Set(['cn', 'clsx', 'cva', 'cx', 'twMerge']);
const CLASS_NAME = /class(es|name)?$/i;

const ALLOWED = [
  /^(group|peer)(\/[\w-]+)?$/,
  /^(nodrag|nopan|nowheel)$/,
];

const BANNED = [
  /^text-xs$/,
  /^text-\[\d/,
  /^leading-\[/,
  /^tracking-\[/,
  /^uppercase$/,
  /^rounded(-sm|-xs)?$/,
  /^rounded(-[trblse]{1,2})?-\[/,
  /^font-(bold|extrabold|black)$/,
  /^-m[trblxyse]?-/,
];

const RUNTIME_VARIABLE_PREFIXES = ['--tw-', '--radix-', '--shiki-'];

const THIRD_PARTY_CSS = ['@xyflow/react/dist/style.css', 'react-data-grid/lib/styles.css'];

const files = process.argv.length > 2 ? process.argv.slice(2).map((file) => path.resolve(file)) : walk(SRC);
const design = await __unstable__loadDesignSystem(fs.readFileSync(ENTRY_CSS, 'utf8'), { base: SRC });
const stylesheetClasses = collectStylesheetClasses();

const usages = files.filter((file) => /\.(ts|tsx)$/.test(file)).flatMap(findClassUsages);
const candidates = [...new Set(usages.map((usage) => usage.className))];
const selectorClasses = new Set(candidates.flatMap((candidate) => [...candidate.matchAll(/\[[^\]]*?\.([A-Za-z_][\w-]*)/g)].map((match) => match[1])));
const generated = design.candidatesToCss(candidates);
const known = new Set(candidates.filter((candidate, index) => generated[index] !== null || isDefinedElsewhere(candidate)));
const unknownClasses = usages.filter((usage) => !known.has(usage.className));
const unknownVariables = findUnknownVariables();
const bannedClasses = usages.filter((usage) => isBanned(usage.className));

report({
  title: 'Unknown classes: Tailwind cannot generate them and no stylesheet defines them. See brain/knowledge/design-system/colour.md for colour names.',
  usages: unknownClasses,
});
report({ title: 'Unknown CSS variables: nothing defines them.', usages: unknownVariables });
report({
  title: 'Banned classes: see brain/knowledge/design-system/shape-and-size.md for the step to use instead.',
  usages: bannedClasses,
});

function report({ title, usages }) {
  if (usages.length === 0) return;
  console.error(`${title}\n`);
  for (const usage of usages) {
    console.error(`${path.relative(process.cwd(), usage.file)}:${usage.line}:${usage.column}  ${usage.className}`);
  }
  console.error(`\n${usages.length} usage(s).\n`);
  process.exitCode = 1;
}

function findUnknownVariables() {
  const sources = files.filter((file) => /\.(ts|tsx|css)$/.test(file));
  const definers = new Set([...walk(SRC), ...sources.filter((file) => !file.endsWith('.css'))]);
  const everything = [...definers].filter((file) => /\.(ts|tsx|css)$/.test(file));
  const defined = new Set([...design.theme.entries()].map(([name]) => name));
  for (const file of [...everything, ...THIRD_PARTY_CSS.map((sheet) => require.resolve(sheet))]) {
    const text = fs.readFileSync(file, 'utf8');
    const definitions = file.endsWith('.css') ? /(--[\w-]+)\s*:/g : /['"`](--[\w-]+)['"`]/g;
    for (const match of text.matchAll(definitions)) defined.add(match[1]);
  }
  return sources.flatMap((file) =>
    fs.readFileSync(file, 'utf8').split('\n').flatMap((line, index) =>
      [...line.matchAll(/var\(\s*(--[\w-]+)/g)]
        .filter((match) => !defined.has(match[1]) && !RUNTIME_VARIABLE_PREFIXES.some((prefix) => match[1].startsWith(prefix)))
        .map((match) => ({ file, line: index + 1, column: match.index + 1, className: `var(${match[1]})` })),
    ),
  );
}

function findClassUsages(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const usages = [];
  const seen = new Set();
  const followed = new Set();
  const declarations = collectDeclarations(source);

  const addText = (text, start, { trimStart = false, trimEnd = false } = {}) => {
    for (const match of text.matchAll(/\S+/g)) {
      const touchesStart = trimStart && match.index === 0;
      const touchesEnd = trimEnd && match.index + match[0].length === text.length;
      if (touchesStart || touchesEnd) continue;
      const position = start + match.index;
      if (seen.has(position)) continue;
      seen.add(position);
      const { line, character } = source.getLineAndCharacterOfPosition(position);
      usages.push({ file, line: line + 1, column: character + 1, className: match[0] });
    }
  };

  const collectStrings = (node) => {
    if (!node) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      addText(node.text, node.getStart(source) + 1);
    } else if (ts.isTemplateExpression(node)) {
      addText(node.head.text, node.head.getStart(source) + 1, { trimEnd: true });
      for (const span of node.templateSpans) {
        const isLast = span === node.templateSpans.at(-1);
        collectStrings(span.expression);
        addText(span.literal.text, span.literal.getStart(source) + 1, { trimStart: true, trimEnd: !isLast });
      }
    } else if (ts.isConditionalExpression(node)) {
      collectStrings(node.whenTrue);
      collectStrings(node.whenFalse);
    } else if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      if (operator === ts.SyntaxKind.AmpersandAmpersandToken) collectStrings(node.right);
      if (operator === ts.SyntaxKind.BarBarToken || operator === ts.SyntaxKind.QuestionQuestionToken || operator === ts.SyntaxKind.PlusToken) {
        collectStrings(node.left);
        collectStrings(node.right);
      }
    } else if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach(collectStrings);
    } else if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name)) {
          addText(property.name.text, property.name.getStart(source) + 1);
        }
      }
    } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
      collectStrings(node.expression);
    } else if (ts.isJsxExpression(node)) {
      collectStrings(node.expression);
    } else if (ts.isIdentifier(node)) {
      follow(node.text, (declaration) => collectStrings(declaration));
    } else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      follow(node.expression.text, (declaration) => {
        const property = ts.isObjectLiteralExpression(declaration) && findProperty(declaration, node.name.text);
        if (property) collectStrings(property.initializer);
      });
    } else if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      follow(node.expression.text, collectObjectValues);
    } else if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && CLASS_FUNCTIONS.has(node.expression.text)) collectClassCall(node);
      else if (ts.isIdentifier(node.expression)) follow(node.expression.text, (declaration) => returnedExpressions(declaration).forEach(collectStrings));
    }
  };

  const collectObjectValues = (node) => {
    if (!ts.isObjectLiteralExpression(node)) return collectStrings(node);
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) collectObjectValues(property.initializer);
    }
  };
  const follow = (name, collect) => {
    for (const declaration of declarations.get(name) ?? []) {
      if (followed.has(declaration)) continue;
      followed.add(declaration);
      collect(declaration);
    }
  };

  const collectClassCall = (node) => {
    if (node.expression.text === 'cva') {
      collectStrings(node.arguments[0]);
      collectCvaConfig(node.arguments[1]);
    } else {
      node.arguments.forEach(collectStrings);
    }
  };

  const collectCvaConfig = (config) => {
    if (!config || !ts.isObjectLiteralExpression(config)) return;
    for (const property of config.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const name = property.name.getText(source);
      if (name === 'variants' && ts.isObjectLiteralExpression(property.initializer)) {
        for (const variant of property.initializer.properties) {
          if (!ts.isPropertyAssignment(variant) || !ts.isObjectLiteralExpression(variant.initializer)) continue;
          for (const option of variant.initializer.properties) {
            if (ts.isPropertyAssignment(option)) collectStrings(option.initializer);
          }
        }
      } else if (name === 'compoundVariants' && ts.isArrayLiteralExpression(property.initializer)) {
        for (const compound of property.initializer.elements) {
          if (!ts.isObjectLiteralExpression(compound)) continue;
          for (const field of compound.properties) {
            if (ts.isPropertyAssignment(field) && CLASS_NAME.test(field.name.getText(source))) collectStrings(field.initializer);
          }
        }
      }
    }
  };

  const visit = (node) => {
    if (ts.isJsxAttribute(node) && CLASS_NAME.test(node.name.getText(source))) {
      collectStrings(node.initializer);
    } else if (ts.isPropertyAssignment(node) && CLASS_NAME.test(node.name.getText(source))) {
      collectObjectValues(node.initializer);
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && CLASS_NAME.test(node.name.text) && node.initializer) {
      collectObjectValues(node.initializer);
    } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && CLASS_NAME.test(node.left.name.text)) {
      collectStrings(node.right);
    } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLASS_FUNCTIONS.has(node.expression.text)) {
      collectClassCall(node);
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return usages;
}

function collectDeclarations(source) {
  const declarations = new Map();
  const add = (name, node) => declarations.set(name, [...(declarations.get(name) ?? []), node]);
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) add(node.name.text, node.initializer);
    if (ts.isFunctionDeclaration(node) && node.name) add(node.name.text, node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return declarations;
}

function returnedExpressions(node) {
  if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) return [node.body];
  if (!ts.isFunctionDeclaration(node) && !ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) return [];
  const returns = [];
  const visit = (child) => {
    if (ts.isFunctionLike(child)) return;
    if (ts.isReturnStatement(child) && child.expression) returns.push(child.expression);
    ts.forEachChild(child, visit);
  };
  if (node.body) ts.forEachChild(node.body, visit);
  return returns;
}

function findProperty(object, name) {
  return object.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText() === name);
}

function isBanned(candidate) {
  const base = candidate.split(/:(?![^[]*\])/).at(-1).replace(/^!|!$/g, '');
  return BANNED.some((pattern) => pattern.test(base));
}

function isDefinedElsewhere(candidate) {
  const base = candidate.split(/:(?![^[]*\])/).at(-1).replace(/^!|!$/g, '');
  return stylesheetClasses.has(base) || selectorClasses.has(base) || ALLOWED.some((pattern) => pattern.test(base));
}

function collectStylesheetClasses() {
  const sheets = [
    ...walk(SRC).filter((file) => file.endsWith('.css')),
    ...THIRD_PARTY_CSS.map((sheet) => require.resolve(sheet)),
  ];
  const classes = new Set();
  for (const sheet of sheets) {
    const css = fs.readFileSync(sheet, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
    for (const match of css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) classes.add(match[1]);
  }
  return classes;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full);
    return [full];
  });
}
