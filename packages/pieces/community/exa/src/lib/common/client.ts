import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.exa.ai';

export const exaApi = { call, statusOf, assertExaUrl, toError, bodyOf };

export const exaInput = {
  optionalInteger,
  optionalNumber,
  optionalText,
  optionalCountry,
  requiredId,
  stringList,
};

async function call<T>({
  apiKey,
  method,
  path,
  body,
  query,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: QueryParams;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      queryParams: query,
      body,
      followRedirects: false,
    });
    return bodyOf(response);
  } catch (error) {
    throw toError(error);
  }
}

function bodyOf<T>(response: { status: number; body: T }): T {
  if (response.status >= 300) {
    throw new ExaApiError({
      message: `Exa answered with a redirect (${response.status}), which is not followed so the API key stays on ${BASE_URL}.`,
      status: response.status,
    });
  }
  return response.body;
}

function toError(error: unknown): ExaApiError {
  if (error instanceof ExaApiError) {
    return error;
  }
  return new ExaApiError({
    message: errorMessageOf(error),
    status: responseOf(error)?.status,
  });
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const status: unknown = Reflect.get(error, 'status');
    if (typeof status === 'number') {
      return status;
    }
  }
  return responseOf(error)?.status;
}

function assertExaUrl(url: unknown): void {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
    return;
  }
  const parsed = parseUrl(url.trim());
  const allowed = new URL(BASE_URL);
  if (
    parsed === undefined ||
    parsed.protocol !== allowed.protocol ||
    parsed.hostname !== allowed.hostname ||
    parsed.port !== '' ||
    parsed.username !== '' ||
    parsed.password !== ''
  ) {
    throw new Error(
      `Custom API Call only sends your Exa API key to ${BASE_URL}. Use a path such as /search, or the HTTP piece for other hosts.`,
    );
  }
}

function optionalInteger({
  value,
  name,
  min,
  max,
}: {
  value: unknown;
  name: string;
  min: number;
  max: number;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be a whole number between ${min} and ${max}.`);
  }
  return parsed;
}

function optionalNumber({
  value,
  name,
  min,
  max,
}: {
  value: unknown;
  name: string;
  min: number;
  max: number;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}.`);
  }
  return parsed;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function optionalCountry({ value, name }: { value: unknown; name: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  if (!/^[A-Za-z]{2}$/.test(text)) {
    throw new Error(`${name} must be a two-letter country code, e.g. "US".`);
  }
  return text.toUpperCase();
}

function requiredId({ value, name }: { value: unknown; name: string }): string {
  const id = optionalText(value);
  if (id === undefined) {
    throw new Error(`${name} is required.`);
  }
  return id;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((item) => (typeof item === 'string' ? item : String(item ?? '')).trim())
    .filter((item) => item.length > 0);
  return items.length === 0 ? undefined : items;
}

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function responseOf(error: unknown): { status: number; body: unknown } | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return undefined;
  }
  const status: unknown = Reflect.get(response, 'status');
  if (typeof status !== 'number') {
    return undefined;
  }
  return { status, body: Reflect.get(response, 'body') };
}

function errorMessageOf(error: unknown): string {
  const response = responseOf(error);
  if (response === undefined) {
    return error instanceof Error ? error.message : String(error);
  }
  const detail = detailOf(response.body);
  const suffix = detail ? `: ${detail}` : '';
  switch (response.status) {
    case 401:
      return `Exa rejected the API key (401)${suffix}. Check the key in your Exa connection.`;
    case 402:
      return `Exa reports insufficient credits (402)${suffix}. Add credits in the Exa dashboard.`;
    case 403:
      return `Exa refused the request (403)${suffix}.`;
    case 404:
      return `Exa could not find that resource (404)${suffix}. Check the ID.`;
    case 429:
      return `Exa rate limit or concurrency limit reached (429)${suffix}. Wait and try again.`;
    default:
      return `Exa request failed (${response.status})${suffix}`;
  }
}

function detailOf(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return body.slice(0, 500);
  }
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const err: unknown = Reflect.get(body, 'error');
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err === 'object' && err !== null) {
    const message: unknown = Reflect.get(err, 'message');
    const code: unknown = Reflect.get(err, 'code');
    if (typeof message === 'string') {
      return typeof code === 'string' ? `${code} ${message}` : message;
    }
  }
  return undefined;
}

class ExaApiError extends Error {
  readonly status: number | undefined;
  constructor({ message, status }: { message: string; status: number | undefined }) {
    super(message);
    this.name = 'ExaApiError';
    this.status = status;
  }
}
