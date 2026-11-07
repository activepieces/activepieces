import { httpClient, HttpError, HttpMessageBody, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

export class LeexiApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'LeexiApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function buildQueryString(query: LeexiQuery | undefined): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== '') {
          params.append(`${key}[]`, item);
        }
      }
      continue;
    }
    params.append(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function buildPath(segments: string[]): string {
  return '/' + segments.map((segment) => encodeURIComponent(segment)).join('/');
}

function extractVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim() !== '') {
    return body.slice(0, 500);
  }
  if (body !== null && typeof body === 'object') {
    for (const key of ['message', 'error', 'errors']) {
      const value: unknown = Reflect.get(body, key);
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('; ');
      }
    }
  }
  return undefined;
}

function describeError({ status, body }: { status: number; body: unknown }): string {
  const vendorMessage = extractVendorMessage(body);
  const suffix = vendorMessage ? ` Leexi said: ${vendorMessage}` : '';
  switch (status) {
    case 401:
      return `Leexi rejected the API key (401). Check the Key ID and Key Secret.${suffix}`;
    case 403:
      return `Leexi denied access (403). The API key may be missing the required permission scope (e.g. read_calls, read_meeting_events, write_meeting_events) or the user lacks a license.${suffix}`;
    case 404:
      return `Leexi resource not found (404). It may not exist or be outside the API key's call access scope.${suffix}`;
    case 409:
      return `Leexi reported a conflict (409).${suffix}`;
    case 422:
      return `Leexi could not process the request (422).${suffix}`;
    case 429:
      return `Leexi rate limit exceeded (429, 50 requests/min). Retry later.${suffix}`;
    default:
      return `Leexi request failed with status ${status}.${suffix}`;
  }
}

async function request<T>({ auth, method, path, query, body }: LeexiRequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: BASE_URL + buildPath(path) + buildQueryString(query),
      headers: {
        Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
        Accept: 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      throw new LeexiApiError({
        message: describeError({ status, body: error.response.body }),
        status,
        responseBody: error.response.body,
      });
    }
    throw error;
  }
}

export const leexiApi = {
  request,
  describeError,
  buildQueryString,
};

export type LeexiQuery = Record<string, string | number | boolean | string[] | undefined | null>;

export type LeexiAuthValue = {
  username: string;
  password: string;
};

export type LeexiRequestParams = {
  auth: LeexiAuthValue;
  method: HttpMethod;
  path: string[];
  query?: LeexiQuery;
  body?: HttpMessageBody;
};
