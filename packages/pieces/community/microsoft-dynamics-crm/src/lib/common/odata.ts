const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const FORMATTED_SUFFIX = '@OData.Community.Display.V1.FormattedValue';
const LOOKUP_ENTITY_SUFFIX = '@Microsoft.Dynamics.CRM.lookuplogicalname';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireGuid({ value, label }: { value: unknown; label: string }): string {
  const text =
    typeof value === 'string' ? value.trim().replace(/^\{/, '').replace(/\}$/, '') : '';
  if (!GUID_PATTERN.test(text)) {
    throw new Error(
      `${label} must be a record ID (a GUID such as 00000000-0000-0000-0000-000000000000). Received "${String(value ?? '').slice(0, 60)}".`
    );
  }
  return text.toLowerCase();
}

function requireIdentifier({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!IDENTIFIER_PATTERN.test(text)) {
    throw new Error(
      `${label} must be a Dataverse name made of letters, digits and underscores. Received "${String(value ?? '').slice(0, 60)}".`
    );
  }
  return text;
}

function escapeString(value: string): string {
  return value.replace(/'/g, "''");
}

function escapeContains(value: string): string {
  return escapeString(value.replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]'));
}

function parseColumnList(value: unknown): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];
  return items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '')
    .map((item) => requireIdentifier({ value: item, label: 'Column name' }));
}

function parseJsonObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object, for example {"name": "Contoso"}.`);
    }
  }
  if (!isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object, for example {"name": "Contoso"}.`);
  }
  return parsed;
}

function compactFields(fields: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === '') {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function flattenRecord(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.endsWith(FORMATTED_SUFFIX)) {
      result[`${key.slice(0, -FORMATTED_SUFFIX.length)}_formatted`] = value;
      continue;
    }
    if (key.endsWith(LOOKUP_ENTITY_SUFFIX)) {
      result[`${key.slice(0, -LOOKUP_ENTITY_SUFFIX.length)}_entity`] = value;
      continue;
    }
    if (key === '@odata.etag') {
      result['etag'] = value;
      continue;
    }
    if (key.includes('@')) {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function shapeRecord({ record, keys, primaryId, entitySet }: ShapeRecordParams): Record<string, unknown> {
  const flat = flattenRecord(record);
  const filled: Record<string, unknown> = Object.fromEntries(keys.map((key) => [key, null]));
  const identity: Record<string, unknown> = {};
  if (primaryId !== undefined) {
    identity['id'] = flat[primaryId] ?? null;
  }
  if (entitySet !== undefined) {
    identity['entitySet'] = entitySet;
  }
  return { ...filled, ...flat, ...identity };
}

function bindPath({ entitySet, id }: { entitySet: string; id: string }): string {
  return `/${entitySet}(${id})`;
}

function readYesNo({ value, fallback }: { value: unknown; fallback: boolean }): boolean {
  if (value === 'yes' || value === true) {
    return true;
  }
  if (value === 'no' || value === false) {
    return false;
  }
  return fallback;
}

function xmlEscapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyFetchPaging({ fetchXml, page, pagingCookie }: { fetchXml: string; page?: number; pagingCookie?: string }): string {
  const trimmed = fetchXml.trim();
  const match = /^<fetch\b([^>]*)>/i.exec(trimmed);
  if (!match) {
    throw new Error('FetchXML must start with a <fetch> element, for example <fetch top="50"><entity name="account">...</entity></fetch>.');
  }
  if (page === undefined && (pagingCookie === undefined || pagingCookie === '')) {
    return trimmed;
  }
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    throw new Error('Page must be a whole number of 1 or more.');
  }
  let attributes = match[1].replace(/\s(page|paging-cookie)\s*=\s*("[^"]*"|'[^']*')/gi, '');
  if (page !== undefined) {
    attributes += ` page="${page}"`;
  }
  if (pagingCookie !== undefined && pagingCookie !== '') {
    attributes += ` paging-cookie="${xmlEscapeAttribute(pagingCookie)}"`;
  }
  return `<fetch${attributes}>${trimmed.slice(match[0].length)}`;
}

function readFile(value: unknown): { filename: string; base64: string; mimeType?: string } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const filename = value['filename'];
  const base64 = value['base64'];
  const data = value['data'];
  if (typeof filename !== 'string') {
    return undefined;
  }
  const mimeType = mimeTypeFor(filename);
  if (typeof base64 === 'string') {
    return { filename, base64, mimeType };
  }
  if (Buffer.isBuffer(data)) {
    return { filename, base64: data.toString('base64'), mimeType };
  }
  return undefined;
}

function mimeTypeFor(filename: string): string | undefined {
  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1).toLowerCase() : '';
  return MIME_TYPES[extension];
}

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  eml: 'message/rfc822',
  msg: 'application/vnd.ms-outlook',
};

function readPageSize({ value, max }: { value: unknown; max: number }): number {
  if (value === undefined || value === null || value === '') {
    return 50;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new Error(`Page Size must be a whole number from 1 to ${max}.`);
  }
  return number;
}

export const odata = {
  isRecord,
  requireGuid,
  requireIdentifier,
  escapeString,
  escapeContains,
  parseColumnList,
  parseJsonObject,
  compactFields,
  flattenRecord,
  shapeRecord,
  bindPath,
  readYesNo,
  applyFetchPaging,
  readFile,
  readPageSize,
};

type ShapeRecordParams = {
  record: Record<string, unknown>;
  keys: string[];
  primaryId?: string;
  entitySet?: string;
};
