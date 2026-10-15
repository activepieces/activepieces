import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export class VtigerApiError extends Error {
  readonly code: string;
  readonly status: number | undefined;

  constructor({
    code,
    message,
    status,
  }: {
    code: string;
    message: string;
    status?: number;
  }) {
    super(`${code}: ${message}`);
    this.name = 'VtigerApiError';
    this.code = code;
    this.status = status;
  }
}

let verifiedTlsAgent: Promise<unknown> | undefined;

export function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeInstanceUrl(raw: string): string {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(
      'The instance URL is not a valid URL. Use the form https://<instance>.od2.vtiger.com'
    );
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The instance URL must start with https:// or http://');
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error('The instance URL must not contain a username or password');
  }
  if (url.pathname.includes('restapi')) {
    throw new Error(
      'Enter the URL without the endpoint. For example https://<instance>.od2.vtiger.com instead of https://<instance>.od2.vtiger.com/restapi/v1/vtiger/default'
    );
  }
  if ((url.pathname !== '' && url.pathname !== '/') || url.search !== '' || url.hash !== '') {
    throw new Error(
      'The instance URL must not contain a path, query or fragment, for example https://<instance>.od2.vtiger.com'
    );
  }
  return url.origin;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

function ipv4Octets(host: string): number[] | undefined {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return undefined;
  }
  const octets = host.split('.').map((part) => Number(part));
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : undefined;
}

function isBlockedIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function mappedIpv4(host: string): number[] | undefined {
  const rest = host.slice('::ffff:'.length);
  const dotted = ipv4Octets(rest);
  if (dotted) {
    return dotted;
  }
  const groups = rest.split(':');
  if (groups.length !== 2 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
    return undefined;
  }
  const high = parseInt(groups[0], 16);
  const low = parseInt(groups[1], 16);
  return [high >> 8, high & 255, low >> 8, low & 255];
}

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost')) {
    return true;
  }
  const v4 = ipv4Octets(host);
  if (v4) {
    return isBlockedIpv4(v4);
  }
  if (!host.includes(':')) {
    return false;
  }
  if (host === '::' || host === '::1') {
    return true;
  }
  if (host.startsWith('::ffff:')) {
    const mapped = mappedIpv4(host);
    return mapped === undefined ? true : isBlockedIpv4(mapped);
  }
  return /^f[cd]/.test(host) || /^fe[89ab]/.test(host);
}

export function assertPublicInstanceUrl(raw: string): string {
  const origin = normalizeInstanceUrl(raw);
  if (isBlockedHost(new URL(origin).hostname)) {
    throw new Error(
      'The instance URL points to a private, loopback, link-local or metadata address, which is not allowed'
    );
  }
  return origin;
}

export function restBaseUrl(creds: VtigerCredentials): string {
  return `${normalizeInstanceUrl(creds.instance_url)}${REST_PATH}`;
}

export function basicAuthorization(creds: VtigerCredentials): string {
  return `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
}

function statusMessage(status: number): string {
  if (status === 401 || status === 403) {
    return 'Vtiger rejected the username or access key, or the user lacks permission for this operation';
  }
  if (status === 404) {
    return 'The Vtiger endpoint or record was not found';
  }
  if (status === 400) {
    return 'Vtiger rejected the request (HTTP 400). The record may not exist or may be deleted, or a module, relation label, field name or query is invalid';
  }
  if (status === 429) {
    return 'Vtiger rate limit reached; retry later';
  }
  return `Vtiger returned HTTP ${status}`;
}

export function envelopeError({
  body,
  status,
}: {
  body: unknown;
  status?: number;
}): VtigerApiError {
  const error = isRecord(body) && isRecord(body['error']) ? body['error'] : undefined;
  const code = error && typeof error['code'] === 'string' && error['code'] !== '' ? error['code'] : undefined;
  const message =
    error && typeof error['message'] === 'string' && error['message'] !== ''
      ? error['message']
      : undefined;
  return new VtigerApiError({
    code: code ?? (status ? `HTTP_${status}` : 'UNEXPECTED_RESPONSE'),
    message:
      message !== undefined && message !== code
        ? message
        : status
        ? statusMessage(status)
        : message ?? 'Vtiger returned a response without a success flag',
    status,
  });
}

export function unwrapEnvelope<T>({
  body,
  status,
}: {
  body: VtigerEnvelope<T> | undefined;
  status?: number;
}): T {
  if (isRecord(body) && body.success === true && body.result !== undefined) {
    return body.result;
  }
  throw envelopeError({
    body,
    status: isRecord(body) && body.success === false ? undefined : status,
  });
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], body: response['body'] };
}

export async function sendVtiger<T>({
  url,
  method,
  headers,
  query,
  form,
}: {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  form?: Record<string, string>;
}): Promise<VtigerEnvelope<T>> {
  const dispatcher = await verifiedTlsDispatcher();
  try {
    const response = await httpClient.sendRequest<VtigerEnvelope<T>>(
      {
        method,
        url,
        headers: {
          Accept: 'application/json',
          ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
          ...headers,
        },
        queryParams: query,
        body: form ? new URLSearchParams(form).toString() : undefined,
        followRedirects: false,
      },
      { dispatcher }
    );
    if (response.status >= 300) {
      throw new VtigerApiError({
        code: `HTTP_${response.status}`,
        message:
          'The Vtiger instance redirected the request. Check that the instance URL uses the final address (for example https instead of http).',
        status: response.status,
      });
    }
    if (!isRecord(response.body) || response.body.success !== true) {
      throw envelopeError({
        body: response.body,
        status: isRecord(response.body) && response.body.success === false ? undefined : response.status,
      });
    }
    return response.body;
  } catch (error) {
    const failure = readHttpFailure(error);
    if (failure && failure.status === 404 && url.includes(REST_PATH)) {
      throw new VtigerApiError({ code: REST_UNAVAILABLE, message: REST_UNAVAILABLE_MESSAGE, status: 404 });
    }
    if (failure) {
      throw envelopeError({ body: failure.body, status: failure.status });
    }
    throw error;
  }
}

export async function deleteRestRecord({ creds, id }: { creds: VtigerCredentials; id: string }): Promise<void> {
  await vtigerRest<unknown>({ creds, method: HttpMethod.POST, path: 'delete', form: { id } });
}

export async function fetchPicklistDependency({
  creds,
  module,
  sourceField,
  targetField,
}: {
  creds: VtigerCredentials;
  module: string;
  sourceField: string;
  targetField: string;
}): Promise<unknown> {
  return vtigerRest<unknown>({
    creds,
    method: HttpMethod.GET,
    path: 'picklist_dependency',
    query: { module, sourcefield: sourceField, targetfield: targetField },
  });
}

export async function vtigerRest<T = unknown>({
  creds,
  method,
  path,
  query,
  form,
}: {
  creds: VtigerCredentials;
  method: HttpMethod;
  path: string;
  query?: Record<string, string>;
  form?: Record<string, string>;
}): Promise<T> {
  const envelope = await sendVtiger<T>({
    url: `${restBaseUrl(creds)}/${path}`,
    method,
    headers: { Authorization: basicAuthorization(creds) },
    query,
    form,
  });
  return unwrapEnvelope<T>({ body: envelope });
}

export type VtigerCredentials = {
  instance_url: string;
  username: string;
  password: string;
};

export type VtigerEnvelope<T> = {
  success?: boolean;
  result?: T;
  error?: { code?: string; message?: string };
};

export const REST_PATH = '/restapi/v1/vtiger/default';
export const REST_UNAVAILABLE = 'REST_API_UNAVAILABLE';
export const REST_UNAVAILABLE_MESSAGE =
  'This action needs the Vtiger Cloud REST API (/restapi/v1), which self-hosted/open-source Vtiger does not provide. Use the Create/Get/Update/Delete/Query/Search Record actions instead.';
