import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.search.brave.com/res/v1';
const REQUEST_TIMEOUT_MS = 30000;
const FRESHNESS_RANGE = /^\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString({ source, key }: { source: unknown; key: string }): string | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber({ source, key }: { source: unknown; key: string }): number | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

function readBoolean({ source, key }: { source: unknown; key: string }): boolean | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  return typeof value === 'boolean' ? value : undefined;
}

function readRecord({ source, key }: { source: unknown; key: string }): Record<string, unknown> | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  return isRecord(value) ? value : undefined;
}

function readArray({ source, key }: { source: unknown; key: string }): unknown[] {
  if (!isRecord(source)) {
    return [];
  }
  const value = source[key];
  return Array.isArray(value) ? value : [];
}

function readStrings({ source, key }: { source: unknown; key: string }): string[] {
  return readArray({ source, key }).filter((item): item is string => typeof item === 'string');
}

function buildQuery(values: Record<string, string | number | boolean | null | undefined>): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        query[key] = trimmed;
      }
      continue;
    }
    query[key] = String(value);
  }
  return query;
}

function resolveInteger({
  value,
  label,
  min,
  max,
  defaultValue,
}: {
  value: number | null | undefined;
  label: string;
  min: number;
  max: number;
  defaultValue?: number;
}): number | undefined {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return defaultValue;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}. You entered ${value}.`);
  }
  return value;
}

function validateQuery({ query, maxChars, maxWords }: { query: string | null | undefined; maxChars: number; maxWords: number }): string {
  const trimmed = (query ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error('Query cannot be empty.');
  }
  if (trimmed.length > maxChars) {
    throw new Error(`Query is too long: Brave allows at most ${maxChars} characters (you sent ${trimmed.length}).`);
  }
  const words = trimmed.split(/\s+/).length;
  if (words > maxWords) {
    throw new Error(`Query is too long: Brave allows at most ${maxWords} words (you sent ${words}).`);
  }
  return trimmed;
}

function resolveFreshness({ preset, customRange }: { preset: string | null | undefined; customRange: string | null | undefined }): string | undefined {
  const range = (customRange ?? '').trim();
  if (range.length > 0) {
    if (!FRESHNESS_RANGE.test(range)) {
      throw new Error('Custom date range must look like YYYY-MM-DDtoYYYY-MM-DD, for example 2024-01-01to2024-03-31.');
    }
    return range;
  }
  const value = (preset ?? '').trim();
  if (value.length === 0) {
    return undefined;
  }
  if (['pd', 'pw', 'pm', 'py'].includes(value) || FRESHNESS_RANGE.test(value)) {
    return value;
  }
  throw new Error(`Freshness must be pd, pw, pm, py or a range YYYY-MM-DDtoYYYY-MM-DD. You entered "${value}".`);
}

function resolveChoice({ value, allowed, label, defaultValue }: { value: string | null | undefined; allowed: string[]; label: string; defaultValue?: string }): string | undefined {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    return defaultValue;
  }
  if (!allowed.includes(trimmed)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}. You entered "${trimmed}".`);
  }
  return trimmed;
}

function vendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    try {
      return vendorMessage(JSON.parse(body));
    } catch {
      return body.length > 0 ? body.slice(0, 300) : undefined;
    }
  }
  const error = readRecord({ source: body, key: 'error' });
  return readString({ source: error, key: 'detail' }) ?? readString({ source: body, key: 'message' });
}

function isApiKeyDetail({ detail }: { detail: string | undefined }): boolean {
  return detail !== undefined && /api key/i.test(detail);
}

function describeStatus({ status, detail }: { status: number; detail: string | undefined }): string {
  const suffix = detail ? ` Brave said: ${detail}` : '';
  if (status === 401 || (status === 422 && isApiKeyDetail({ detail }))) {
    return `the API key is invalid or revoked. Copy a key from https://api-dashboard.search.brave.com and reconnect.${suffix}`;
  }
  if (status === 403) {
    return `your Brave Search API plan does not include this endpoint, or the key is not allowed to use it.${suffix}`;
  }
  if (status === 422) {
    return `Brave rejected one of the inputs (status 422).${suffix}`;
  }
  if (status === 429) {
    return `rate limit reached or your monthly credit is used up (status 429). Wait a moment or check usage in the Brave API dashboard.${suffix}`;
  }
  return `Brave returned status ${status}.${suffix}`;
}

async function get<T>({
  apiKey,
  path,
  query,
  operation,
}: {
  apiKey: string;
  path: string;
  query: Record<string, string>;
  operation: string;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.GET,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-Subscription-Token': apiKey.trim(),
        Accept: 'application/json',
      },
      queryParams: query,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      throw new BraveSearchApiError({
        message: `Brave Search ${operation} failed: ${describeStatus({ status, detail: vendorMessage(error.response.body) })}`,
        status,
        responseBody: error.response.body,
      });
    }
    const reason = error instanceof Error ? error.message : 'unknown network error';
    throw new Error(`Brave Search ${operation} failed: could not reach the Brave Search API (${reason}). Check the connection and try again.`);
  }
}

function moreResultsAvailable(body: unknown): boolean {
  return readBoolean({ source: readRecord({ source: body, key: 'query' }), key: 'more_results_available' }) ?? false;
}

function normalizeWeb(body: unknown): NormalizedWebSearch {
  const queryInfo = readRecord({ source: body, key: 'query' });
  return {
    query: readString({ source: queryInfo, key: 'altered' }) ?? readString({ source: queryInfo, key: 'original' }) ?? '',
    more_results_available: moreResultsAvailable(body),
    results: readArray({ source: readRecord({ source: body, key: 'web' }), key: 'results' }).map((item) => ({
      title: readString({ source: item, key: 'title' }) ?? '',
      url: readString({ source: item, key: 'url' }) ?? '',
      description: readString({ source: item, key: 'description' }) ?? '',
      age: readString({ source: item, key: 'age' }) ?? null,
      extra_snippets: readStrings({ source: item, key: 'extra_snippets' }),
    })),
  };
}

function normalizeNews(body: unknown): NormalizedNewsSearch {
  return {
    more_results_available: moreResultsAvailable(body),
    results: readArray({ source: body, key: 'results' }).map((item) => {
      const metaUrl = readRecord({ source: item, key: 'meta_url' });
      return {
        title: readString({ source: item, key: 'title' }) ?? '',
        url: readString({ source: item, key: 'url' }) ?? '',
        description: readString({ source: item, key: 'description' }) ?? '',
        age: readString({ source: item, key: 'age' }) ?? null,
        page_age: readString({ source: item, key: 'page_age' }) ?? null,
        source: readString({ source: metaUrl, key: 'hostname' }) ?? readString({ source: metaUrl, key: 'netloc' }) ?? null,
        breaking: readBoolean({ source: item, key: 'breaking' }) ?? false,
        thumbnail_url: readString({ source: readRecord({ source: item, key: 'thumbnail' }), key: 'src' }) ?? null,
        extra_snippets: readStrings({ source: item, key: 'extra_snippets' }),
      };
    }),
  };
}

function normalizeImages(body: unknown): NormalizedImageSearch {
  const results = readArray({ source: body, key: 'results' }).map((item) => {
    const properties = readRecord({ source: item, key: 'properties' });
    return {
      title: readString({ source: item, key: 'title' }) ?? '',
      url: readString({ source: item, key: 'url' }) ?? '',
      source: readString({ source: item, key: 'source' }) ?? null,
      image_url: readString({ source: properties, key: 'url' }) ?? null,
      thumbnail_url: readString({ source: readRecord({ source: item, key: 'thumbnail' }), key: 'src' }) ?? null,
      width: readNumber({ source: properties, key: 'width' }) ?? null,
      height: readNumber({ source: properties, key: 'height' }) ?? null,
      confidence: readString({ source: item, key: 'confidence' }) ?? null,
    };
  });
  return {
    count: results.length,
    might_be_offensive: readBoolean({ source: readRecord({ source: body, key: 'extra' }), key: 'might_be_offensive' }) ?? false,
    results,
  };
}

function normalizeVideos(body: unknown): NormalizedVideoSearch {
  return {
    more_results_available: moreResultsAvailable(body),
    results: readArray({ source: body, key: 'results' }).map((item) => {
      const video = readRecord({ source: item, key: 'video' });
      return {
        title: readString({ source: item, key: 'title' }) ?? '',
        url: readString({ source: item, key: 'url' }) ?? '',
        description: readString({ source: item, key: 'description' }) ?? '',
        age: readString({ source: item, key: 'age' }) ?? null,
        duration: readString({ source: video, key: 'duration' }) ?? null,
        creator: readString({ source: video, key: 'creator' }) ?? null,
        publisher: readString({ source: video, key: 'publisher' }) ?? null,
        thumbnail_url: readString({ source: readRecord({ source: item, key: 'thumbnail' }), key: 'src' }) ?? null,
      };
    }),
  };
}

function normalizeLlmContext(body: unknown): NormalizedLlmContext {
  const sources = readRecord({ source: body, key: 'sources' }) ?? {};
  return {
    results: readArray({ source: readRecord({ source: body, key: 'grounding' }), key: 'generic' }).map((item) => {
      const url = readString({ source: item, key: 'url' }) ?? '';
      const meta = sources[url];
      return {
        url,
        title: readString({ source: item, key: 'title' }) ?? readString({ source: meta, key: 'title' }) ?? '',
        hostname: readString({ source: meta, key: 'hostname' }) ?? null,
        age: readStrings({ source: meta, key: 'age' }),
        snippets: readStrings({ source: item, key: 'snippets' }),
      };
    }),
  };
}

class BraveSearchApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'BraveSearchApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const braveApi = {
  get,
  buildQuery,
  resolveInteger,
  validateQuery,
  resolveFreshness,
  resolveChoice,
};

export const braveNormalize = {
  web: normalizeWeb,
  news: normalizeNews,
  images: normalizeImages,
  videos: normalizeVideos,
  llmContext: normalizeLlmContext,
};

export { BraveSearchApiError };

export type NormalizedWebSearch = {
  query: string;
  more_results_available: boolean;
  results: { title: string; url: string; description: string; age: string | null; extra_snippets: string[] }[];
};

export type NormalizedNewsSearch = {
  more_results_available: boolean;
  results: {
    title: string;
    url: string;
    description: string;
    age: string | null;
    page_age: string | null;
    source: string | null;
    breaking: boolean;
    thumbnail_url: string | null;
    extra_snippets: string[];
  }[];
};

export type NormalizedImageSearch = {
  count: number;
  might_be_offensive: boolean;
  results: {
    title: string;
    url: string;
    source: string | null;
    image_url: string | null;
    thumbnail_url: string | null;
    width: number | null;
    height: number | null;
    confidence: string | null;
  }[];
};

export type NormalizedVideoSearch = {
  more_results_available: boolean;
  results: {
    title: string;
    url: string;
    description: string;
    age: string | null;
    duration: string | null;
    creator: string | null;
    publisher: string | null;
    thumbnail_url: string | null;
  }[];
};

export type NormalizedLlmContext = {
  results: { url: string; title: string; hostname: string | null; age: string[]; snippets: string[] }[];
};

