const MAX_FLATTEN_DEPTH = 4;

export function normalizeInstanceUrl(instanceUrl: string): string {
  return instanceUrl
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

export function flattenRecord(
  value: unknown,
  prefix = '',
  depth = 0
): Record<string, unknown> {
  if (value === null || value === undefined) {
    return prefix ? { [prefix]: value } : {};
  }

  if (Array.isArray(value)) {
    if (prefix) {
      return { [prefix]: JSON.stringify(value) };
    }
    return { items: JSON.stringify(value) };
  }

  if (typeof value !== 'object') {
    return prefix ? { [prefix]: value } : { value };
  }

  if (depth >= MAX_FLATTEN_DEPTH) {
    return prefix ? { [prefix]: JSON.stringify(value) } : {};
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}_${key.replace(/-/g, '_')}` : key.replace(/-/g, '_');
    Object.assign(result, flattenRecord(nested, nextKey, depth + 1));
  }
  return result;
}

export function flattenRecords(records: unknown[]): Record<string, unknown>[] {
  return records.map((record) => flattenRecord(record));
}

function readNestedId(value: unknown): number | string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id: number | string }).id;
  }
  return null;
}

function readNestedName(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name: unknown }).name;
    return name === null || name === undefined ? null : String(name);
  }
  return null;
}

export function toStandardCoupaFields(
  record: Record<string, unknown>,
  module: CoupaModule
): StandardCoupaFields {
  const supplier = record['supplier'];
  const contract = record['contract'];

  const fields: StandardCoupaFields = {
    id: record['id'] ?? null,
    supplier_id:
      readNestedId(supplier) ??
      record['supplier-id'] ??
      record['supplier_id'] ??
      null,
    supplier_name:
      readNestedName(supplier) ??
      record['supplier-name'] ??
      record['supplier_name'] ??
      null,
    po_number: null,
    po_status: null,
    total_amount: null,
    contract_id:
      readNestedId(contract) ??
      record['contract-id'] ??
      record['contract_id'] ??
      null,
  };

  if (module === 'purchase_orders') {
    fields.po_number =
      record['po-number'] ??
      record['po_number'] ??
      record['number'] ??
      null;
    fields.po_status = record['status'] ?? null;
    fields.total_amount = record['total'] ?? null;
  } else if (module === 'suppliers') {
    fields.supplier_id = record['id'] ?? null;
    fields.supplier_name =
      record['name'] ?? record['display-name'] ?? record['display_name'] ?? null;
    fields.po_status = record['status'] ?? null;
  } else if (module === 'contracts') {
    fields.contract_id = record['id'] ?? null;
    fields.po_status = record['status'] ?? null;
    fields.total_amount =
      record['total'] ?? record['contract-amount'] ?? record['contract_amount'] ?? null;
  }

  return fields;
}

export function formatCoupaOutput(
  record: Record<string, unknown>,
  module: CoupaModule
): Record<string, unknown> {
  const standard = toStandardCoupaFields(record, module);
  const flat = flattenRecord(record);
  return { ...flat, ...standard };
}

export function formatCoupaOutputs(
  records: Record<string, unknown>[],
  module: CoupaModule
): Record<string, unknown>[] {
  return records.map((record) => formatCoupaOutput(record, module));
}

export function parseJsonBody(body: unknown): unknown {
  if (body === undefined || body === null || body === '') {
    return {};
  }
  if (typeof body === 'object') {
    return body;
  }
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return body;
}

export function formatCoupaError(error: unknown): string {
  const err = error as {
    message?: string;
    response?: { status?: number; body?: unknown };
  };
  const status = err.response?.status;
  const body = err.response?.body;
  if (typeof body === 'string') {
    return `Coupa API error${status ? ` (${status})` : ''}: ${body}`;
  }
  if (body && typeof body === 'object') {
    return `Coupa API error${status ? ` (${status})` : ''}: ${JSON.stringify(body)}`;
  }
  return `Coupa API error${status ? ` (${status})` : ''}: ${err.message ?? 'Unknown error'}`;
}

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  csv: 'text/csv',
  txt: 'text/plain',
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

export function getMimeType(filename: string, extension?: string): string {
  const ext = (extension ?? filename.split('.').pop() ?? '')
    .toLowerCase()
    .replace(/^\./, '');
  return MIME_TYPES_BY_EXTENSION[ext] ?? 'application/octet-stream';
}

export type CoupaModule = 'purchase_orders' | 'suppliers' | 'contracts';

export type StandardCoupaFields = {
  id: unknown;
  supplier_id: unknown;
  supplier_name: unknown;
  po_number: unknown;
  po_status: unknown;
  total_amount: unknown;
  contract_id: unknown;
};
