import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = [
  'src/app/routes/platform',
  'src/app/components/billing-page-shell.tsx',
  'src/features/platform-admin',
  'src/features/piece-sets',
  'src/features/secret-managers',
].map((entry) => path.join(WEB_ROOT, entry));

const RULES = [
  {
    id: 'raw-toast',
    pattern: /\btoast(\.(success|error|info|warning|message|promise|loading|custom|dismiss))?\(/,
    fix: 'useAdminAction, InstantSwitch or ConfirmDialog show the toast; adminFeedback or mutationFeedback for anything else',
  },
  {
    id: 'sonner-import',
    pattern: /from ['"]sonner['"]/,
    fix: 'go through useAdminAction, adminFeedback or mutationFeedback instead of sonner',
  },
  {
    id: 'internal-error-toast',
    pattern: /\binternalErrorToast\(/,
    fix: 'let the action fail through useAdminAction or mutationFeedback.error so the server message is shown',
  },
  {
    id: 'legacy-confirm',
    pattern: /\bConfirmationDeleteDialog\b/,
    fix: 'ConfirmDialog from @/app/components/admin',
  },
  {
    id: 'aliased-import',
    pattern: /\b(useMutation|toast)\s+as\s+\w+/,
    fix: 'import useMutation and toast by their own names so the check can see them',
  },
  {
    id: 'spinner-loading',
    pattern: /\bLoadingSpinner\b|\banimate-spin\b|\bLoader2\b/,
    fix: 'AdminQueryState (skeleton) for data, Button loading for actions',
  },
];

const UNHANDLED_MUTATION = {
  id: 'unhandled-mutation',
  fix: 'useAdminAction, or give useMutation an onError that reports through mutationFeedback or the form',
};

const violations = SCOPE.flatMap((entry) => walk(entry))
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .flatMap((file) => [
    ...findViolations(file),
    ...findUnhandledMutations(file),
  ]);

if (violations.length > 0) {
  console.error('Admin pages must use the shared interaction blocks (brain/knowledge/design-system/admin-interactions.md).\n');
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line}  ${violation.rule.id}: ${violation.rule.fix}`);
  }
  console.error(`\n${violations.length} violation(s).\n`);
  process.exitCode = 1;
}

function findViolations(file) {
  const relative = path.relative(WEB_ROOT, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  return lines.flatMap((text, index) =>
    RULES.filter((rule) => rule.pattern.test(text)).map((rule) => ({
      file: relative,
      line: index + 1,
      rule,
    })),
  );
}

function findUnhandledMutations(file) {
  const relative = path.relative(WEB_ROOT, file);
  const source = fs.readFileSync(file, 'utf8');
  const optionalOnError = /\bonError\?\s*:/.test(source);
  return [...source.matchAll(/\buseMutation\b/g)].flatMap((match) => {
    const open = callStart(source, match.index + match[0].length);
    if (open === -1) {
      return [];
    }
    const body = callBody(source, open + 1);
    if (handlesErrors({ body, optionalOnError })) {
      return [];
    }
    return [
      {
        file: relative,
        line: source.slice(0, match.index).split('\n').length,
        rule: UNHANDLED_MUTATION,
      },
    ];
  });
}

function handlesErrors({ body, optionalOnError }) {
  if (!/\bonError\b/.test(body)) {
    return false;
  }
  if (/\bonError\s*:\s*\([^)]*\)\s*=>\s*(undefined|\{\s*\}|null)/.test(body)) {
    return false;
  }
  const passesThrough = /\bonError\s*(,|\}|:\s*onError\b)/.test(body);
  return !(passesThrough && optionalOnError);
}

function callStart(source, index) {
  let cursor = index;
  while (/\s/.test(source[cursor] ?? '')) cursor += 1;
  if (source[cursor] === '<') {
    let depth = 0;
    while (cursor < source.length) {
      if (source[cursor] === '<') depth += 1;
      if (source[cursor] === '>' && source[cursor - 1] !== '=') depth -= 1;
      cursor += 1;
      if (depth === 0) break;
    }
    while (/\s/.test(source[cursor] ?? '')) cursor += 1;
  }
  return source[cursor] === '(' ? cursor : -1;
}

function callBody(source, start) {
  let depth = 1;
  let index = start;
  while (index < source.length && depth > 0) {
    const char = source[index];
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    index += 1;
  }
  return source.slice(start, index);
}

function walk(entry) {
  if (!fs.existsSync(entry)) {
    return [];
  }
  if (fs.statSync(entry).isFile()) {
    return [entry];
  }
  const directory = entry;
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
