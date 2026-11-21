import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import type { MatomoAuthType } from './auth';

function normaliseDomain(domain: string): string {
  let base = domain.trim();
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  base = base.replace(/\/+$/, '');
  base = base.replace(/\/(index|matomo|piwik)\.php$/i, '');
  return base.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeTransportError({ error, domain }: { error: unknown; domain: string }): string {
  if (error instanceof HttpError) {
    const response = error.errorMessage().response;
    const body = response.body;
    if (isRecord(body) && typeof body['message'] === 'string') {
      return `HTTP ${response.status}: ${body['message']}`;
    }
    return `HTTP ${response.status}`;
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return 'the request timed out';
    }
    const code = error.cause instanceof Error && 'code' in error.cause ? String(error.cause.code) : '';
    if (error.message === 'fetch failed' || UNREACHABLE_CODES.some((c) => code === c || error.message.includes(c))) {
      return `could not reach the Matomo server at ${normaliseDomain(domain)}`;
    }
    return error.message;
  }
  return String(error);
}

function stringParams(params: MatomoParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    result[key] = String(value);
  }
  return result;
}

async function call({ auth, method, params = {}, idSite, withoutSite = false }: CallParams): Promise<unknown> {
  const site = idSite === undefined || idSite === null || String(idSite).trim() === '' ? auth.siteId : String(idSite).trim();
  const formParams = stringParams({
    module: 'API',
    format: 'JSON',
    method,
    ...(withoutSite ? {} : { idSite: site }),
    ...params,
  });
  let response;
  try {
    response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${normaliseDomain(auth.domain)}/index.php`,
      body: new URLSearchParams({ ...formParams, token_auth: auth.tokenAuth }).toString(),
      headers: { Accept: 'application/json', 'Content-Type': FORM_CONTENT_TYPE },
      timeout: REQUEST_TIMEOUT_MS,
      redactBodyInErrors: true,
    });
  } catch (error) {
    const suffix = WRITE_METHODS.includes(method) ? ' The change may still have been applied.' : '';
    throw new Error(`Matomo ${method} failed: ${describeTransportError({ error, domain: auth.domain })}.${suffix}`);
  }
  const body: unknown = response.body;
  if (isRecord(body) && body['result'] === 'error') {
    const message = typeof body['message'] === 'string' ? body['message'] : 'unknown error';
    throw new Error(`Matomo ${method} failed: ${message}`);
  }
  if (typeof body === 'string') {
    throw new Error(`Matomo ${method} failed: the server did not return JSON. Check the Matomo URL in the connection.`);
  }
  return body;
}

async function track({ auth, params }: TrackParams): Promise<void> {
  const body = new URLSearchParams(stringParams({ ...params, rec: 1, token_auth: auth.tokenAuth })).toString();
  try {
    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${normaliseDomain(auth.domain)}/matomo.php`,
      body,
      headers: { Accept: '*/*', 'Content-Type': FORM_CONTENT_TYPE },
      responseType: 'text',
      timeout: REQUEST_TIMEOUT_MS,
      redactBodyInErrors: true,
    });
  } catch (error) {
    throw new Error(`Matomo tracking request failed: ${describeTransportError({ error, domain: auth.domain })}. The hit may still have been recorded.`);
  }
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (isRecord(value)) {
    return Object.values(value);
  }
  return [];
}

const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';
const UNREACHABLE_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'EHOSTUNREACH'];
const REQUEST_TIMEOUT_MS = 120000;
const WRITE_METHODS = ['Annotations.add', 'Annotations.delete'];

type MatomoParams = Record<string, string | number | boolean | undefined | null>;

type CallParams = {
  auth: MatomoAuthType;
  method: string;
  params?: MatomoParams;
  idSite?: string | number | null;
  withoutSite?: boolean;
};

type TrackParams = {
  auth: MatomoAuthType;
  params: MatomoParams;
};

export const matomoApi = { call, track, normaliseDomain, isRecord, toArray };
