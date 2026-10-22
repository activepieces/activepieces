import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

async function request<T = Record<string, unknown>>({
  apiKey,
  method,
  path,
  what,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  what: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
        'User-Agent': 'coretool-activepieces/0.0.1',
      },
      body,
      queryParams,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.body;
  } catch (error) {
    throw new Error(buildErrorMessage({ error, what }));
  }
}

function asText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { message: value };
    } catch {
      return { message: value };
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function buildErrorMessage({ error, what }: { error: unknown; what: string }): string {
  if (!(error instanceof HttpError)) {
    return `${what}: ${error instanceof Error ? error.message : String(error)}`;
  }
  const status = error.response.status;
  const body = asRecord(error.response.body);
  const nested = typeof body['error'] === 'object' ? asRecord(body['error']) : {};
  const apiMessage = asText(
    nested['message_en'] ?? body['message_en'] ?? nested['message'] ?? body['message'] ?? body['detail'],
  );
  const fieldErrors = nested['errors'] ?? body['errors'];
  const details: string[] = [];
  if (Array.isArray(fieldErrors)) {
    for (const entry of fieldErrors.slice(0, 20)) {
      const record = asRecord(entry);
      details.push(
        typeof entry === 'object' && entry !== null
          ? `${asText(record['field'] ?? record['loc'] ?? '?')}: ${asText(record['message'] ?? record['msg'])}`
          : asText(entry),
      );
    }
  }
  const suffix = apiMessage ? ` – ${apiMessage}` : '';
  let message: string;
  switch (status) {
    case 400:
    case 422:
      message = `${what}: some invoice data is missing or invalid${suffix}`;
      break;
    case 401:
      message =
        'API key invalid or revoked – create a new key in your Coretool account at coretool.de and update the connection';
      break;
    case 402:
      message = `No calls left – free calls used up or plan limit reached. Pricing: ${
        asText(nested['pricing'] ?? body['pricing']) || PRICING_URL
      }`;
      break;
    case 413:
      message = `${what}: the file is too large – the maximum is 5 MB`;
      break;
    case 429:
      message = 'Too many requests – wait a minute and try again';
      break;
    case 503:
      message = 'The validation service is briefly unavailable – try again in a minute';
      break;
    default:
      message = `${what}: Coretool API answered with HTTP ${status}${suffix}`;
  }
  if (details.length) message += ` (${details.join('; ')})`;
  return message;
}

function removeEmpty(value: unknown): unknown {
  if (Array.isArray(value)) {
    const list = value.map((entry) => removeEmpty(entry)).filter((entry) => entry !== undefined);
    return list.length ? list : undefined;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const cleaned = removeEmpty(entry);
      if (cleaned !== undefined) result[key] = cleaned;
    }
    return Object.keys(result).length ? result : undefined;
  }
  if (value === undefined || value === null || value === '') return undefined;
  return value;
}

function dateOnly({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value).trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (!match) {
    throw new Error(`${label}: "${text}" is not a valid date – use the format YYYY-MM-DD (for example 2026-10-22)`);
  }
  return match[0];
}

function parseLineItems(value: unknown): Record<string, unknown>[] {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      throw new Error(`Line Items is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    parsed = [parsed];
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Line Items: add at least one line item');
  }
  return parsed.map((entry: unknown) => {
    const record = typeof entry === 'string' ? asRecord(entry) : entry;
    if (!record || typeof record !== 'object' || Array.isArray(record) || !Object.keys(record).length) {
      throw new Error(
        'Line Items: every line item must be an object such as {"description": "Consulting", "quantity": 1, "unit_price": 100, "vat_rate": 19}',
      );
    }
    return record as Record<string, unknown>;
  });
}

function safeFileName({ name, fallback }: { name: unknown; fallback: string }): string {
  const base = String(name || fallback).split(/[\\/]/).pop() ?? fallback;
  return base.replace(/[^\w.-]/g, '_') || fallback;
}

export const BASE_URL = 'https://api.coretool.de/v1';
export const DOCS_URL = 'https://coretool.de/e-rechnung-api';
export const PRICING_URL = 'https://coretool.de/e-rechnung-api#preise';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const REQUEST_TIMEOUT_MS = 120000;

export const coretoolClient = {
  request,
  buildErrorMessage,
  removeEmpty,
  dateOnly,
  parseLineItems,
  safeFileName,
};
