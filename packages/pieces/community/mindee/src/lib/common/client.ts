import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const MINDEE_V2_BASE_URL = 'https://api-v2.mindee.net';
export const MINDEE_V1_BASE_URL = 'https://api.mindee.net/v1';

const V2_HOST = 'api-v2.mindee.net';
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_DETAIL = 500;

export type MindeeQuery = Record<string, string | number | boolean | undefined | null>;

export class MindeeApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'MindeeApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeApiKey(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/^(token|bearer)\s+/i, '').trim();
  if (trimmed.length === 0) {
    throw new Error('Enter your Mindee API key.');
  }
  return trimmed;
}

export function encodeId({ id, label }: { id: string | undefined; label: string }): string {
  const trimmed = (id ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(trimmed);
}

let verifiedTlsAgent: Promise<unknown> | undefined;

export function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export function buildV2Url({ path, query }: { path: string; query?: MindeeQuery }): string {
  if (
    !path.startsWith('/v2/') ||
    path.includes('?') ||
    path.includes('#') ||
    path.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call Mindee with an unexpected path: ${path}`);
  }
  const url = new URL(MINDEE_V2_BASE_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function v2PathFromUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Mindee returned an invalid URL: ${raw.slice(0, 200)}`);
  }
  if (url.protocol !== 'https:' || url.host !== V2_HOST || !url.pathname.startsWith('/v2/')) {
    throw new Error(`Mindee returned a URL outside ${V2_HOST}; refusing to send the API key there.`);
  }
  return url.pathname;
}

export async function mindeeV2Request<T>({
  apiKey,
  method,
  path,
  query,
  body,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: MindeeQuery;
  body?: unknown;
  timeoutMs?: number;
}): Promise<{ status: number; body: T }> {
  const request: HttpRequest = {
    method,
    url: buildV2Url({ path, query }),
    headers: {
      Authorization: normalizeApiKey(apiKey),
      Accept: 'application/json',
    },
    body,
    followRedirects: false,
    redactBodyInErrors: true,
    timeout: timeoutMs,
  };
  try {
    const response = await httpClient.sendRequest<T>(request, { dispatcher: await verifiedTls() });
    if (response.status >= 300) {
      throw buildMindeeError({ status: response.status, responseBody: response.body, api: 'v2' });
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    const mapped = toMindeeError({ error, api: 'v2' });
    if (mapped !== undefined) {
      throw mapped;
    }
    if (error instanceof Error) {
      throw new Error(`Could not reach Mindee: ${error.message}`);
    }
    throw error;
  }
}

export function toMindeeError({ error, api }: { error: unknown; api: 'v1' | 'v2' }): MindeeApiError | undefined {
  if (error instanceof MindeeApiError) {
    return error;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return buildMindeeError({ status: response['status'], responseBody: response['body'], api });
}

export function buildMindeeError({ status, responseBody, api }: { status: number; responseBody: unknown; api: 'v1' | 'v2' }): MindeeApiError {
  const detail = vendorDetail(responseBody);
  const suffix = detail === undefined ? '' : ` Mindee said: ${detail}`;
  return new MindeeApiError({ message: `${statusMessage({ status, api })}${suffix}`, status, responseBody });
}

function statusMessage({ status, api }: { status: number; api: 'v1' | 'v2' }): string {
  if (status === 401 || status === 403) {
    return api === 'v2'
      ? 'Mindee rejected the API key for the v2 API. If this is a legacy v1 key from platform.mindee.com, create a new API key at app.mindee.com, or use the "Predict Document (Legacy v1)" action.'
      : 'Mindee rejected the API key for the legacy v1 API. Keys created at app.mindee.com only work with the v2 actions.';
  }
  if (status === 404) {
    return 'Mindee could not find that resource. Check the ID.';
  }
  if (status === 402) {
    return 'Mindee refused the request because of your plan (subscription inactive or no page credits left). Check billing at app.mindee.com.';
  }
  if (status === 422 || status === 400) {
    return 'Mindee rejected the request.';
  }
  if (status === 429) {
    return 'Mindee rate limit or page quota reached. Wait and try again, or check your plan usage.';
  }
  if (status >= 500) {
    return `Mindee had a server error (HTTP ${status}). Try again later.`;
  }
  return `Mindee request failed with HTTP ${status}.`;
}

export function vendorDetail(responseBody: unknown): string | undefined {
  let parsed = responseBody;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed.startsWith('<') ? undefined : trimmed.slice(0, MAX_DETAIL);
    }
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const apiRequest = parsed['api_request'];
  if (isRecord(apiRequest) && isRecord(apiRequest['error'])) {
    const v1Error = apiRequest['error'];
    const parts = [v1Error['message'], v1Error['details']].filter((part): part is string => typeof part === 'string');
    return parts.length > 0 ? parts.join(': ').slice(0, MAX_DETAIL) : undefined;
  }
  const parts: string[] = [];
  if (typeof parsed['detail'] === 'string') {
    parts.push(parsed['detail']);
  } else if (typeof parsed['title'] === 'string') {
    parts.push(parsed['title']);
  }
  const errors = parsed['errors'];
  if (Array.isArray(errors)) {
    for (const item of errors.filter(isRecord)) {
      const pointer = typeof item['pointer'] === 'string' ? `${item['pointer']}: ` : '';
      if (typeof item['detail'] === 'string') {
        parts.push(`${pointer}${item['detail']}`);
      }
    }
  }
  return parts.length > 0 ? parts.join(' ').slice(0, MAX_DETAIL) : undefined;
}

export async function detectKeyType(apiKey: string): Promise<'v2' | 'v1' | 'invalid'> {
  try {
    await mindeeV2Request({ apiKey, method: HttpMethod.GET, path: '/v2/search/models', query: { per_page: 1 } });
    return 'v2';
  } catch (error) {
    const mapped = toMindeeError({ error, api: 'v2' });
    if (mapped === undefined || (mapped.status !== 401 && mapped.status !== 403)) {
      throw error;
    }
  }
  return (await isV1Key(apiKey)) ? 'v1' : 'invalid';
}

async function isV1Key(apiKey: string): Promise<boolean> {
  try {
    await httpClient.sendRequest(
      {
        method: HttpMethod.GET,
        url: `${MINDEE_V1_BASE_URL}/products/mindee/invoices/v4/documents/queue/00000000-0000-0000-0000-000000000000`,
        headers: { Authorization: `Token ${normalizeApiKey(apiKey)}`, Accept: 'application/json' },
        followRedirects: false,
        redactBodyInErrors: true,
        timeout: 20_000,
      },
      { dispatcher: await verifiedTls() },
    );
    return true;
  } catch (error) {
    const mapped = toMindeeError({ error, api: 'v1' });
    return mapped !== undefined && mapped.status !== 401 && mapped.status !== 403;
  }
}
