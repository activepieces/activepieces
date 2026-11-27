import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';

async function send<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${CLORO_API_URL}${path}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
      body,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.body;
  } catch (e) {
    if (e instanceof HttpError) {
      const detail = errorDetail(e.response.body);
      if (detail) {
        throw new CloroApiError({ status: e.response.status, detail });
      }
    }
    throw e;
  }
}

async function monitor({
  apiKey,
  path,
  body,
}: {
  apiKey: string;
  path: string;
  body: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const response = await send<unknown>({
    apiKey,
    method: HttpMethod.POST,
    path,
    body,
  });
  const result = isRecord(response) && response['success'] === true ? response['result'] : undefined;
  if (!isRecord(result)) {
    throw new Error(`cloro ${path} returned no result.`);
  }
  return result;
}

function organicResults({
  items,
  maxResults,
}: {
  items: unknown;
  maxResults: number | undefined;
}): OrganicResult[] {
  const rows = Array.isArray(items) ? items.filter(isRecord) : [];
  return rows
    .filter((row) => isDirectLink(row['link']))
    .slice(0, clampResults(maxResults))
    .map((row) => ({
      position: typeof row['position'] === 'number' ? row['position'] : null,
      title: text(row['title']),
      url: text(row['link']),
      displayed_link: text(row['displayedLink']) || null,
      snippet: text(row['snippet']) || null,
      date: text(row['date']) || null,
    }));
}

function clampResults(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return MAX_RESULTS;
  }
  return Math.min(MAX_RESULTS, Math.max(1, Math.floor(value)));
}

function isDirectLink(url: unknown): url is string {
  if (!isAbsoluteHttpUrl(url)) {
    return false;
  }
  const parsed = parseUrl(url);
  if (parsed === undefined) {
    return false;
  }
  return !(GOOGLE_HOST.test(parsed.hostname) && GOOGLE_REDIRECT_PATH.test(parsed.pathname));
}

function assertCloroUrl(url: unknown): void {
  if (!isAbsoluteHttpUrl(url)) {
    return;
  }
  if (parseUrl(url)?.origin !== CLORO_API_URL) {
    throw new Error(
      `Custom API Call only sends your cloro API key to ${CLORO_API_URL}. Use a path such as /v1/credits, or a full URL on that host.`
    );
  }
}

function isAbsoluteHttpUrl(url: unknown): url is string {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function encodedPromptLength(prompt: string): number {
  return encodeURIComponent(prompt.trim()).replace(/%20/g, '+').length;
}

function sources(items: unknown): CloroSource[] {
  const list = Array.isArray(items) ? items.filter(isRecord) : [];
  return list.reduce<CloroSource[]>((acc, item) => {
    const url = item['url'];
    if (!isDirectLink(url) || acc.some((source) => source.url === url)) {
      return acc;
    }
    return [...acc, { title: text(item['label']), url }];
  }, []);
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function errorDetail(body: unknown): string | undefined {
  const error = isRecord(body) ? body['error'] : undefined;
  if (!isRecord(error)) {
    return undefined;
  }
  const parts = [text(error['code']), text(error['message'])].filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

class CloroApiError extends Error {
  readonly status: number;

  constructor({ status, detail }: { status: number; detail: string }) {
    super(`cloro returned HTTP ${status}: ${detail}`);
    this.name = 'CloroApiError';
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 180000;
const MAX_RESULTS = 10;
const GOOGLE_HOST = /^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/;
const GOOGLE_REDIRECT_PATH = /^\/(goto|search)(\/|$)/;

export const CLORO_API_URL = 'https://api.cloro.dev';
export const BING_PROMPT_LIMIT = 3500;
export const cloroApi = {
  send,
  monitor,
  organicResults,
  isDirectLink,
  assertCloroUrl,
  isRecord,
  text,
  encodedPromptLength,
  sources,
  countryName,
};
export { CloroApiError };

export type CloroSource = { title: string; url: string };
export type OrganicResult = {
  position: number | null;
  title: string;
  url: string;
  displayed_link: string | null;
  snippet: string | null;
  date: string | null;
};
