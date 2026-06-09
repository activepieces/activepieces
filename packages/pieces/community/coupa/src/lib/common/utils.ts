const MAX_FLATTEN_DEPTH = 4;

export function normalizeInstanceUrl(instanceUrl: string): string {
  return instanceUrl
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
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

  if (!isRecord(value)) {
    return prefix ? { [prefix]: value } : { value };
  }

  if (depth >= MAX_FLATTEN_DEPTH) {
    return prefix ? { [prefix]: JSON.stringify(value) } : {};
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}_${key.replace(/-/g, '_')}` : key.replace(/-/g, '_');
    Object.assign(result, flattenRecord(nested, nextKey, depth + 1));
  }
  return result;
}

export function flattenRecords(records: unknown[]): Record<string, unknown>[] {
  return records.map((record) => flattenRecord(record));
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
    try {
      return JSON.parse(body);
    } catch {
      throw new Error('Request Body must be valid JSON.');
    }
  }
  return body;
}

export function formatCoupaError(error: unknown): string {
  const response = isRecord(error) ? error['response'] : undefined;
  let status: number | undefined;
  let body: unknown;
  if (isRecord(response)) {
    const statusValue = response['status'];
    status = typeof statusValue === 'number' ? statusValue : undefined;
    body = response['body'];
  }
  const suffix = status ? ` (${status})` : '';
  if (typeof body === 'string') {
    return `Coupa API error${suffix}: ${body}`;
  }
  if (body !== null && typeof body === 'object') {
    return `Coupa API error${suffix}: ${JSON.stringify(body)}`;
  }
  const message =
    isRecord(error) && typeof error['message'] === 'string'
      ? error['message']
      : 'Unknown error';
  return `Coupa API error${suffix}: ${message}`;
}

export function getMimeType(filename: string, extension?: string): string {
  const ext = (extension ?? filename.split('.').pop() ?? '')
    .toLowerCase()
    .replace(/^\./, '');
  return MIME_TYPES_BY_EXTENSION[ext] ?? 'application/octet-stream';
}

function readNestedId(value: unknown): number | string | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = value['id'];
  if (typeof id === 'number' || typeof id === 'string') {
    return id;
  }
  return null;
}

function readNestedName(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }
  const name = value['name'];
  if (name === null || name === undefined) {
    return null;
  }
  return String(name);
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
