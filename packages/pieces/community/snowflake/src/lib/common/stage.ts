import { qualifiedName, sqlString } from './sql';

export function stageReference({
  stage: rawStage,
  path: rawPath,
}: {
  stage: string;
  path?: string | null;
}): string {
  let stage = String(rawStage ?? '').trim();
  if (stage.startsWith('@')) stage = stage.slice(1);
  let path = (rawPath ?? '').trim();
  const slash = findPathStart(stage);
  if (slash !== -1) {
    const inlinePath = stage.slice(slash + 1);
    stage = stage.slice(0, slash);
    path =
      path === ''
        ? inlinePath
        : `${inlinePath.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
  if (stage === '~' || stage.startsWith('%')) {
    throw new Error(
      'User (@~) and table (@%) stages are not supported here; use a named stage.'
    );
  }
  const name = qualifiedName({ value: stage, label: 'Stage' });
  if (path === '') return `@${name}`;
  if (!STAGE_PATH_CHARS.test(path) || path.includes('..')) {
    throw new Error(
      `Stage path "${path}" contains characters that are not allowed. Use letters, digits and - _ . / = + % ~ only.`
    );
  }
  const reference = `@${name}/${path.replace(/^\/+/, '')}`;
  return path.includes(' ') ? sqlString(reference) : reference;
}

function findPathStart(stage: string): number {
  let inQuotes = false;
  for (let i = 0; i < stage.length; i++) {
    if (stage[i] === '"') inQuotes = !inQuotes;
    if (stage[i] === '/' && !inQuotes) return i;
  }
  return -1;
}

export function buildCopyInto({
  table,
  stage,
  fileFormat,
  pattern,
  skipHeader,
  errorOnColumnCountMismatch,
  onError,
}: {
  table: string;
  stage: string;
  fileFormat: string;
  pattern?: string | null;
  skipHeader?: number | null;
  errorOnColumnCountMismatch?: boolean | null;
  onError?: string | null;
}): string {
  const format = String(fileFormat ?? 'CSV').toUpperCase();
  if (!FILE_FORMAT_TYPES.some((value) => value === format)) {
    throw new Error(
      `File format must be one of ${FILE_FORMAT_TYPES.join(', ')}.`
    );
  }
  const errorMode = String(onError || 'ABORT_STATEMENT').toUpperCase();
  if (!ON_ERROR_VALUES.some((value) => value === errorMode)) {
    throw new Error(`On Error must be one of ${ON_ERROR_VALUES.join(', ')}.`);
  }
  let formatClause = `TYPE = '${format}'`;
  if (
    skipHeader !== undefined &&
    skipHeader !== null &&
    Number(skipHeader) !== 0
  ) {
    const rows = Number(skipHeader);
    if (!Number.isInteger(rows) || rows < 0 || rows > 1000) {
      throw new Error(
        'Skip Header Rows must be a whole number between 0 and 1000.'
      );
    }
    if (format !== 'CSV') {
      throw new Error('Skip Header Rows only applies to CSV files.');
    }
    formatClause += ` SKIP_HEADER = ${rows}`;
  }
  if (
    errorOnColumnCountMismatch !== undefined &&
    errorOnColumnCountMismatch !== null &&
    format === 'CSV'
  ) {
    formatClause += ` ERROR_ON_COLUMN_COUNT_MISMATCH = ${
      errorOnColumnCountMismatch ? 'TRUE' : 'FALSE'
    }`;
  }
  let sql = `COPY INTO ${qualifiedName({
    value: table,
    label: 'Table',
  })} FROM ${stage} FILE_FORMAT = (${formatClause})`;
  if (pattern && pattern.trim() !== '')
    sql += ` PATTERN = ${sqlString(pattern.trim())}`;
  sql += ` ON_ERROR = '${errorMode}'`;
  return sql;
}

export const FILE_FORMAT_TYPES = [
  'CSV',
  'JSON',
  'PARQUET',
  'AVRO',
  'ORC',
  'XML',
] as const;
export const ON_ERROR_VALUES = [
  'ABORT_STATEMENT',
  'CONTINUE',
  'SKIP_FILE',
] as const;

const STAGE_PATH_CHARS = /^[A-Za-z0-9_\-./=+%~ ]*$/;
