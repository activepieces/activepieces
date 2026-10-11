import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = path.join(WEB_ROOT, 'src/app/routes/platform');

const RULES = [
  {
    id: 'raw-toast',
    pattern: /\btoast(\.(success|error|info|warning|message))?\(/,
    fix: 'useAdminAction, InstantSwitch or ConfirmDialog show the toast; adminFeedback.done or mutationFeedback.error for anything else',
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

const violations = walk(SCOPE)
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .flatMap((file) => findViolations(file));

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

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
