export function assertModuleName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!MODULE_NAME.test(name)) {
    throw new Error(
      `Invalid module name "${String(value ?? '')}". Use the API name of the module, for example Contacts, Leads or Accounts (see List Modules).`
    );
  }
  return name;
}

export function assertRecordId({
  value,
  label = 'Record ID',
}: {
  value: unknown;
  label?: string;
}): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!RECORD_ID.test(id)) {
    throw new Error(
      `${label} "${String(value ?? '')}" is not a Vtiger webservice ID. IDs look like 12x345 (module prefix, "x", record number).`
    );
  }
  return id;
}

export function assertFieldName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!FIELD_NAME.test(name)) {
    throw new Error(
      `Invalid field name "${String(value ?? '')}". Use the field's API name from Describe Module, for example lastname or cf_853.`
    );
  }
  return name;
}

export function vtqlQuote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function filterValueToString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Filter value ${value} is not a finite number`);
    }
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  throw new Error('Filter values must be text, numbers or booleans');
}

export function buildWhere({ filters }: { filters: VtqlFilter[] }): string {
  if (filters.length === 0) {
    return '';
  }
  const clauses = filters.map(({ field, value, operator }) => {
    const name = assertFieldName(field);
    return operator === 'LIKE'
      ? `${name} LIKE ${vtqlQuote(`%${escapeLikePattern(value)}%`)}`
      : `${name} = ${vtqlQuote(value)}`;
  });
  return ` WHERE ${clauses.join(' AND ')}`;
}

export function clampLimit({
  value,
  fallback,
  max,
}: {
  value: unknown;
  fallback: number;
  max: number;
}): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw new Error(`Limit must be a whole number between 1 and ${max}`);
  }
  return Math.min(n, max);
}

export async function pagedQuery<R>({
  module,
  where,
  orderBy,
  limit,
  fetchPage,
}: {
  module: string;
  where: string;
  orderBy?: string;
  limit: number;
  fetchPage: (query: string) => Promise<R[]>;
}): Promise<{ records: R[]; hasMore: boolean }> {
  const name = assertModuleName(module);
  const order = orderBy ? ` ORDER BY ${assertFieldName(orderBy)}` : '';
  let records: R[] = [];
  let offset = 0;
  let lastPageFull = false;
  while (records.length < limit) {
    const size = Math.min(VTQL_PAGE_SIZE, limit - records.length);
    const page = await fetchPage(
      `SELECT * FROM ${name}${where}${order} LIMIT ${offset}, ${size};`
    );
    records = [...records, ...page.slice(0, size)];
    lastPageFull = page.length >= size;
    if (!lastPageFull) {
      break;
    }
    offset += size;
  }
  return { records, hasMore: lastPageFull && records.length >= limit };
}

const MODULE_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const RECORD_ID = /^\d+x\d+$/;
const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

export const VTQL_PAGE_SIZE = 100;

export type VtqlFilter = {
  field: string;
  value: string;
  operator: '=' | 'LIKE';
};
