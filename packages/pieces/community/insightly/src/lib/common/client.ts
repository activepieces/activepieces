import { AuthenticationType, HttpError, httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

class InsightlyError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody?: unknown }) {
    super(message);
    this.name = 'InsightlyError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function toId({ value, label }: { value: unknown; label: string }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{1,18}$/.test(text)) {
    throw new InsightlyError({ message: `${label} must be a numeric Insightly ID.`, status: 400 });
  }
  return Number(text);
}

function normalizePod(pod: unknown): string | null {
  const text = optionalText(pod);
  if (text === undefined) {
    return null;
  }
  const lower = text.toLowerCase();
  if (!/^[a-z]{2,4}\d{1,3}$/.test(lower)) {
    throw new InsightlyError({ message: 'Pod must look like "na1", "eu1" or "au1".', status: 400 });
  }
  return lower;
}

function vendorMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim() !== '') {
    return body.slice(0, 300);
  }
  if (isRecord(body)) {
    const message = readString(body['Message']) ?? readString(body['message']) ?? readString(body['error']);
    if (message) {
      return message.slice(0, 300);
    }
  }
  return null;
}

function toInsightlyError(error: unknown): InsightlyError {
  if (error instanceof InsightlyError) {
    return error;
  }
  if (error instanceof HttpError) {
    const { status, body } = error.response;
    const detail = vendorMessage(body);
    const hint = status === 401 ? ' Check the API key and pod.' : status === 404 ? ' Not found (the record or module may not exist on your Insightly plan).' : status === 429 ? ' Insightly rate limit reached; retry later.' : '';
    return new InsightlyError({
      message: `Insightly request failed with status ${status}${detail ? `: ${detail}` : '.'}${hint}`,
      status,
      responseBody: sanitize(body),
    });
  }
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new InsightlyError({ message: `Insightly request failed: ${message}`, status: 0 });
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }
  if (isRecord(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        continue;
      }
      result[key] = sanitize(inner);
    }
    return result;
  }
  return value;
}

function sanitizeRecord(value: unknown): Record<string, unknown> {
  const clean = sanitize(value);
  return isRecord(clean) ? clean : {};
}

async function request({ apiKey, pod, method, path, query, body }: RequestParams): Promise<unknown> {
  try {
    const response = await httpClient.sendRequest<unknown>({
      method,
      url: `https://api.${pod}.insightly.com/v3.1${path}`,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      authentication: { type: AuthenticationType.BASIC, username: apiKey, password: '' },
      queryParams: query,
      body,
      timeout: REQUEST_TIMEOUT_MS,
      redactBodyInErrors: true,
    });
    return response.body;
  } catch (error) {
    throw toInsightlyError(error);
  }
}

async function resolvePod({ apiKey, pod, requester = request }: { apiKey: string; pod?: unknown; requester?: Requester }): Promise<string> {
  const explicit = normalizePod(pod);
  if (explicit) {
    return explicit;
  }
  const cached = podCache.get(apiKey);
  if (cached) {
    return cached;
  }
  let lastStatus = 0;
  for (const candidate of POD_CANDIDATES) {
    try {
      await requester({ apiKey, pod: candidate, method: HttpMethod.GET, path: '/Instance' });
      podCache.set(apiKey, candidate);
      return candidate;
    } catch (error) {
      lastStatus = error instanceof InsightlyError ? error.status : 0;
    }
  }
  throw new InsightlyError({
    message: `Could not detect the Insightly pod for this API key (tried ${POD_CANDIDATES.join(', ')}). Check the API key, or set the Pod shown under User Settings > API.`,
    status: lastStatus === 0 ? 401 : lastStatus,
  });
}

async function paginate({ apiKey, pod, path, query, limit, pageSize = MAX_PAGE_SIZE, maxRecords = MAX_UNBOUNDED_RECORDS, requester = request }: PaginateParams): Promise<PageResult> {
  const records: Record<string, unknown>[] = [];
  const wanted = limit === undefined ? undefined : limit + 1;
  let skip = 0;
  for (;;) {
    const remaining = wanted === undefined ? pageSize : Math.min(pageSize, wanted - records.length);
    const page = toRecords(await requester({ apiKey, pod, method: HttpMethod.GET, path, query: { ...query, skip: String(skip), top: String(remaining) } }));
    records.push(...page);
    skip += page.length;
    if (page.length < remaining) {
      break;
    }
    if (wanted !== undefined && records.length >= wanted) {
      break;
    }
    if (wanted === undefined && records.length >= maxRecords) {
      throw new InsightlyError({
        message: `More than ${maxRecords} records in ${path}; refusing to continue without a limit.`,
        status: 413,
      });
    }
  }
  if (limit !== undefined && records.length > limit) {
    return { records: records.slice(0, limit), hasMore: true };
  }
  return { records, hasMore: false };
}

function clampLimit(value: unknown): number {
  const parsed = readNumber(value);
  if (parsed === null) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_PAGE_SIZE);
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function clearPodCache(): void {
  podCache.clear();
}

type RequestParams = {
  apiKey: string;
  pod: string;
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: Record<string, unknown> | Record<string, unknown>[];
};

type Requester = (params: RequestParams) => Promise<unknown>;

type PaginateParams = {
  apiKey: string;
  pod: string;
  path: string;
  query?: QueryParams;
  limit?: number;
  pageSize?: number;
  maxRecords?: number;
  requester?: Requester;
};

type PageResult = { records: Record<string, unknown>[]; hasMore: boolean };

const SECRET_KEY_PATTERN = /api_?key|token|secret|password/i;
const POD_CANDIDATES = ['na1', 'na2', 'eu1', 'au1'];
const REQUEST_TIMEOUT_MS = 30000;
const MAX_PAGE_SIZE = 500;
const DEFAULT_LIMIT = 25;
const MAX_UNBOUNDED_RECORDS = 50000;
const podCache = new Map<string, string>();

export const insightlyClient = {
  request,
  resolvePod,
  paginate,
};

export const insightlyUtils = {
  isRecord,
  toRecords,
  readString,
  readNumber,
  readBoolean,
  optionalText,
  toId,
  normalizePod,
  sanitize,
  sanitizeRecord,
  clampLimit,
  compact,
  toInsightlyError,
  clearPodCache,
};

export { InsightlyError };
export type { RequestParams, Requester, PageResult };
