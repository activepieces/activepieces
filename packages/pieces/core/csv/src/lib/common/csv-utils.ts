import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

function assertCsvText({ value, label = 'CSV Text' }: { value: unknown; label?: string }): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be text. Map the CSV text from an earlier step, or paste it.`);
  }
  assertByteLimit({ bytes: Buffer.byteLength(value, 'utf8'), label });
  return value;
}

function assertByteLimit({ bytes, label }: { bytes: number; label: string }): void {
  if (bytes > CSV_LIMITS.maxInputBytes) {
    throw new Error(
      `${label} is larger than ${CSV_LIMITS.maxInputBytes / 1024 / 1024} MB. ${TOO_BIG_HINT}`,
    );
  }
}

function assertRowLimit(count: number): void {
  if (count > CSV_LIMITS.maxRows) {
    throw new Error(
      `The data has ${count} rows; this action handles up to ${CSV_LIMITS.maxRows}. ${TOO_BIG_HINT}`,
    );
  }
}

function detectDelimiter(text: string): string {
  const records = sampleDelimiterCounts(stripBom(text).slice(0, DETECTION_SAMPLE_CHARS));
  if (records.length === 0) {
    return ',';
  }
  const ranked = DELIMITER_CANDIDATES.map((candidate, order) => {
    const first = records[0][candidate];
    const consistent = records.filter((r) => r[candidate] === first).length;
    return { candidate, first, consistent, order };
  })
    .filter((r) => r.first > 0)
    .sort((a, b) => b.consistent - a.consistent || b.first - a.first || a.order - b.order);
  return ranked[0]?.candidate ?? ',';
}

function resolveDelimiter({ text, delimiter }: { text: string; delimiter: string | undefined | null }): string {
  if (!delimiter || delimiter === AUTO_DELIMITER) {
    return detectDelimiter(text);
  }
  return delimiter;
}

function parseCsvRecords({
  text,
  delimiter,
  hasHeader = true,
  trim = false,
}: {
  text: string;
  delimiter: string;
  hasHeader?: boolean;
  trim?: boolean;
}): string[][] {
  const clean = stripBom(text);
  if (clean.trim() === '') {
    return [];
  }
  const records = parseOrExplain({ text: clean, delimiter, trim });
  const nonEmpty = records.filter((r) => r.some((cell) => cell.trim() !== ''));
  assertRowLimit(Math.max(nonEmpty.length - (hasHeader ? 1 : 0), 0));
  return nonEmpty;
}

function normalizeHeaders({ raw, width }: { raw: string[]; width: number }): string[] {
  const taken = new Set<string>();
  const nextSuffix = new Map<string, number>();
  return Array.from({ length: Math.max(raw.length, width) }, (_, i) => {
    const base = (raw[i] ?? '').trim() || `column_${i + 1}`;
    let name = base;
    if (taken.has(base)) {
      let n = nextSuffix.get(base) ?? 2;
      while (taken.has(`${base}_${n}`)) {
        n++;
      }
      nextSuffix.set(base, n + 1);
      name = `${base}_${n}`;
    }
    taken.add(name);
    return name;
  });
}

function maxWidth(records: string[][]): number {
  return records.reduce((max, record) => (record.length > max ? record.length : max), 0);
}

function parseCsv({
  text,
  delimiter,
  hasHeader = true,
  trim = false,
}: {
  text: string;
  delimiter?: string | null;
  hasHeader?: boolean;
  trim?: boolean;
}): ParsedCsv {
  const resolved = resolveDelimiter({ text, delimiter });
  const records = parseCsvRecords({ text, delimiter: resolved, hasHeader, trim });
  if (records.length === 0) {
    return { headers: [], rows: [], delimiter: resolved };
  }
  const width = maxWidth(records);
  const headers = normalizeHeaders({ raw: hasHeader ? records[0] : [], width });
  const dataRecords = hasHeader ? records.slice(1) : records;
  const rows = dataRecords.map((record) =>
    Object.fromEntries(headers.map((h, i) => [h, record[i] ?? ''])),
  );
  return { headers, rows, delimiter: resolved };
}

function serializeCsv({
  headers,
  rows,
  delimiter = ',',
  includeHeader = true,
  escapeFormulas = false,
}: {
  headers: string[];
  rows: Record<string, unknown>[];
  delimiter?: string;
  includeHeader?: boolean;
  escapeFormulas?: boolean;
}): string {
  if (headers.length === 0) {
    return '';
  }
  const records = rows.map((row) => headers.map((h) => cellToString(row[h])));
  const table = includeHeader ? [headers, ...records] : records;
  const safe = escapeFormulas ? table.map((record) => record.map(escapeFormula)) : table;
  return stringify(safe, { delimiter });
}

function escapeFormula(value: string): string {
  if (!FORMULA_PREFIX.test(value) || PLAIN_NUMBER.test(value)) {
    return value;
  }
  return `'${value}`;
}

function isExactNumber(value: string): boolean {
  const match = SAFE_NUMBER_PARTS.exec(value);
  if (!match) {
    return false;
  }
  const digits = `${match[1]}${match[2] ?? ''}`.replace(/^0+/, '').replace(/0+$/, '');
  return digits.length <= MAX_EXACT_DIGITS;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return '';
  }
  return JSON.stringify(value);
}

function toCsvResult(parsed: ParsedCsv): CsvResult {
  return {
    csv: serializeCsv({ headers: parsed.headers, rows: parsed.rows, delimiter: parsed.delimiter }),
    rows: parsed.rows,
    row_count: parsed.rows.length,
    headers: parsed.headers,
  };
}

function findColumn({ headers, requested }: { headers: string[]; requested: unknown }): string {
  const name = cellToString(requested).trim();
  if (name === '') {
    throw new Error('Enter a column name.');
  }
  if (headers.length === 0) {
    throw new Error(`The CSV is empty, so it has no column named "${name}".`);
  }
  if (headers.includes(name)) {
    return name;
  }
  const loose = headers.filter((h) => h.toLowerCase() === name.toLowerCase());
  if (loose.length === 1) {
    return loose[0];
  }
  throw new Error(`Column "${name}" not found. Available columns: ${headers.join(', ')}`);
}

function toStringList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => cellToString(v).trim()).filter((v) => v !== '');
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function fileToBuffer(file: unknown): Buffer {
  if (isRecord(file)) {
    const { data, base64 } = file;
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return Buffer.from(data);
    }
    if (typeof base64 === 'string') {
      return Buffer.from(base64, 'base64');
    }
  }
  throw new Error('No file was provided. Upload a CSV file or map a file from an earlier step.');
}

function decodeText(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const evenLength = buffer.length - 2 - ((buffer.length - 2) % 2);
    const body = Buffer.from(buffer.subarray(2, 2 + evenLength));
    body.swap16();
    return body.toString('utf16le');
  }
  return stripBom(buffer.toString('utf8'));
}

function isExcelSignature(buffer: Buffer): boolean {
  const isXlsx = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const isXls = buffer[0] === 0xd0 && buffer[1] === 0xcf;
  return isXlsx || isXls;
}

function safeFileName({
  requested,
  fallback,
  extension,
}: {
  requested: unknown;
  fallback: string;
  extension: string;
}): string {
  const raw = typeof requested === 'string' ? requested.trim() : '';
  const name = (raw || fallback).replace(/[\\/]/g, '_');
  return /\.[A-Za-z0-9]+$/.test(name) ? name : `${name}.${extension}`;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseOrExplain({ text, delimiter, trim }: { text: string; delimiter: string; trim: boolean }): string[][] {
  try {
    return parse(text, {
      delimiter,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Could not read the CSV: ${message}. Check that the delimiter is right and that quoted values are closed.`,
    );
  }
}

function sampleDelimiterCounts(sample: string): Record<string, number>[] {
  const records: Record<string, number>[] = [];
  let counts = emptyCounts();
  let inQuotes = false;
  let hasContent = false;
  for (let i = 0; i < sample.length && records.length < DETECTION_RECORDS; i++) {
    const ch = sample[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      hasContent = true;
    } else if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (hasContent) {
        records.push(counts);
      }
      counts = emptyCounts();
      hasContent = false;
    } else {
      if (!inQuotes && ch in counts) {
        counts[ch]++;
      }
      hasContent = hasContent || ch.trim() !== '';
    }
  }
  if (hasContent && records.length < DETECTION_RECORDS) {
    records.push(counts);
  }
  return records;
}

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(DELIMITER_CANDIDATES.map((d) => [d, 0]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

const TOO_BIG_HINT =
  'For bigger files, use the Subflows piece\'s "Stream CSV to Subflows" action, which processes the file in batches.';
const DELIMITER_CANDIDATES = [',', ';', '\t', '|'];
const DETECTION_SAMPLE_CHARS = 64 * 1024;
const DETECTION_RECORDS = 20;
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const SAFE_NUMBER_PARTS = /^-?(0|[1-9]\d{0,14})(?:\.(\d{1,15}))?$/;
const MAX_EXACT_DIGITS = 15;

export const AUTO_DELIMITER = 'auto';

export const CSV_LIMITS = {
  maxInputBytes: 20 * 1024 * 1024,
  maxRows: 100_000,
};

export const csvUtils = {
  assertCsvText,
  assertByteLimit,
  assertRowLimit,
  detectDelimiter,
  resolveDelimiter,
  parseCsvRecords,
  normalizeHeaders,
  parseCsv,
  serializeCsv,
  cellToString,
  toCsvResult,
  findColumn,
  toStringList,
  parseNumber,
  isExactNumber,
  fileToBuffer,
  decodeText,
  isExcelSignature,
  safeFileName,
  isRecord,
};

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
  delimiter: string;
};

export type CsvResult = {
  csv: string;
  rows: CsvRow[];
  row_count: number;
  headers: string[];
};
