import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { NUTSHELL_BASE_URL } from './constants';

export type NutshellAuthValue = {
  username: string;
  password: string;
};

export type JsonPatchOperation = {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy';
  path: string;
  value?: unknown;
};

type QueryValue = string | number | boolean | undefined | null;

/**
 * Builds a Nutshell-style query string. Keys are passed through verbatim so callers
 * can use Nutshell's bracket notation directly (e.g. `page[limit]`, `filter[name]`).
 */
function buildQueryString(query?: Record<string, QueryValue>): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params.set(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

function extractErrorMessage(error: unknown): string {
  const httpError = error as {
    response?: { status?: number; body?: unknown };
    message?: string;
  };
  const body = httpError?.response?.body as
    | { message?: string; error?: string; errors?: { title?: string; detail?: string }[] }
    | undefined;
  const status = httpError?.response?.status;
  const detail =
    body?.message ??
    body?.error ??
    body?.errors?.[0]?.detail ??
    body?.errors?.[0]?.title ??
    (body ? JSON.stringify(body) : undefined) ??
    httpError?.message ??
    'Unknown error';
  return status ? `Nutshell API request failed (HTTP ${status}): ${detail}` : `Nutshell API request failed: ${detail}`;
}

export async function nutshellApiCall<T = Record<string, unknown>>({
  auth,
  method,
  resourceUri,
  query,
  body,
  contentType,
}: {
  auth: NutshellAuthValue;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  contentType?: string;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${NUTSHELL_BASE_URL}${resourceUri}${buildQueryString(query)}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.username,
        password: auth.password,
      },
      headers: {
        'Content-Type': contentType ?? 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

/**
 * Nutshell's update endpoints (`PATCH /leads/{id}`, `/contacts/{id}`, `/accounts/{id}`)
 * take a JSON Patch (RFC 6902) document and respond 204 No Content.
 */
export async function nutshellPatch({
  auth,
  resourceUri,
  operations,
}: {
  auth: NutshellAuthValue;
  resourceUri: string;
  operations: JsonPatchOperation[];
}): Promise<void> {
  await nutshellApiCall({
    auth,
    method: HttpMethod.PATCH,
    resourceUri,
    body: operations,
    contentType: 'application/json-patch+json',
  });
}

/**
 * Nutshell wraps single-entity responses in the same pluralized array as list
 * responses (e.g. creating one lead still returns `{ "leads": [ ... ] }`).
 * This pulls out the first (and only) entity, falling back to the raw response
 * if the API ever returns an unwrapped object.
 */
export function unwrapFirst<T>(response: unknown, pluralKey: string): T {
  const record = response as Record<string, unknown> | undefined;
  const collection = record?.[pluralKey];
  if (Array.isArray(collection)) {
    return collection[0] as T;
  }
  return response as T;
}
