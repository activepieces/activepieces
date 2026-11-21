import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpRequest,
} from '@activepieces/pieces-common';

export async function bitlyApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
  operation,
}: BitlyApiCallParams): Promise<T> {
  const accessToken = auth.accessToken?.trim();
  if (!accessToken) {
    throw new Error('Bitly Access Token is required for authentication.');
  }

  const request: HttpRequest = {
    method,
    url: `${BITLY_BASE_URL}${resourceUri}${buildQueryString(query)}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
    timeout: REQUEST_TIMEOUT_MS,
  };

  const label = operation ?? `${method} ${resourceUri}`;
  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error) {
    throw toBitlyError({ error, operation: label, method });
  }
}

export function buildQueryString(query: BitlyQuery | undefined): string {
  if (!query) {
    return '';
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      const text = String(item);
      if (text === '') {
        continue;
      }
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`);
    }
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

export function toBitlyError({
  error,
  operation,
  method,
}: {
  error: unknown;
  operation: string;
  method: HttpMethod;
}): BitlyApiError {
  const status = readStatus(error);
  if (status === undefined) {
    const reason = error instanceof Error ? error.message : String(error);
    const mayHaveApplied =
      method === HttpMethod.GET
        ? ''
        : ' The request may still have been applied; check Bitly before retrying.';
    return new BitlyApiError({
      message: `Bitly ${operation} failed: could not reach Bitly (${reason}).${mayHaveApplied}`,
      statusCode: undefined,
      responseBody: undefined,
    });
  }
  const responseBody = readBody(error);
  const vendorText = extractVendorMessage(responseBody);
  const hint = STATUS_HINTS[status] ?? '';
  const detail = vendorText ? `: ${vendorText}` : '';
  return new BitlyApiError({
    message: `Bitly ${operation} failed (HTTP ${status})${detail}.${hint ? ` ${hint}` : ''}`,
    statusCode: status,
    responseBody,
  });
}

export function normalizeBitlinkId(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Bitlink ID is required, for example bit.ly/abc123.');
  }
  const withoutScheme = value.trim().replace(/^https?:\/\//i, '');
  const withoutSuffix = withoutScheme.split(/[?#]/)[0].replace(/\/+$/, '');
  const segments = withoutSuffix.split('/').filter((segment) => segment !== '');
  if (segments.length < 2) {
    throw new Error(
      `"${value}" is not a Bitlink ID. Use the domain and back-half, for example bit.ly/abc123.`
    );
  }
  return segments.join('/');
}

export function bitlinkPath(bitlinkId: string): string {
  return bitlinkId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function requireGuid({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required.`);
  }
  const guid = value.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(guid)) {
    throw new Error(`${label} "${guid}" is not a valid Bitly GUID.`);
  }
  return guid;
}

export async function resolveGroupGuid({
  auth,
  groupGuid,
}: {
  auth: BitlyAuthProps;
  groupGuid: unknown;
}): Promise<string> {
  if (typeof groupGuid === 'string' && groupGuid.trim() !== '') {
    return requireGuid({ value: groupGuid, label: 'Group GUID' });
  }
  const user = await bitlyApiCall<{ default_group_guid?: string }>({
    method: HttpMethod.GET,
    auth,
    resourceUri: '/user',
    operation: 'get user',
  });
  if (!user.default_group_guid) {
    throw new Error('No Group GUID was given and the Bitly account has no default group. Use List Groups to find one.');
  }
  return user.default_group_guid;
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return undefined;
  }
  return typeof response.status === 'number' ? response.status : undefined;
}

function readBody(error: unknown): unknown {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('body' in response)) {
    return undefined;
  }
  return response.body;
}

function extractVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed === '' ? undefined : trimmed.slice(0, 500);
  }
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const parts: string[] = [];
  if ('message' in body && typeof body.message === 'string' && body.message !== '') {
    parts.push(body.message);
  }
  if (
    'description' in body &&
    typeof body.description === 'string' &&
    body.description !== '' &&
    !parts.includes(body.description)
  ) {
    parts.push(body.description);
  }
  if ('errors' in body && Array.isArray(body.errors)) {
    for (const item of body.errors) {
      if (typeof item === 'object' && item !== null) {
        const field = 'field' in item && typeof item.field === 'string' ? item.field : undefined;
        const message = 'message' in item && typeof item.message === 'string' ? item.message : undefined;
        if (field || message) {
          parts.push([field, message].filter(Boolean).join(' '));
        }
      }
    }
  }
  return parts.length === 0 ? undefined : parts.join(' - ').replace(/\.+$/, '');
}

export class BitlyApiError extends Error {
  readonly statusCode: number | undefined;
  readonly responseBody: unknown;

  constructor({
    message,
    statusCode,
    responseBody,
  }: {
    message: string;
    statusCode: number | undefined;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'BitlyApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

const BITLY_BASE_URL = 'https://api-ssl.bitly.com/v4';
const REQUEST_TIMEOUT_MS = 30000;

const STATUS_HINTS: Record<number, string> = {
  401: 'Check the Access Token in your Bitly connection.',
  402: 'Your Bitly plan limit has been reached or the account is suspended.',
  403: 'The token has no permission for this resource or the feature needs a paid Bitly plan.',
  404: 'The Bitlink, group or QR code was not found; check the ID.',
  417: 'Accept the latest Bitly terms of service in the Bitly web app.',
  429: 'Bitly rate limit reached; wait before trying again.',
};

export type BitlyAuthProps = {
  accessToken: string;
};

export type BitlyQuery = Record<string, string | number | boolean | string[] | undefined | null>;

export type BitlyApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: BitlyQuery;
  body?: HttpMessageBody;
  auth: BitlyAuthProps;
  operation?: string;
};
