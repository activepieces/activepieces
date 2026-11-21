import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const VAPI_BASE_URL = 'https://api.vapi.ai';
const WRITE_METHODS: HttpMethod[] = [HttpMethod.POST, HttpMethod.PATCH, HttpMethod.PUT, HttpMethod.DELETE];

function extractVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    if (body.trim().length === 0) {
      return undefined;
    }
    try {
      return extractVendorMessage(JSON.parse(body));
    } catch {
      return body.slice(0, 500);
    }
  }
  if (!isRecord(body)) {
    return undefined;
  }
  const message = body['message'];
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  if (Array.isArray(message)) {
    const parts = message.filter((part): part is string => typeof part === 'string');
    if (parts.length > 0) {
      return parts.join('; ');
    }
  }
  const error = body['error'];
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }
  return undefined;
}

function describeTransportError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return 'the request timed out';
    }
    return error.message;
  }
  return String(error);
}

function buildQuery(query: Record<string, string | number | undefined> | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!query) {
    return result;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') {
      continue;
    }
    result[key] = String(value);
  }
  return result;
}

async function request<T>({
  apiKey,
  method,
  path,
  operation,
  body,
  query,
  headers,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${VAPI_BASE_URL}${path}`,
      headers: {
        ...(headers ?? {}),
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
      body,
      queryParams: buildQuery(query),
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      const vendorMessage = extractVendorMessage(error.response.body) ?? 'no error message returned';
      throw new VapiApiError({
        message: `Vapi ${operation} failed (${status}): ${vendorMessage}`,
        status,
        responseBody: error.response.body,
      });
    }
    const suffix = WRITE_METHODS.includes(method)
      ? ' The change may still have been applied; check Vapi before retrying.'
      : '';
    throw new VapiApiError({
      message: `Vapi ${operation} failed: ${describeTransportError(error)}.${suffix}`,
      status: 0,
      responseBody: undefined,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonObject({ value, fieldName }: { value: unknown; fieldName: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${fieldName} must be a valid JSON object.`);
    }
    return parseJsonObject({ value: parsed, fieldName });
  }
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be a JSON object, not an array or a single value.`);
  }
  return value;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value['results'])) {
    return value['results'].filter(isRecord);
  }
  return [];
}

const SECRET_KEY_PATTERN = /(secret|authtoken|password|apikey|privatekey|token$|^presigned|^webcallurl$)/i;

function stripSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSecrets(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key) || key === 'headers') {
      continue;
    }
    result[key] = stripSecrets(entry);
  }
  return result;
}

function stripSecretsFromRecord(value: unknown): Record<string, unknown> {
  const stripped = stripSecrets(value);
  return isRecord(stripped) ? stripped : {};
}

function cleanCall(value: unknown): Record<string, unknown> {
  const call = stripSecretsFromRecord(value);
  for (const key of ['customer', 'name']) {
    if (call[key] === '') {
      delete call[key];
    }
  }
  return call;
}

function requireId({ value, fieldName }: { value: unknown; fieldName: string }): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw new Error(`${fieldName} must be a Vapi ID (letters, digits, dashes and underscores only).`);
  }
  return encodeURIComponent(trimmed);
}

function clampLimit({ value, defaultValue, max }: { value: unknown; defaultValue: number; max: number }): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Limit must be a whole number between 1 and ${max}.`);
  }
  return Math.min(parsed, max);
}

function containsIgnoreCase({ haystack, needle }: { haystack: unknown; needle: string }): boolean {
  return typeof haystack === 'string' && haystack.toLowerCase().includes(needle.toLowerCase());
}

class VapiApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'VapiApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const vapiApi = {
  baseUrl: VAPI_BASE_URL,
  request,
};

export const vapiUtils = {
  isRecord,
  parseJsonObject,
  asArray,
  stripSecrets: stripSecretsFromRecord,
  cleanCall,
  requireId,
  clampLimit,
  containsIgnoreCase,
  extractVendorMessage,
};

export { VapiApiError, VAPI_BASE_URL };
