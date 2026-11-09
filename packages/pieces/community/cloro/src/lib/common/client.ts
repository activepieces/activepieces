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
        throw new Error(`cloro returned HTTP ${e.response.status}: ${detail}`);
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

function isDirectLink(url: unknown): url is string {
  return (
    typeof url === 'string' &&
    /^https?:\/\//.test(url) &&
    !url.includes('google.com/goto') &&
    !url.includes('google.com/search')
  );
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

const REQUEST_TIMEOUT_MS = 180000;

export const CLORO_API_URL = 'https://api.cloro.dev';
export const BING_PROMPT_LIMIT = 3500;
export const cloroApi = {
  send,
  monitor,
  isDirectLink,
  isRecord,
  text,
  encodedPromptLength,
  sources,
  countryName,
};

export type CloroSource = { title: string; url: string };
