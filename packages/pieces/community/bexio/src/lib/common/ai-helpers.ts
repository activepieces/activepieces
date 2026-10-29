import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { FilesService, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { Readable } from 'node:stream';
import { BexioClient } from './client';
import { bexioCommon } from './index';

async function request<T>({
  auth,
  method,
  path,
  body,
  query,
}: {
  auth: BexioAuthValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
}): Promise<T> {
  return new BexioClient(auth).makeRequest<T>(method, path, body, query);
}

function pathId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d+$/.test(text) || Number(text) <= 0) {
    throw new Error(`${label} must be a positive numeric Bexio ID; got "${String(value ?? '')}".`);
  }
  return text;
}

function toInteger({ value, label }: { value: unknown; label: string }): number {
  return Number(pathId({ value, label }));
}

function listQuery({
  limit,
  offset,
  orderBy,
  extra,
}: {
  limit: unknown;
  offset: unknown;
  orderBy?: unknown;
  extra?: Record<string, string | undefined>;
}): { query: Record<string, string>; limit: number; offset: number } {
  const size = readWholeNumber({ value: limit, label: 'Limit', fallback: DEFAULT_LIMIT });
  if (size < 1 || size > MAX_LIMIT) {
    throw new Error(`Limit must be between 1 and ${MAX_LIMIT}; got ${size}.`);
  }
  const skip = readWholeNumber({ value: offset, label: 'Offset', fallback: 0 });
  const query: Record<string, string> = { limit: String(size), offset: String(skip) };
  const order = typeof orderBy === 'string' ? orderBy.trim() : '';
  if (order !== '') {
    query['order_by'] = order;
  }
  for (const [key, entry] of Object.entries(extra ?? {})) {
    if (entry !== undefined && entry !== '') {
      query[key] = entry;
    }
  }
  return { query, limit: size, offset: skip };
}

function readWholeNumber({ value, label, fallback }: { value: unknown; label: string; fallback: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a whole number of 0 or more; got "${String(value)}".`);
  }
  return parsed;
}

function listResult<T>({ items, limit, offset }: { items: T[]; limit: number; offset: number }): BexioListOutput<T> {
  const hasMore = items.length >= limit;
  return {
    items,
    count: items.length,
    offset,
    has_more: hasMore,
    next_offset: hasMore ? offset + items.length : null,
  };
}

async function list<T>({
  auth,
  path,
  limit,
  offset,
  orderBy,
  extra,
}: {
  auth: BexioAuthValue;
  path: string;
  limit: unknown;
  offset: unknown;
  orderBy?: unknown;
  extra?: Record<string, string | undefined>;
}): Promise<BexioListOutput<T>> {
  const page = listQuery({ limit, offset, orderBy, extra });
  const items = await request<T[]>({ auth, method: HttpMethod.GET, path, query: page.query });
  return listResult({ items: Array.isArray(items) ? items : [], limit: page.limit, offset: page.offset });
}

async function listAll<T>({ auth, path }: { auth: BexioAuthValue; path: string }): Promise<BexioListAll<T>> {
  const pages = Array.from({ length: DROPDOWN_MAX_PAGES }, (_, index) => index);
  const collected: T[] = [];
  let lastFull = false;
  for (const page of pages) {
    const items = await request<T[]>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { limit: String(MAX_LIMIT), offset: String(page * MAX_LIMIT), order_by: 'id_desc' },
    });
    const batch = Array.isArray(items) ? items : [];
    collected.push(...batch);
    lastFull = batch.length === MAX_LIMIT;
    if (!lastFull) {
      break;
    }
  }
  return { items: collected, truncated: lastFull };
}

function truncatedPlaceholder({ count }: { count: number }): string {
  return `Showing the first ${count}; type an ID instead to pick an older one.`;
}

async function search<T>({
  auth,
  path,
  criteria,
  limit,
  offset,
  orderBy,
  extra,
}: {
  auth: BexioAuthValue;
  path: string;
  criteria: BexioSearchCriterion[];
  limit: unknown;
  offset: unknown;
  orderBy?: unknown;
  extra?: Record<string, string | undefined>;
}): Promise<BexioListOutput<T>> {
  const page = listQuery({ limit, offset, orderBy, extra });
  const items = await request<T[]>({ auth, method: HttpMethod.POST, path, body: criteria, query: page.query });
  return listResult({ items: Array.isArray(items) ? items : [], limit: page.limit, offset: page.offset });
}

function searchCriteria({ values }: { values: Record<string, unknown> }): BexioSearchCriterion[] {
  const criteria: BexioSearchCriterion[] = [];
  for (const suffix of ['', '_2']) {
    const field = readText(values[`field${suffix}`]);
    const operator = readText(values[`criteria${suffix}`]) ?? 'like';
    const value = readText(values[`value${suffix}`]);
    if (field === undefined) {
      if (suffix === '') {
        throw new Error('Field is required.');
      }
      continue;
    }
    if (!SEARCH_OPERATORS.includes(operator)) {
      throw new Error(`Criteria must be one of ${SEARCH_OPERATORS.join(', ')}; got "${operator}".`);
    }
    const needsValue = operator !== 'is_null' && operator !== 'not_null';
    if (needsValue && value === undefined) {
      throw new Error(`Value is required for the "${field}" criterion.`);
    }
    if (operator === 'in' || operator === 'not_in') {
      const parts = (value ?? '').split(',').map((part) => part.trim()).filter((part) => part !== '');
      if (parts.length === 0) {
        throw new Error(`Value is required for the "${field}" criterion.`);
      }
      criteria.push({ field, value: parts, criteria: operator });
    } else {
      criteria.push({ field, value: value ?? '', criteria: operator });
    }
  }
  return criteria;
}

function readText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function buildBody({
  values,
  fields,
}: {
  values: Record<string, unknown>;
  fields: Record<string, BexioFieldKind>;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(fields)) {
    const converted = convertField({ value: values[key], kind, key });
    if (converted !== undefined) {
      body[key] = converted;
    }
  }
  return body;
}

function convertField({ value, kind, key }: { value: unknown; kind: BexioFieldKind; key: string }): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string' && value.trim() === '' && kind !== 'text') {
    return undefined;
  }
  switch (kind) {
    case 'text':
      return value === '' ? undefined : String(value);
    case 'id':
      return toInteger({ value, label: key });
    case 'number': {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new Error(`${key} must be a number; got "${String(value)}".`);
      }
      return parsed;
    }
    case 'decimal': {
      const text = String(value).trim();
      if (!/^-?\d+(\.\d+)?$/.test(text)) {
        throw new Error(`${key} must be a decimal number such as 12.50; got "${text}".`);
      }
      return text;
    }
    case 'flag':
      return toFlag({ value, key });
    case 'idCsv': {
      const parts = String(value).split(',').map((part) => part.trim()).filter((part) => part !== '');
      return parts.map((part) => pathId({ value: part, label: key })).join(',');
    }
    case 'json':
      return parseJson({ value, key });
  }
}

function toFlag({ value, key }: { value: unknown; key: string }): boolean | undefined {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  throw new Error(`${key} must be "yes" or "no"; got "${String(value)}".`);
}

function parseJson({ value, key }: { value: unknown; key: string }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${key} must be valid JSON.`);
  }
}

function requireArray({ value, key }: { value: unknown; key: string }): unknown[] {
  const parsed = parseJson({ value, key });
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${key} must be a non-empty JSON array.`);
  }
  for (const [index, entry] of parsed.entries()) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error(`${key} entry ${index + 1} must be a JSON object.`);
    }
  }
  return parsed;
}

async function sourcePositions({
  auth,
  value,
  sourcePath,
}: {
  auth: BexioAuthValue;
  value: unknown;
  sourcePath: string;
}): Promise<unknown[]> {
  if (value !== undefined && value !== null && value !== '') {
    return requireArray({ value, key: 'positions' });
  }
  const source = await request<{ positions?: unknown }>({ auth, method: HttpMethod.GET, path: sourcePath });
  const positions = Array.isArray(source.positions) ? source.positions : [];
  const mapped = positions.flatMap((position) => toPositionRef(position));
  if (mapped.length === 0) {
    throw new Error('The source document has no positions to carry over.');
  }
  return mapped;
}

function toPositionRef(position: unknown): Record<string, unknown>[] {
  if (typeof position !== 'object' || position === null || !('id' in position) || !('type' in position)) {
    return [];
  }
  const ref: Record<string, unknown> = { id: position.id, type: position.type };
  const amount = 'amount' in position ? Number(position.amount) : Number.NaN;
  if (Number.isFinite(amount)) {
    ref['amount'] = amount;
  }
  return [ref];
}

function requireNetworkLink({ message }: { message: unknown }): void {
  if (typeof message !== 'string' || !message.includes('[Network Link]')) {
    throw new Error('Message must contain the placeholder [Network Link].');
  }
}

function requireAny(body: Record<string, unknown>): Record<string, unknown> {
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  return body;
}

async function fillRequired({
  auth,
  getPath,
  body,
  required,
}: {
  auth: BexioAuthValue;
  getPath: string;
  body: Record<string, unknown>;
  required: string[];
}): Promise<Record<string, unknown>> {
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  const missing = required.filter((key) => body[key] === undefined);
  if (missing.length === 0) {
    return body;
  }
  const current = await request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: getPath });
  const merged: Record<string, unknown> = {};
  for (const key of missing) {
    if (current[key] !== undefined && current[key] !== null) {
      merged[key] = current[key];
    }
  }
  return { ...merged, ...body };
}

async function writePdf({
  files,
  pdf,
  fallbackName,
}: {
  files: FilesService;
  pdf: BexioPdf;
  fallbackName: string;
}): Promise<BexioPdfOutput> {
  if (typeof pdf.content !== 'string' || pdf.content === '') {
    throw new Error('Bexio returned the PDF without any content.');
  }
  const fileName = pdf.name || fallbackName;
  const data = Buffer.from(pdf.content, 'base64');
  const file = await files.write({ fileName, data });
  return {
    file,
    file_name: fileName,
    size: typeof pdf.size === 'number' ? pdf.size : data.length,
    mime_type: pdf.mime || 'application/pdf',
  };
}

async function uploadFile({
  auth,
  data,
  filename,
}: {
  auth: BexioAuthValue;
  data: Buffer;
  filename: string;
}): Promise<unknown> {
  const form = new FormData();
  form.append('file', data, filename);
  const response = await httpClient.sendRequest<unknown>({
    url: `${bexioCommon.baseUrl}/3.0/files`,
    method: HttpMethod.POST,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
    headers: { Accept: 'application/json', ...form.getHeaders() },
    body: form,
  });
  return response.body;
}

async function downloadFile({ auth, fileId }: { auth: BexioAuthValue; fileId: string }): Promise<Buffer> {
  const response = await httpClient.sendRequest<Readable>({
    url: `${bexioCommon.baseUrl}/3.0/files/${fileId}/download`,
    method: HttpMethod.GET,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
    headers: { Accept: '*/*' },
    responseType: 'stream',
    timeout: DOWNLOAD_TIMEOUT_MS,
  });
  const header = response.headers?.['content-length'];
  const declared = Number(Array.isArray(header) ? header[0] : header);
  if (Number.isFinite(declared) && declared > MAX_FILE_BYTES) {
    response.body.destroy();
    throw new Error(`The file is larger than the ${MAX_FILE_BYTES / 1024 / 1024} MB download limit.`);
  }
  return readCapped(response.body);
}

function readCapped(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (error) {
        stream.destroy();
        reject(error);
      } else {
        resolve(Buffer.concat(chunks, total));
      }
    };
    const timer = setTimeout(
      () => finish(new Error(`The file download did not finish within ${DOWNLOAD_TIMEOUT_MS / 1000} seconds.`)),
      DOWNLOAD_TIMEOUT_MS,
    );
    stream.on('data', (chunk: Buffer | string) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      total += buffer.length;
      if (total > MAX_FILE_BYTES) {
        finish(new Error(`The file is larger than the ${MAX_FILE_BYTES / 1024 / 1024} MB download limit.`));
        return;
      }
      chunks.push(buffer);
    });
    stream.on('end', () => finish());
    stream.on('error', (error) => finish(error));
  });
}

function timesheetTracking({
  type,
  date,
  duration,
  start,
  end,
}: {
  type: unknown;
  date: unknown;
  duration: unknown;
  start: unknown;
  end: unknown;
}): Record<string, string> {
  if (type === 'duration') {
    const day = readText(date);
    const time = readText(duration);
    if (day === undefined || time === undefined || !/^\d{1,3}:[0-5]\d$/.test(time)) {
      throw new Error('Tracking type "duration" needs a Date (YYYY-MM-DD) and a Duration as HH:MM.');
    }
    return { type: 'duration', date: day, duration: time };
  }
  if (type === 'range') {
    const from = readText(start);
    const to = readText(end);
    if (from === undefined || to === undefined) {
      throw new Error('Tracking type "range" needs Start and End (YYYY-MM-DD HH:MM:SS).');
    }
    return { type: 'range', start: from, end: to };
  }
  throw new Error('Tracking Type must be "duration" or "range".');
}

function idProp({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

function flagProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string>({
    displayName,
    description: `${description} Leave empty to keep the current value.`,
    required: false,
    options: { disabled: false, options: FLAG_OPTIONS },
  });
}

function listProps({ orderByHint }: { orderByHint?: string }) {
  return {
    limit: Property.Number({
      displayName: 'Limit',
      description: `Maximum number of records to return, 1 to ${MAX_LIMIT}. Defaults to ${DEFAULT_LIMIT}.`,
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip. Use next_offset from the previous page to continue.',
      required: false,
    }),
    ...(orderByHint
      ? {
          order_by: Property.ShortText({
            displayName: 'Order By',
            description: orderByHint,
            required: false,
          }),
        }
      : {}),
  };
}

function searchProps({ fieldsHint }: { fieldsHint: string }) {
  const criteriaOptions = SEARCH_OPERATORS.map((operator) => ({ label: operator, value: operator }));
  return {
    field: Property.ShortText({
      displayName: 'Field',
      description: `Field to filter on. Supported: ${fieldsHint}.`,
      required: true,
    }),
    criteria: Property.StaticDropdown<string>({
      displayName: 'Criteria',
      description: 'Comparison operator. Defaults to "like" (contains). For "in"/"not_in" pass comma-separated values.',
      required: false,
      options: { disabled: false, options: criteriaOptions },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Value to compare with. Not needed for is_null/not_null.',
      required: false,
    }),
    field_2: Property.ShortText({
      displayName: 'Second Field',
      description: 'Optional second field; both criteria must match.',
      required: false,
    }),
    criteria_2: Property.StaticDropdown<string>({
      displayName: 'Second Criteria',
      description: 'Operator for the second field. Defaults to "like".',
      required: false,
      options: { disabled: false, options: criteriaOptions },
    }),
    value_2: Property.ShortText({
      displayName: 'Second Value',
      description: 'Value for the second field.',
      required: false,
    }),
  };
}

export const bexioAi = {
  request,
  pathId,
  toInteger,
  listQuery,
  listResult,
  list,
  listAll,
  truncatedPlaceholder,
  search,
  searchCriteria,
  buildBody,
  toFlag,
  requireArray,
  fillRequired,
  sourcePositions,
  requireAny,
  requireNetworkLink,
  writePdf,
  uploadFile,
  downloadFile,
  timesheetTracking,
  idProp,
  flagProp,
  listProps,
  searchProps,
};

export const SEARCH_OPERATORS = ['like', 'not_like', '=', '!=', '>', '>=', '<', '<=', 'is_null', 'not_null', 'in', 'not_in'];
export const FLAG_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];
export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 2000;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const DOWNLOAD_TIMEOUT_MS = 120000;
export const DROPDOWN_MAX_PAGES = 10;

export type BexioAuthValue = { access_token: string };
export type BexioFieldKind = 'text' | 'id' | 'number' | 'decimal' | 'flag' | 'idCsv' | 'json';
export type BexioSearchCriterion = { field: string; value: string | string[]; criteria: string };
export type BexioListOutput<T> = {
  items: T[];
  count: number;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
};
export type BexioPdf = { name?: string; size?: number; mime?: string; content?: string };
export type BexioPdfOutput = { file: string; file_name: string; size: number; mime_type: string };
export type BexioListAll<T> = { items: T[]; truncated: boolean };
