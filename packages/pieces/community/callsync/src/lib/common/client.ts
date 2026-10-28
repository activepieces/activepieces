import { createHmac, timingSafeEqual } from 'crypto';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://mcp.callsyncapp.com/api/v1';

/** The CallSync API serves at most this many rows per page. */
const PAGE_SIZE = 10;

export async function callsyncApiCall<T = Record<string, unknown>>({
  apiKey,
  method,
  path,
  body,
  query,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
}): Promise<T> {
  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') queryParams[key] = String(value);
  }
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}/${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
    queryParams,
    body,
  });
  return response.body;
}

type Page = {
  data?: Record<string, unknown>[];
  total?: number;
  pagination?: { total?: number };
};

/** Follows page numbers until the API runs out of rows or `limit` rows are collected. */
export async function callsyncListAll({
  apiKey,
  path,
  query,
  limit,
}: {
  apiKey: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  limit: number;
}): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let page = 1; rows.length < limit; page++) {
    const response = await callsyncApiCall<Page>({
      apiKey,
      method: HttpMethod.GET,
      path,
      query: { ...query, page, limit: PAGE_SIZE },
    });
    const data = response.data ?? [];
    rows.push(...data);
    const total = Number(response.pagination?.total ?? response.total);
    if (data.length < PAGE_SIZE || (Number.isFinite(total) && rows.length >= total)) break;
  }
  return rows.slice(0, limit);
}

/**
 * Turns nested API objects into flat, table-ready rows:
 * `{ caller: { phone: '1' } }` becomes `{ caller_phone: '1' }`.
 * Lists of plain values are joined with commas; lists of objects are kept as JSON text.
 */
export function flatten(
  value: Record<string, unknown>,
  prefix = '',
  out: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const [key, item] of Object.entries(value)) {
    const name = prefix ? `${prefix}_${key}` : key;
    if (Array.isArray(item)) {
      out[name] = item.every((entry) => entry === null || typeof entry !== 'object')
        ? item.join(', ')
        : JSON.stringify(item);
    } else if (item !== null && typeof item === 'object') {
      flatten(item as Record<string, unknown>, name, out);
    } else {
      out[name] = item;
    }
  }
  return out;
}

/** Keeps the date and time exactly as picked, so 10:00 stays 10:00 for the team. */
export function dueFields(value: unknown): Record<string, string> {
  const match = String(value ?? '').match(
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?)?/
  );
  if (!match) return {};
  return match[2]
    ? { due_date: match[1], due_time: `${match[2]}:${match[3] ?? '00'}` }
    : { due_date: match[1] };
}

/** Drops fields left blank, so an update never wipes saved data by accident. */
export function withoutBlanks(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

/** CallSync signs each delivery: hex HMAC-SHA256 of the raw body, keyed with the subscription secret. */
export function isValidSignature(
  secret: string | null | undefined,
  signature: unknown,
  rawBody: unknown
): boolean {
  if (!secret || typeof signature !== 'string' || rawBody === undefined || rawBody === null) {
    return false;
  }
  const body = typeof rawBody === 'string' || Buffer.isBuffer(rawBody)
    ? rawBody
    : JSON.stringify(rawBody);
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const given = Buffer.from(signature.trim().toLowerCase());
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/** Older event names that existing CallSync webhooks may still send. */
const EVENT_ALIASES: Record<string, string> = {
  'call.received': 'call_logged',
  recording_uploaded: 'recording_updated',
  'recording.available': 'recording_updated',
  'ai_analysis.completed': 'ai_analysis',
  'transcription.completed': 'ai_analysis',
  'ai.transcription.completed': 'ai_analysis',
  'caller.updated': 'caller_updated',
  detail_updated: 'caller_updated',
};

export const canonicalEvent = (event: unknown): string =>
  EVENT_ALIASES[String(event)] ?? String(event);
