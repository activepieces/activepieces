import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { VILLAGE_API_BASE_URL } from './auth';

async function call<T = unknown>({
  token,
  method,
  path,
  body,
  queryParams,
}: VillageCallParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${VILLAGE_API_BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  };
  if (body !== undefined) {
    request.body = body;
  }
  if (queryParams !== undefined) {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
    request.queryParams = cleaned;
  }
  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error) {
    throw toVillageError({ error, method, path });
  }
}

function toVillageError({
  error,
  method,
  path,
}: {
  error: unknown;
  method: HttpMethod;
  path: string;
}): VillageApiError {
  const operation = `Village ${method} ${stripQuery(path)}`;
  const response = readHttpResponse(error);
  if (response === null) {
    const reason = error instanceof Error ? error.message : String(error);
    const maybeApplied =
      method === HttpMethod.GET
        ? ''
        : ' The request may still have been applied on Village; check before retrying.';
    return new VillageApiError({
      message: `${operation} failed: network error or timeout (${reason}).${maybeApplied}`,
      status: 0,
      responseBody: undefined,
    });
  }
  const detail = readVendorDetail(response.body);
  const hint = STATUS_HINTS[response.status] ?? 'Village returned an error';
  const suffix = detail ? ` Village said: ${detail}` : '';
  return new VillageApiError({
    message: `${operation} failed (${response.status}): ${hint}.${suffix}`,
    status: response.status,
    responseBody: response.body,
  });
}

function readHttpResponse(error: unknown): { status: number; body: unknown } | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return null;
  }
  const status = response.status;
  if (typeof status !== 'number' || status === 0) {
    return null;
  }
  return { status, body: 'body' in response ? response.body : undefined };
}

function readVendorDetail(body: unknown): string | null {
  if (typeof body === 'string') {
    return body.trim().length > 0 ? body.trim().slice(0, 500) : null;
  }
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return null;
  }
  const vendorError = body.error;
  if (typeof vendorError === 'string') {
    return vendorError;
  }
  if (typeof vendorError !== 'object' || vendorError === null) {
    return null;
  }
  const parts: string[] = [];
  if ('title' in vendorError && typeof vendorError.title === 'string') {
    parts.push(vendorError.title);
  }
  if ('detail' in vendorError && typeof vendorError.detail === 'string') {
    parts.push(vendorError.detail);
  }
  return parts.length > 0 ? parts.join(' - ') : null;
}

function stripQuery(path: string): string {
  const index = path.indexOf('?');
  return index === -1 ? path : path.slice(0, index);
}

function encodePathId(id: string): string {
  const trimmed = id.trim();
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }
  return encodeURIComponent(decoded);
}

function requireText({ value, field }: { value: string | undefined | null; field: string }): string {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${field} is required.`);
  }
  return trimmed;
}

function clampLimit({
  value,
  max,
  fallback,
}: {
  value: number | undefined | null;
  max: number;
  fallback: number;
}): number {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const whole = Math.floor(Number(value));
  if (whole < 1) {
    throw new Error(`Limit must be between 1 and ${max}.`);
  }
  return Math.min(whole, max);
}

function companyName(company: unknown): string | null {
  if (typeof company === 'string') {
    return company;
  }
  if (typeof company === 'object' && company !== null && 'name' in company && typeof company.name === 'string') {
    return company.name;
  }
  return null;
}

function matchByName({ items, name }: { items: NamedItem[]; name: string }): NameMatch {
  const wanted = name.trim().toLowerCase();
  const exact = items.filter((item) => item.name.trim().toLowerCase() === wanted);
  if (exact.length > 0) {
    return {
      found: true,
      id: exact[0].id,
      name: exact[0].name,
      other_matches: exact.slice(1, MAX_OTHER_MATCHES + 1),
    };
  }
  const partial = items.filter((item) => item.name.toLowerCase().includes(wanted));
  return { found: false, id: null, name: null, other_matches: partial.slice(0, MAX_OTHER_MATCHES) };
}

const MAX_OTHER_MATCHES = 10;

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item !== undefined && item !== null).map((item) => String(item));
}

function objectRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) =>
    typeof item === 'object' && item !== null ? Object.fromEntries(Object.entries(item)) : {},
  );
}

function rowText({ row, key }: { row: Record<string, unknown>; key: string }): string | undefined {
  const value = row[key];
  return typeof value === 'string' ? value : undefined;
}

function rowNumber({ row, key }: { row: Record<string, unknown>; key: string }): number | undefined {
  const value = row[key];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

const STATUS_HINTS: Record<number, string> = {
  400: 'the request was rejected as invalid',
  401: 'the API token is invalid or was revoked; reconnect Village with a new token',
  402: 'not enough Village credits for this call; top up credits in Village or use a free option',
  403: 'this token is not allowed to do that',
  404: 'not found; check the ID or identifier',
  409: 'conflict with the current state in Village',
  422: 'the request failed validation',
  429: 'rate limited by Village; wait and try again later',
  500: 'Village had an internal error; try again later',
  502: 'Village is temporarily unavailable; try again later',
  503: 'Village is temporarily unavailable; try again later',
};

export class VillageApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'VillageApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export type VillageCallParams = {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string | undefined>;
};

export type NamedItem = { id: string; name: string };

export type NameMatch = { found: boolean; id: string | null; name: string | null; other_matches: NamedItem[] };

export const villageApi = {
  call,
  encodePathId,
  requireText,
  clampLimit,
  companyName,
  matchByName,
  stringList,
  objectRows,
  rowText,
  rowNumber,
};

export const VILLAGE_ENRICH_MODE_OPTIONS = [
  { label: 'Cached first (charged only on a live fetch)', value: 'cached_first' },
  { label: 'Cached only (never charged)', value: 'cached_only' },
  { label: 'Realtime only (charged when found)', value: 'realtime_only' },
];

export const VILLAGE_RELATIONSHIP_TYPE_OPTIONS = [
  { label: 'Met in person', value: 'met_in_person' },
  { label: 'Worked together', value: 'worked_together' },
  { label: 'Studied together', value: 'studied_together' },
  { label: 'Attended event', value: 'attended_event' },
  { label: 'Introduced by someone', value: 'introduced_by_someone' },
  { label: 'Other', value: 'other' },
];

export const VILLAGE_WEBHOOK_EVENT_OPTIONS = [
  { label: 'New list item added', value: 'new_list_item_added' },
  { label: 'New connection', value: 'new_connection' },
  { label: 'New path to connection', value: 'new_path_to_connection' },
  { label: 'Job change', value: 'job_change' },
  { label: 'Team member joined', value: 'team_member_joined' },
  { label: 'New search results', value: 'new_search_results' },
  { label: 'List added', value: 'list_added' },
  { label: 'List deleted', value: 'list_deleted' },
  { label: 'List screening completed', value: 'list_screening_completed' },
  { label: 'Email generated', value: 'email_generated' },
  { label: 'Email approved', value: 'email_approved' },
  { label: 'Email sent', value: 'email_sent' },
];
