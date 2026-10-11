import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = path.join(WEB_ROOT, 'src/app/routes/platform');
const ALLOWLIST_PATH = path.join(WEB_ROOT, 'scripts/admin-interactions-allowlist.json');

const RULES = [
  {
    id: 'raw-toast',
    pattern: /\btoast(\.(success|error|info|warning|message))?\(/,
    fix: 'useAdminAction, InstantSwitch or ConfirmDialog show the toast; mutationFeedback.error for anything else',
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
    id: 'spinner-loading',
    pattern: /\bLoadingSpinner\b|\banimate-spin\b/,
    fix: 'AdminQueryState (skeleton) for data, Button loading for actions',
  },
];

const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
const allowed = new Map(Object.entries(allowlist.files));

const violations = walk(SCOPE)
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .flatMap((file) => findViolations(file));

const byFile = groupBy(violations, (violation) => violation.file);
const unexpected = violations.filter(
  (violation) => !(allowed.get(violation.file) ?? []).includes(violation.rule),
);
const stale = [...allowed.entries()].flatMap(([file, rules]) =>
  rules
    .filter((rule) => !(byFile.get(file) ?? []).some((violation) => violation.rule === rule))
    .map((rule) => ({ file, rule })),
);

if (unexpected.length > 0) {
  console.error('Admin pages must use the shared interaction blocks (brain/knowledge/design-system/admin-interactions.md).\n');
  for (const violation of unexpected) {
    const rule = RULES.find((candidate) => candidate.id === violation.rule);
    console.error(`${violation.file}:${violation.line}  ${violation.rule}: ${rule.fix}`);
  }
  console.error(`\n${unexpected.length} violation(s).\n`);
  process.exitCode = 1;
}

if (stale.length > 0) {
  console.error('These allowlist entries are fixed now. Remove them from scripts/admin-interactions-allowlist.json:\n');
  for (const entry of stale) {
    console.error(`${entry.file}  ${entry.rule}`);
  }
  console.error('');
  process.exitCode = 1;
}

function findViolations(file) {
  const relative = path.relative(WEB_ROOT, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  return lines.flatMap((text, index) =>
    RULES.filter((rule) => rule.pattern.test(text)).map((rule) => ({
      file: relative,
      line: index + 1,
      rule: rule.id,
    })),
  );
}

function groupBy(items, keyOf) {
  return items.reduce((groups, item) => {
    const key = keyOf(item);
    return groups.set(key, [...(groups.get(key) ?? []), item]);
  }, new Map());
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
