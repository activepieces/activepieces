import {
  HttpHeaders,
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { OutputSchema } from '@activepieces/pieces-framework';
import { CARBONE_API_URL, CARBONE_VERSION } from './constants';

const DEFAULT_TIMEOUT_MS = 30000;
const RENDER_TIMEOUT_MS = 120000;
const MAX_MESSAGE_LENGTH = 500;

const fileOutputFields: OutputSchema['fields'] = [
  { key: 'filename', label: 'File Name' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'sizeBytes', label: 'Size', format: 'filesize' },
  { key: 'file', label: 'File', format: 'url' },
];

const templateOutputFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Template ID' },
  { key: 'versionId', label: 'Version ID' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'comment', label: 'Comment' },
  { key: 'tags', label: 'Tags' },
  { key: 'type', label: 'File Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'createdAt', label: 'Created At (Unix)', format: 'number' },
  { key: 'deployedAt', label: 'Deployed At (Unix)', format: 'number' },
  { key: 'expireAt', label: 'Expire At (Unix)', format: 'number' },
  { key: 'origin', label: 'Origin', format: 'number' },
];

export class CarboneApiError extends Error {
  readonly httpStatus: number;
  constructor({ message, httpStatus }: { message: string; httpStatus: number }) {
    super(message);
    this.name = 'CarboneApiError';
    this.httpStatus = httpStatus;
  }
}

export const carboneClient = {
  request,
  saveFileResponse,
  buildRenderBody,
  parseConvertTo,
  parseFilename,
  readVendorMessage,
  requireJsonData,
  readId,
  isRecord,
  RENDER_TIMEOUT_MS,
};

export const carboneOutputFields = {
  file: fileOutputFields,
  template: templateOutputFields,
};

async function request<T>({
  apiKey,
  method,
  path,
  operation,
  queryParams,
  body,
  headers,
  responseType,
  timeoutMs,
}: CarboneRequestParams): Promise<HttpResponse<T>> {
  let response: HttpResponse<T>;
  try {
    response = await httpClient.sendRequest<T>({
      method,
      url: `${CARBONE_API_URL}${path}`,
      headers: {
        ...buildHeaders({ apiKey }),
        Accept: responseType === 'arraybuffer' ? '*/*' : 'application/json',
        ...headers,
      },
      queryParams,
      body,
      responseType,
      timeout: timeoutMs ?? DEFAULT_TIMEOUT_MS,
      redactBodyInErrors: true,
    });
  } catch (error) {
    throw toCarboneError({ error, operation, method });
  }
  const envelope = readEnvelope({ body: response.body, headers: response.headers, responseType });
  if (isRecord(envelope) && envelope['success'] === false) {
    const statusLabel = response.status >= 400 ? ` (${response.status})` : '';
    throw new CarboneApiError({
      message: `Carbone ${operation} failed${statusLabel}: ${readVendorMessage(envelope)}`,
      httpStatus: response.status,
    });
  }
  return response;
}

function readEnvelope({
  body,
  headers,
  responseType,
}: {
  body: unknown;
  headers: HttpHeaders | undefined;
  responseType: CarboneRequestParams['responseType'];
}): unknown {
  if (responseType !== 'arraybuffer') {
    return body;
  }
  const contentType = readHeader({ headers, name: 'content-type' }) ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return undefined;
  }
  const text = Buffer.isBuffer(body)
    ? body.toString('utf8')
    : body instanceof ArrayBuffer
      ? Buffer.from(body).toString('utf8')
      : String(body);
  return tryParseJson(text);
}

function buildHeaders({ apiKey }: { apiKey: string }): HttpHeaders {
  return {
    Authorization: `Bearer ${apiKey.trim()}`,
    'carbone-version': CARBONE_VERSION,
  };
}

function toCarboneError({
  error,
  operation,
  method,
}: {
  error: unknown;
  operation: string;
  method: HttpMethod;
}): CarboneApiError {
  const response = readHttpErrorResponse(error);
  if (response) {
    return new CarboneApiError({
      message: `Carbone ${operation} failed (${response.status}): ${readVendorMessage(response.body)}`,
      httpStatus: response.status,
    });
  }
  const reason = error instanceof Error ? error.message : String(error);
  const mayHaveApplied =
    method === HttpMethod.GET
      ? ''
      : ' The request may still have been applied on Carbone; check before retrying.';
  return new CarboneApiError({
    message: `Carbone ${operation} failed: network error or timeout (${reason}).${mayHaveApplied}`,
    httpStatus: 0,
  });
}

function readHttpErrorResponse(
  error: unknown
): { status: number; body: unknown } | null {
  if (!isRecord(error) || !('response' in error)) {
    return null;
  }
  const response = error['response'];
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return null;
  }
  return { status: response['status'], body: response['body'] };
}

function readVendorMessage(body: unknown): string {
  if (body === undefined || body === null || body === '') {
    return 'no error message returned';
  }
  if (typeof body === 'string') {
    const parsed = tryParseJson(body);
    if (parsed !== undefined && isRecord(parsed)) {
      return readVendorMessage(parsed);
    }
    if (typeof parsed === 'string' && parsed.length > 0) {
      return parsed.slice(0, MAX_MESSAGE_LENGTH);
    }
    return body.slice(0, MAX_MESSAGE_LENGTH);
  }
  if (Buffer.isBuffer(body)) {
    return readVendorMessage(body.toString('utf8'));
  }
  if (isRecord(body)) {
    const error = body['error'];
    if (typeof error === 'string' && error.length > 0) {
      return error.slice(0, MAX_MESSAGE_LENGTH);
    }
    const message = body['message'];
    if (typeof message === 'string' && message.length > 0) {
      return message.slice(0, MAX_MESSAGE_LENGTH);
    }
    return JSON.stringify(body).slice(0, MAX_MESSAGE_LENGTH);
  }
  return String(body).slice(0, MAX_MESSAGE_LENGTH);
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFilename({
  contentDisposition,
  fallback,
}: {
  contentDisposition: string | string[] | undefined;
  fallback: string;
}): string {
  const header = Array.isArray(contentDisposition)
    ? contentDisposition[0] ?? ''
    : contentDisposition ?? '';
  const extended = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(header);
  if (extended) {
    try {
      return sanitizeFilename({ name: decodeURIComponent(extended[2].trim()), fallback });
    } catch {
      return sanitizeFilename({ name: extended[2].trim(), fallback });
    }
  }
  const quoted = /filename\s*=\s*"([^"]*)"/i.exec(header);
  if (quoted) {
    return sanitizeFilename({ name: quoted[1], fallback });
  }
  const plain = /filename\s*=\s*([^;]+)/i.exec(header);
  if (plain) {
    return sanitizeFilename({ name: plain[1].trim(), fallback });
  }
  return fallback;
}

function sanitizeFilename({ name, fallback }: { name: string; fallback: string }): string {
  const base = name.split(/[\\/]/).pop()?.trim() ?? '';
  return base.length > 0 && base !== '.' && base !== '..' ? base : fallback;
}

function readHeader({
  headers,
  name,
}: {
  headers: HttpHeaders | undefined;
  name: string;
}): string | undefined {
  if (!headers) {
    return undefined;
  }
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

async function saveFileResponse({
  response,
  fallbackName,
  writeFile,
}: {
  response: HttpResponse<Buffer>;
  fallbackName: string;
  writeFile: (params: { fileName: string; data: Buffer }) => Promise<string>;
}): Promise<CarboneFileResult> {
  const data = Buffer.from(response.body);
  const filename = parseFilename({
    contentDisposition: readHeader({ headers: response.headers, name: 'content-disposition' }),
    fallback: fallbackName,
  });
  const contentType =
    readHeader({ headers: response.headers, name: 'content-type' }) ?? 'application/octet-stream';
  const file = await writeFile({ fileName: filename, data });
  return { filename, contentType, sizeBytes: data.length, file };
}

function parseConvertTo(
  convertTo: string | undefined
): string | Record<string, unknown> | undefined {
  if (convertTo === undefined) {
    return undefined;
  }
  const trimmed = convertTo.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!trimmed.startsWith('{')) {
    return trimmed;
  }
  const parsed = tryParseJson(trimmed);
  if (!isRecord(parsed) || typeof parsed['formatName'] !== 'string') {
    throw new Error(
      'Convert To must be a format such as "pdf", or a JSON object with a "formatName" string, for example {"formatName":"pdf","formatOptions":{"Watermark":"Draft"}}.'
    );
  }
  return parsed;
}

function buildRenderBody(options: CarboneRenderOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    data: options.data,
    lang: nonEmpty(options.lang) ?? 'en-us',
    timezone: nonEmpty(options.timezone) ?? 'UTC',
  };
  const convertTo = parseConvertTo(options.convertTo);
  if (convertTo !== undefined) body['convertTo'] = convertTo;
  const converter = nonEmpty(options.converter);
  if (converter !== undefined) body['converter'] = converter;
  const reportName = nonEmpty(options.reportName);
  if (reportName !== undefined) body['reportName'] = reportName;
  if (options.complement !== undefined && options.complement !== null) {
    body['complement'] = options.complement;
  }
  const currencySource = nonEmpty(options.currencySource);
  if (currencySource !== undefined) body['currencySource'] = currencySource;
  const currencyTarget = nonEmpty(options.currencyTarget);
  if (currencyTarget !== undefined) body['currencyTarget'] = currencyTarget;
  if (options.currencyRates !== undefined && options.currencyRates !== null) {
    body['currencyRates'] = options.currencyRates;
  }
  return body;
}

function nonEmpty(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireJsonData({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): Record<string, unknown> | unknown[] {
  const parsed = typeof value === 'string' ? tryParseJson(value) : value;
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (!isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object or array.`);
  }
  return parsed;
}

function readId({ value, label }: { value: unknown; label: string }): string {
  const id = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  if (id.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return id;
}

export type CarboneRequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  queryParams?: Record<string, string>;
  body?: unknown;
  headers?: HttpHeaders;
  responseType?: 'json' | 'arraybuffer';
  timeoutMs?: number;
};

export type CarboneRenderOptions = {
  data: Record<string, unknown> | unknown[];
  convertTo?: string;
  converter?: string;
  lang?: string;
  timezone?: string;
  reportName?: string;
  complement?: unknown;
  currencySource?: string;
  currencyTarget?: string;
  currencyRates?: unknown;
};

export type CarboneFileResult = {
  filename: string;
  contentType: string;
  sizeBytes: number;
  file: string;
};

export type CarboneTemplate = {
  id: string | null;
  versionId: string;
  deployedAt: number;
  createdAt: number;
  expireAt: number;
  size: number;
  type: string;
  name: string;
  category: string;
  comment: string;
  tags: string[];
  origin: number;
};

export type CarboneListResponse<T> = {
  success: boolean;
  data: T[];
  hasMore?: boolean;
  nextCursor?: string;
  error?: string;
};
