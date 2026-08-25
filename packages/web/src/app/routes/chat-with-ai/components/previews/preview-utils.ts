import { parse, unparse } from 'papaparse';

function getNodeText(node: HastNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(getNodeText).join('');
}

function collectRows(node: HastNode | undefined, rows: HastNode[][]): void {
  if (!node?.children) return;
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'tr') {
      const cells = (child.children ?? []).filter(
        (c) =>
          c.type === 'element' && (c.tagName === 'td' || c.tagName === 'th'),
      );
      rows.push(cells);
    } else {
      collectRows(child, rows);
    }
  }
}

function detectPreviewKind(language: string, code: string): PreviewKind {
  const lang = language.trim().toLowerCase();
  const trimmed = code.trimStart();

  if (lang === 'html' || lang === 'htm' || lang === 'xhtml') return 'html';
  if (
    lang === 'svg' ||
    ((lang === 'xml' || lang === 'markup') && trimmed.startsWith('<svg'))
  ) {
    return 'svg';
  }
  if (lang === 'csv') return 'csv';
  if (lang === 'email' || lang === 'eml') return 'email';
  if (lang === 'json' || lang === 'json5') return 'json';
  if (lang === 'md' || lang === 'markdown' || lang === 'mdx') return 'markdown';
  if (lang === 'mermaid') return 'mermaid';
  return 'code';
}

function extractTableFromNode(node: HastNode | undefined): TableData | null {
  const rawRows: HastNode[][] = [];
  collectRows(node, rawRows);
  if (rawRows.length === 0) return null;

  const matrix = rawRows.map((cells) =>
    cells.map((cell) => getNodeText(cell).trim()),
  );
  const columnCount = Math.max(...matrix.map((row) => row.length));
  if (columnCount === 0) return null;

  const normalize = (row: string[]): string[] =>
    Array.from({ length: columnCount }, (_, i) => row[i] ?? '');

  const [first, ...rest] = matrix;
  return { headers: normalize(first), rows: rest.map(normalize) };
}

function parseCsv(code: string): TableData | null {
  const result = parse<string[]>(code.trim(), { skipEmptyLines: true });
  const data = result.data.filter((row) => Array.isArray(row));
  if (data.length === 0) return null;

  const columnCount = Math.max(...data.map((row) => row.length));
  if (columnCount === 0) return null;

  const normalize = (row: string[]): string[] =>
    Array.from({ length: columnCount }, (_, i) => (row[i] ?? '').trim());

  const [first, ...rest] = data;
  return { headers: normalize(first), rows: rest.map(normalize) };
}

function buildCsv(table: TableData): string {
  return unparse([table.headers, ...table.rows]);
}

function buildTsv(table: TableData): string {
  return [table.headers, ...table.rows].map((row) => row.join('\t')).join('\n');
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  typescript: 'ts',
  ts: 'ts',
  tsx: 'tsx',
  javascript: 'js',
  js: 'js',
  jsx: 'jsx',
  python: 'py',
  py: 'py',
  json: 'json',
  yaml: 'yaml',
  yml: 'yml',
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
  sql: 'sql',
  java: 'java',
  kotlin: 'kt',
  go: 'go',
  rust: 'rs',
  rs: 'rs',
  ruby: 'rb',
  php: 'php',
  css: 'css',
  scss: 'scss',
  html: 'html',
  xml: 'xml',
  markdown: 'md',
  md: 'md',
  text: 'txt',
  plaintext: 'txt',
};

function languageToExtension(language: string): string {
  const lang = language.trim().toLowerCase();
  if (LANGUAGE_EXTENSIONS[lang]) return LANGUAGE_EXTENSIONS[lang];
  return /^[a-z0-9]{1,8}$/.test(lang) ? lang : 'txt';
}

function parseJsonSafe(
  code: string,
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(code) };
  } catch {
    return { ok: false };
  }
}

function fileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

function detectFileKind(mediaType: string, fileName: string): FileKind {
  const mt = mediaType.toLowerCase();
  const ext = fileExtension(fileName);

  if (mt.startsWith('image/')) return 'image';
  if (mt.includes('html') || ext === 'html' || ext === 'htm') return 'html';
  if (
    mt.includes('csv') ||
    mt.includes('tab-separated') ||
    ext === 'csv' ||
    ext === 'tsv'
  ) {
    return 'csv';
  }
  if (mt.includes('json') || ext === 'json') return 'json';
  if (
    mt.includes('markdown') ||
    ext === 'md' ||
    ext === 'markdown' ||
    ext === 'mdx'
  ) {
    return 'markdown';
  }
  if (mt === 'text/plain' || ext === 'txt') return 'text';
  return 'binary';
}

function isLikelyDocument(text: string): boolean {
  const trimmed = text.trimStart();
  if (!/^#\s/.test(trimmed)) return false;
  return trimmed.length >= 60;
}

function baseFileName(fileName: string): string {
  const ext = fileExtension(fileName);
  if (!ext) return fileName;
  return fileName.slice(0, fileName.length - ext.length - 1);
}

export const previewUtils = {
  detectPreviewKind,
  extractTableFromNode,
  parseCsv,
  buildCsv,
  buildTsv,
  languageToExtension,
  parseJsonSafe,
  detectFileKind,
  baseFileName,
  isLikelyDocument,
};

export type PreviewKind =
  | 'html'
  | 'svg'
  | 'csv'
  | 'email'
  | 'json'
  | 'markdown'
  | 'mermaid'
  | 'code';

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type FileKind =
  | 'image'
  | 'html'
  | 'csv'
  | 'json'
  | 'markdown'
  | 'text'
  | 'binary';

export type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
  position?: { start: { line: number }; end: { line: number } };
};
