import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

import type { GoogleAdsAuthValue } from './types';

function baseUrl(): string {
  return GOOGLE_ADS_API_ROOT;
}

async function request<T>({ auth, method, path, body }: RequestParams & { auth: GoogleAdsAuthValue }): Promise<T> {
  const loginCustomerId = auth.props?.loginCustomerId?.trim();
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${GOOGLE_ADS_API_ROOT}/${API_VERSION}${path}`,
      headers: loginCustomerId ? { 'login-customer-id': normalizeLoginCustomerId(loginCustomerId) } : {},
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw googleAdsError(error);
    }
    throw error;
  }
}

async function dataManagerRequest<T>({ auth, method, path, body, timeoutMs }: RequestParams & { auth: GoogleAdsAuthValue; timeoutMs?: number }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${DATA_MANAGER_API_ROOT}/v1${path}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
      body,
      timeout: timeoutMs ?? DATA_MANAGER_TIMEOUT_MS,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw dataManagerError(error);
    }
    throw error;
  }
}

function normalizeLoginCustomerId(value: string): string {
  const digits = value.replace(/^customers\//, '').replace(/[-\s]/g, '');
  if (!/^\d{10}$/.test(digits)) {
    throw new Error(`Invalid Google Ads customer ID "${value}": expected 10 digits (dashes optional), e.g. 123-456-7890.`);
  }
  return digits;
}

function parseErrorBody(body: unknown): RpcErrorBody {
  try {
    const parsed: RpcErrorBody = JSON.parse(typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    return parsed ?? {};
  } catch {
    return {};
  }
}

function googleAdsError(error: HttpError): Error {
  const { status, body } = error.response;
  const rpcError = parseErrorBody(body).error ?? {};
  const failure = (rpcError.details ?? []).find((detail) => Array.isArray(detail.errors));
  const errors = (failure?.errors ?? []).map(describeAdsError);
  const head = `Google Ads API returned ${status}${rpcError.status ? ` (${rpcError.status})` : ''}`;
  const detail = errors.length > 0 ? errors.join('; ') : rpcError.message ?? (typeof body === 'string' ? body : JSON.stringify(body ?? null));
  const requestId = failure?.requestId;
  const apiError = new Error(`${head}: ${detail}${requestId ? ` [request-id: ${requestId}]` : ''}`);
  apiError.name = 'GoogleAdsApiError';
  return apiError;
}

function describeAdsError(error: AdsErrorDetail): string {
  const [enumName, value] = Object.entries(error.errorCode ?? {})[0] ?? ['UnknownError', 'UNKNOWN'];
  const field = (error.location?.fieldPathElements ?? [])
    .map((p) => (p.index === undefined ? p.fieldName : `${p.fieldName}[${p.index}]`))
    .filter(Boolean)
    .join('.');
  const trigger = error.trigger?.stringValue ?? error.trigger?.int64Value;
  return `${enumName}.${String(value)}: ${error.message ?? ''}${field ? ` [${field}]` : ''}${trigger ? ` (trigger: ${trigger})` : ''}`;
}

function dataManagerError(error: HttpError): Error {
  const { status } = error.response;
  const rpcError = parseErrorBody(error.response.body).error ?? {};
  const extras = (rpcError.details ?? []).flatMap((detail) => [
    ...(detail.fieldViolations ?? []).map((v) => `${v.field ?? '?'}: ${v.description ?? ''}`.trim()),
    ...(detail.reason ? [`reason: ${detail.reason}`] : []),
  ]);
  const head = `Data Manager API returned ${status}${rpcError.status ? ` (${rpcError.status})` : ''}`;
  const apiError = new Error(`${head}: ${rpcError.message ?? 'no error details'}${extras.length > 0 ? ` [${extras.join('; ')}]` : ''}`);
  apiError.name = 'DataManagerApiError';
  return apiError;
}

export const googleAdsClient = { baseUrl, request, dataManagerRequest };

const API_VERSION = 'v25';
const GOOGLE_ADS_API_ROOT = 'https://googleads.googleapis.com';
const DATA_MANAGER_API_ROOT = 'https://datamanager.googleapis.com';
const DATA_MANAGER_TIMEOUT_MS = 60_000;

type RequestParams = { method: HttpMethod; path: string; body?: unknown };

type AdsErrorDetail = {
  errorCode?: Record<string, string>;
  message?: string;
  location?: { fieldPathElements?: { fieldName?: string; index?: number }[] };
  trigger?: { stringValue?: string; int64Value?: string };
};

type RpcErrorBody = {
  error?: {
    status?: string;
    message?: string;
    details?: {
      errors?: AdsErrorDetail[];
      requestId?: string;
      fieldViolations?: { field?: string; description?: string }[];
      reason?: string;
    }[];
  };
};
