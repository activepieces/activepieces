import { createHash } from 'node:crypto';
import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

async function send<T>({
  apiKey,
  method,
  path,
  brand,
  body,
  queryParams,
  headers,
}: SendParams): Promise<HermosoResponse<T>> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${HERMOSO_API_URL}${path}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
      headers: { Accept: 'application/json', ...brandHeaders(brand), ...headers },
      body,
      queryParams,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return { status: response.status, body: response.body, headers: lowerCaseHeaders(response.headers) };
  } catch (e) {
    if (e instanceof HttpError) {
      throw toHermosoError({ status: e.response.status, body: e.response.body });
    }
    throw e;
  }
}

function brandHeaders(brand: string | undefined): Record<string, string> {
  const raw = (brand ?? '').trim();
  if (raw.length === 0) {
    return {};
  }
  const [user, owner] = raw.split(BRAND_SEPARATOR);
  return owner ? { 'X-Hermoso-User': user, 'X-Hermoso-Owner': owner } : { 'X-Hermoso-User': user };
}

function brandValue(row: Record<string, unknown>): string {
  const headers = isRecord(row['headers']) ? row['headers'] : {};
  const user = text(headers['X-Hermoso-User']) || text(row['id']);
  const owner = text(headers['X-Hermoso-Owner']);
  return owner ? `${user}${BRAND_SEPARATOR}${owner}` : user;
}

async function hostedUrl({
  apiKey,
  brand,
  url,
}: {
  apiKey: string;
  brand: string | undefined;
  url: string;
}): Promise<string> {
  if (isHermosoHosted(url)) {
    return url;
  }
  const response = await send<unknown>({
    apiKey,
    brand,
    method: HttpMethod.POST,
    path: '/media',
    queryParams: { url },
  });
  const stored = isRecord(response.body) ? text(response.body['url']) : '';
  if (!stored) {
    throw new Error(`Hermoso could not store the file at ${url}.`);
  }
  return stored;
}

async function getJob({
  apiKey,
  brand,
  jobId,
}: {
  apiKey: string;
  brand: string | undefined;
  jobId: string;
}): Promise<Record<string, unknown>> {
  const response = await send<unknown>({
    apiKey,
    brand,
    method: HttpMethod.GET,
    path: `/jobs/${encodeURIComponent(jobId.trim())}`,
  });
  return isRecord(response.body) ? response.body : {};
}

async function waitForJob({
  apiKey,
  brand,
  jobId,
  timeoutMs,
}: {
  apiKey: string;
  brand: string | undefined;
  jobId: string;
  timeoutMs: number;
}): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  let job = await getJob({ apiKey, brand, jobId });
  while (!isFinished(job) && Date.now() + POLL_INTERVAL_MS < deadline) {
    await sleep(POLL_INTERVAL_MS);
    job = await getJob({ apiKey, brand, jobId });
  }
  return job;
}

async function callTool({
  apiKey,
  brand,
  name,
  args,
  idempotencyKey,
}: {
  apiKey: string;
  brand: string | undefined;
  name: string;
  args: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<{ text: string; data: Record<string, unknown> }> {
  const response = await send<unknown>({
    apiKey,
    brand,
    method: HttpMethod.POST,
    path: `/tools/${name}`,
    body: compact(args),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  });
  const body = isRecord(response.body) ? response.body : {};
  return { text: text(body['text']), data: isRecord(body['data']) ? body['data'] : {} };
}

function flattenJob(job: Record<string, unknown>): FlatJob {
  const result = isRecord(job['result']) ? job['result'] : {};
  const id = text(job['id']) || text(job['job_id']);
  const url = text(job['url']) || text(result['video']) || text(result['image']) || null;
  const status = text(job['status']) || null;
  return {
    job_id: id || null,
    status,
    is_finished: status === 'done' || status === 'error',
    type: text(job['type']) || null,
    url,
    poster_url: text(job['poster_url']) || null,
    model: text(job['model']) || null,
    progress: typeof job['progress'] === 'number' ? job['progress'] : null,
    error_message: text(job['error_message']) || null,
    brand_id: text(job['brand_id']) || null,
    created_at: text(job['created_at']) || null,
    updated_at: text(job['updated_at']) || null,
  };
}

function isFinished(job: Record<string, unknown>): boolean {
  const status = text(job['status']);
  return status === 'done' || status === 'error';
}

function idempotencyKey({
  runId,
  stepName,
  operation,
  payload,
}: {
  runId: string;
  stepName: string;
  operation: string;
  payload: unknown;
}): string {
  const digest = createHash('sha256')
    .update(stableJson({ runId, stepName, operation, payload }))
    .digest('hex');
  return `activepieces-${digest.slice(0, 48)}`;
}

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      return !(Array.isArray(value) && value.length === 0);
    })
  );
}

function assertHermosoUrl(url: unknown): void {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return;
  }
  const origin = parseOrigin(url);
  if (origin !== new URL(HERMOSO_API_URL).origin) {
    throw new Error(
      `Custom API Call only sends your Hermoso API key to ${HERMOSO_API_URL}. Use a path such as /brands, or a full URL on that host.`
    );
  }
}

function parseOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isHermosoHosted(url: string): boolean {
  try {
    return HOSTED_DOMAINS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((item) => item.length > 0);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

function lowerCaseHeaders(headers: Record<string, string | string[] | undefined> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value) ? value.join(', ') : value ?? '',
    ])
  );
}

function toHermosoError({ status, body }: { status: number; body: unknown }): HermosoApiError {
  const parsed = typeof body === 'string' ? parseJson(body) : body;
  const envelope = isRecord(parsed) ? parsed : {};
  const error = isRecord(envelope['error']) ? envelope['error'] : {};
  const code = text(error['code']) || `http_${status}`;
  const message = text(error['message']) || `Hermoso answered with HTTP ${status}.`;
  const isConnectorError = text(error['connector']).length > 0 || text(error['type']) === 'connector_error';
  const requestId = text(envelope['request_id']);
  const suffix = requestId ? ` (request ${requestId})` : '';
  if (status === 401 && !isConnectorError) {
    return new HermosoApiError({
      status,
      code,
      message: 'Hermoso did not accept this API key. Create a new key in Hermoso under MCP & CLI, then update the connection.',
    });
  }
  if (code === 'brand_not_found') {
    return new HermosoApiError({
      status,
      code,
      message:
        'Hermoso could not find the chosen brand. It may have been deleted, or this API key may no longer have access to it. Pick the brand again, or leave Brand empty to use the brand the key is set to.',
    });
  }
  return new HermosoApiError({ status, code, message: `${message}${suffix}` });
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class HermosoApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor({ status, code, message }: { status: number; code: string; message: string }) {
    super(message);
    this.name = 'HermosoApiError';
    this.status = status;
    this.code = code;
  }
}

const REQUEST_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 5000;
const BRAND_SEPARATOR = '::';
const HOSTED_DOMAINS = ['assets.hermoso.ai', 'app.hermoso.ai'];

export const HERMOSO_API_URL = 'https://app.hermoso.ai/v1';
export const hermosoApi = {
  send,
  brandValue,
  hostedUrl,
  getJob,
  waitForJob,
  callTool,
  flattenJob,
  isFinished,
  idempotencyKey,
  assertHermosoUrl,
  compact,
  isRecord,
  text,
  textList,
};
export { HermosoApiError };

export type FlatJob = {
  job_id: string | null;
  status: string | null;
  is_finished: boolean;
  type: string | null;
  url: string | null;
  poster_url: string | null;
  model: string | null;
  progress: number | null;
  error_message: string | null;
  brand_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SendParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  brand?: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
  headers?: Record<string, string>;
};

type HermosoResponse<T> = {
  status: number;
  body: T;
  headers: Record<string, string>;
};
