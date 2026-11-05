import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const FIGMA_API_BASE = 'https://api.figma.com';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 300;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class FigmaApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly responseBody: unknown) {
    super(message);
    this.name = 'FigmaApiError';
  }
}

export type FigmaRateTier = 1 | 2 | 3;

type QueryValue = string | number | boolean | undefined | null;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function tokenOf(auth: unknown): string {
  const raw = isRecord(auth) ? auth['access_token'] : undefined;
  const token = typeof raw === 'string' ? raw.trim() : '';
  if (token === '') {
    throw new Error('The Figma connection has no access token. Reconnect your Figma account.');
  }
  return token;
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  if (text === '' || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function vendorMessage(body: unknown): string | undefined {
  if (isRecord(body)) {
    const message = body['err'] ?? body['message'];
    const reason = body['reason'];
    const parts = [message, reason].filter((part): part is string => typeof part === 'string' && part.trim() !== '').map((part) => part.trim());
    if (parts.length > 0) {
      return parts.join(': ').slice(0, MAX_ERROR_TEXT);
    }
  }
  if (typeof body === 'string' && body.trim() !== '') {
    return body.trim().slice(0, MAX_ERROR_TEXT);
  }
  return undefined;
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (!isRecord(headers)) return undefined;
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function rateLimitHint({ headers, tier }: { headers: unknown; tier: FigmaRateTier }): string {
  const retryAfter = Number(headerValue({ headers, name: 'retry-after' }));
  const planTier = headerValue({ headers, name: 'x-figma-plan-tier' });
  const limitType = headerValue({ headers, name: 'x-figma-rate-limit-type' });
  const wait = Number.isFinite(retryAfter) && retryAfter > 0
    ? `Figma asks to wait ${formatSeconds(retryAfter)} (Retry-After) before retrying.`
    : 'Wait for the time Figma sends in its Retry-After header (usually about a minute, much longer for monthly limits) before retrying.';
  const tierText = tier === 1
    ? 'This is a Tier 1 endpoint: View and Collab seats get as few as 20 calls per month, Dev and Full seats 10 to 20 per minute. Prefer Get File Metadata or a lower depth.'
    : tier === 2
      ? 'This is a Tier 2 endpoint: 5 calls per minute on View and Collab seats, 25 to 100 on Dev and Full seats.'
      : 'This is a Tier 3 endpoint: 10 calls per minute on View and Collab seats, 50 to 150 on Dev and Full seats.';
  const plan = planTier || limitType ? ` (plan tier: ${planTier ?? 'unknown'}, limit type: ${limitType ?? 'unknown'})` : '';
  return ` ${wait} ${tierText}${plan}`;
}

function formatSeconds(seconds: number): string {
  if (seconds < 120) return `${Math.ceil(seconds)} seconds`;
  if (seconds < 7200) return `${Math.ceil(seconds / 60)} minutes`;
  if (seconds < 172800) return `${Math.ceil(seconds / 3600)} hours`;
  return `${Math.ceil(seconds / 86400)} days`;
}

function hintFor({ status, scope, headers, tier }: { status: number; scope: string; headers: unknown; tier: FigmaRateTier }): string {
  if (status === 401) return ' The Figma token is invalid or expired. Reconnect your Figma account.';
  if (status === 403) return ` Figma refused access. If this step is new, reconnect the Figma connection so it grants the "${scope}" scope; otherwise the connected user has no access to this file, team or comment.`;
  if (status === 404) return ' Check the file key or ID; it does not exist or is not visible to the connected user.';
  if (status === 429) return rateLimitHint({ headers, tier });
  return '';
}

function failureOf(error: unknown): { status: number; body: unknown; headers: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'], headers: response['headers'] } : null;
}

function toApiError({ status, body, headers, scope, tier, operation }: { status: number; body: unknown; headers: unknown; scope: string; tier: FigmaRateTier; operation: string }): FigmaApiError {
  const vendor = vendorMessage(body);
  const hint = vendor !== undefined && /upgrade/i.test(vendor)
    ? ' This needs a paid Figma plan (webhooks need Professional or higher); the connected team is on a plan that does not allow it.'
    : hintFor({ status, scope, headers, tier });
  const message = `Figma could not ${operation} (${status})${vendor ? `: ${vendor}` : ''}.${hint}`;
  return new FigmaApiError(message, status, body);
}

async function request<T = unknown>({
  auth,
  method,
  path,
  query,
  body,
  redactBody,
  scope,
  tier,
  operation,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown>;
  redactBody?: boolean;
  scope: string;
  tier: FigmaRateTier;
  operation: string;
}): Promise<{ status: number; body: T }> {
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const headers: Record<string, string> = { Accept: 'application/json', Authorization: `Bearer ${tokenOf(auth)}` };
  if (hasBody) headers['Content-Type'] = 'application/json';
  const dispatcher = await verifiedTls();
  try {
    const response = await httpClient.sendRequest<T>(
      {
        method,
        url: `${FIGMA_API_BASE}${path}`,
        headers,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
        redactBodyInErrors: redactBody === true,
      },
      { dispatcher },
    );
    if (response.status >= 300) {
      throw new FigmaApiError(`Figma could not ${operation} (${response.status}): unexpected redirect.`, response.status, undefined);
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    const failure = failureOf(error);
    if (failure === null || error instanceof FigmaApiError) throw error;
    throw toApiError({ ...failure, scope, tier, operation });
  }
}

const FIGMA_HOSTS = new Set(['figma.com', 'www.figma.com']);
const FILE_PATH_KINDS = new Set(['file', 'design', 'board', 'proto', 'slides', 'deck', 'make', 'site', 'buzz']);
const KEY_PATTERN = /^[A-Za-z0-9]{1,128}$/;

export type ParsedFileKey = { fileKey: string; mainFileKey: string; branchKey?: string; nodeId?: string };

function parseFileKey(value: unknown): ParsedFileKey {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') {
    throw new Error('File Key is required. Paste the Figma file URL or the key from it.');
  }
  if (KEY_PATTERN.test(text)) {
    return { fileKey: text, mainFileKey: text };
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`"${text.slice(0, 100)}" is not a Figma file key or file URL.`);
  }
  const parts = url.pathname.split('/').filter((part) => part !== '');
  if (url.protocol !== 'https:' || !FIGMA_HOSTS.has(url.hostname.toLowerCase()) || url.username !== '' || url.password !== '' || parts.length < 2 || !FILE_PATH_KINDS.has(parts[0]) || !KEY_PATTERN.test(parts[1])) {
    throw new Error('The URL is not a Figma file URL. Use a link like https://www.figma.com/design/<file key>/<name>.');
  }
  const mainFileKey = parts[1];
  const branchKey = parts[2] === 'branch' && parts[3] !== undefined && KEY_PATTERN.test(parts[3]) ? parts[3] : undefined;
  const rawNode = url.searchParams.get('node-id');
  const nodeId = rawNode ? normalizeNodeId(rawNode) : undefined;
  return { fileKey: branchKey ?? mainFileKey, mainFileKey, ...(branchKey ? { branchKey } : {}), ...(nodeId ? { nodeId } : {}) };
}

function normalizeNodeId(value: string): string {
  const text = value.trim();
  return /^\d+-\d+$/.test(text) ? text.replace('-', ':') : text;
}

function nodeIds({ value, required }: { value: unknown; required: boolean }): string[] {
  const raw: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? [value] : value === undefined || value === null ? [] : [value];
  const ids = raw
    .flatMap((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).split(',') : []))
    .map((item) => normalizeNodeId(item))
    .filter((item) => item !== '');
  const unique = Array.from(new Set(ids));
  if (required && unique.length === 0) {
    throw new Error('Node IDs is required. Give at least one node ID like 1:2 (or 1-2 from a Figma URL).');
  }
  const invalid = unique.find((id) => !/^[A-Za-z0-9:;_-]{1,200}$/.test(id));
  if (invalid !== undefined) {
    throw new Error(`"${invalid.slice(0, 50)}" is not a valid Figma node ID. Use IDs like 1:2 or I1:2;3:4.`);
  }
  return unique;
}

function optionalInteger({ value, field, min, max }: { value: unknown; field: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN;
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${field} must be a whole number from ${min} to ${max}.`);
  }
  return number;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function cursorFromNextPage({ nextPage, param }: { nextPage: unknown; param: string }): string | null {
  if (typeof nextPage !== 'string' || nextPage.trim() === '') return null;
  let url: URL;
  try {
    url = new URL(nextPage, `${FIGMA_API_BASE}/`);
  } catch {
    return null;
  }
  if (url.origin !== FIGMA_API_BASE) return null;
  const value = url.searchParams.get(param);
  return value === null || value === '' ? null : value;
}

export const figmaClient = {
  request,
  segment,
  isRecord,
  parseFileKey,
  nodeIds,
  normalizeNodeId,
  optionalInteger,
  optionalText,
  cursorFromNextPage,
  verifiedTls,
};
