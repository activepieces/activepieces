import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import type { KlaviyoAuthValue } from './auth';

export class KlaviyoApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly retryAfter: number | undefined;
  readonly responseBody: unknown;

  constructor({ method, path, status, responseBody, retryAfter, hint }: KlaviyoApiErrorParams) {
    const base = `Klaviyo ${method} ${path} failed (HTTP ${status}): ${vendorMessage(responseBody)}`;
    super(hint === undefined ? base : `${base} ${hint}`);
    this.name = 'KlaviyoApiError';
    this.status = status;
    this.code = firstError(responseBody)?.code;
    this.retryAfter = retryAfter;
    this.responseBody = responseBody;
  }
}

export class KlaviyoCapError extends Error {
  readonly maxItems: number;

  constructor({ what, maxItems }: { what: string; maxItems: number }) {
    super(`Klaviyo has more than ${maxItems} ${what}; stopped instead of returning a partial list. Narrow the search.`);
    this.name = 'KlaviyoCapError';
    this.maxItems = maxItems;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string') {
    const text = responseBody.trim();
    return text === '' ? 'no details returned' : text.slice(0, MAX_ERROR_TEXT);
  }
  const errors = isRecord(responseBody) && Array.isArray(responseBody['errors']) ? responseBody['errors'].filter(isRecord) : [];
  const parts = errors
    .map((error) => {
      const detail = textOf(error['detail']) ?? textOf(error['title']);
      const code = textOf(error['code']);
      return [detail, code === undefined ? undefined : `(${code})`].filter((part) => part !== undefined).join(' ');
    })
    .filter((text) => text !== '');
  return parts.length > 0 ? parts.join('; ').slice(0, MAX_ERROR_TEXT) : 'no details returned';
}

export function duplicateProfileId(responseBody: unknown): string | undefined {
  const errors = isRecord(responseBody) && Array.isArray(responseBody['errors']) ? responseBody['errors'].filter(isRecord) : [];
  for (const error of errors) {
    const meta = error['meta'];
    if (isRecord(meta)) {
      const id = textOf(meta['duplicate_profile_id']);
      if (id !== undefined) {
        return id;
      }
    }
  }
  return undefined;
}

export function authorizationOf(auth: KlaviyoAuthValue): string {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return `Klaviyo-API-Key ${auth.secret_text.trim()}`;
  }
  return `Bearer ${auth.access_token}`;
}

export function pathFor(segments: string[]): string {
  return segments.map((segment) => `/${encodeURIComponent(segment)}`).join('');
}

export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function equalsFilter({ field, value }: { field: string; value: string }): string {
  return `equals(${field},${quoteFilterValue(value)})`;
}

export function joinFilters(filters: (string | undefined)[]): string | undefined {
  const parts = filters.filter((filter): filter is string => filter !== undefined && filter !== '');
  return parts.length === 0 ? undefined : parts.join(',');
}

export function buildUrl({ path, query }: { path: string; query?: KlaviyoQuery }): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.split('/').some((part) => part === '..' || part === '.') || path.includes('?') || path.includes('#')) {
    throw new Error('Refusing to send a Klaviyo request to an unexpected path.');
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const text = params.toString();
  return `${BASE_URL}${path}${text === '' ? '' : `?${text}`}`;
}

export function cursorFromNextLink(body: unknown): string | null {
  const links = isRecord(body) ? body['links'] : undefined;
  const next = isRecord(links) ? links['next'] : undefined;
  if (typeof next !== 'string' || next === '') {
    return null;
  }
  try {
    const cursor = new URL(next).searchParams.get('page[cursor]');
    return cursor === null || cursor === '' ? null : cursor;
  } catch {
    return null;
  }
}

export function resourcesOf(body: unknown): KlaviyoResource[] {
  const data = isRecord(body) ? body['data'] : undefined;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(isRecord).map(toResource);
}

export function resourceOf(body: unknown): KlaviyoResource | undefined {
  const data = isRecord(body) ? body['data'] : undefined;
  return isRecord(data) ? toResource(data) : undefined;
}

export function textOf(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value === '' ? undefined : value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function normalizeProfileIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => textOf(item)?.trim()).filter((item): item is string => item !== undefined && item !== '');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      const parsed = safeJson(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeProfileIds(parsed);
      }
    }
    return trimmed === '' ? [] : [trimmed];
  }
  return [];
}

export async function fetchProfilesByIds({ auth, ids }: { auth: KlaviyoAuthValue; ids: string[] }): Promise<Map<string, Record<string, unknown>>> {
  const profileMap = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < ids.length; i += PROFILE_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + PROFILE_CHUNK_SIZE);
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.GET,
      path: '/profiles',
      query: { filter: `any(id,${JSON.stringify(chunk)})`, 'page[size]': PROFILE_CHUNK_SIZE },
    });
    for (const profile of resourcesOf(response.body)) {
      profileMap.set(profile.id, profile.attributes);
    }
  }
  return profileMap;
}

export function subscribeJobBody({ profiles, listId, customSource, historicalImport, consentedAt }: SubscribeJobInput): Record<string, unknown> {
  const marketing = (): Record<string, unknown> => (historicalImport && consentedAt !== undefined ? { consent: 'SUBSCRIBED', consented_at: consentedAt } : { consent: 'SUBSCRIBED' });
  const attributes: Record<string, unknown> = {
    profiles: {
      data: profiles.map((profile) => {
        const subscriptions: Record<string, unknown> = {};
        if (profile.email !== undefined && profile.channels.includes('email')) {
          subscriptions['email'] = { marketing: marketing() };
        }
        if (profile.phone_number !== undefined && profile.channels.includes('sms')) {
          subscriptions['sms'] = { marketing: marketing() };
        }
        return {
          type: 'profile',
          ...(profile.id === undefined ? {} : { id: profile.id }),
          attributes: {
            ...(profile.email === undefined ? {} : { email: profile.email }),
            ...(profile.phone_number === undefined ? {} : { phone_number: profile.phone_number }),
            subscriptions,
          },
        };
      }),
    },
  };
  if (customSource !== undefined) {
    attributes['custom_source'] = customSource;
  }
  if (historicalImport) {
    attributes['historical_import'] = true;
  }
  return {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes,
      ...(listId === undefined ? {} : { relationships: { list: { data: { type: 'list', id: listId } } } }),
    },
  };
}

export function unsubscribeJobBody({ profiles, listId }: UnsubscribeJobInput): Record<string, unknown> {
  return {
    data: {
      type: 'profile-subscription-bulk-delete-job',
      attributes: {
        profiles: {
          data: profiles.map((profile) => {
            const subscriptions: Record<string, unknown> = {};
            if (profile.email !== undefined && profile.channels.includes('email')) {
              subscriptions['email'] = { marketing: { consent: 'UNSUBSCRIBED' } };
            }
            if (profile.phone_number !== undefined) {
              const sms: Record<string, unknown> = {};
              if (profile.channels.includes('sms')) {
                sms['marketing'] = { consent: 'UNSUBSCRIBED' };
              }
              if (profile.channels.includes('sms_transactional')) {
                sms['transactional'] = { consent: 'UNSUBSCRIBED' };
              }
              if (Object.keys(sms).length > 0) {
                subscriptions['sms'] = sms;
              }
            }
            return {
              type: 'profile',
              ...(profile.id === undefined ? {} : { id: profile.id }),
              attributes: {
                ...(profile.email === undefined ? {} : { email: profile.email }),
                ...(profile.phone_number === undefined ? {} : { phone_number: profile.phone_number }),
                subscriptions,
              },
            };
          }),
        },
      },
      ...(listId === undefined ? {} : { relationships: { list: { data: { type: 'list', id: listId } } } }),
    },
  };
}

export async function consentProfiles({ auth, profileIds, channels }: { auth: KlaviyoAuthValue; profileIds: string[]; channels: ConsentChannel[] }): Promise<ConsentProfile[]> {
  const profileMap = await fetchProfilesByIds({ auth, ids: profileIds });
  const wantsEmail = channels.includes('email');
  const wantsSms = channels.includes('sms') || channels.includes('sms_transactional');
  const resolved = profileIds.map((profileId) => {
    const attributes = profileMap.get(profileId);
    return {
      id: profileId,
      email: wantsEmail ? textOf(attributes?.['email']) : undefined,
      phone_number: wantsSms ? textOf(attributes?.['phone_number']) : undefined,
      channels,
    };
  });
  const unusable = resolved.filter((profile) => profile.email === undefined && profile.phone_number === undefined).map((profile) => profile.id);
  if (unusable.length > 0) {
    const extra = unusable.length > 10 ? ` and ${unusable.length - 10} more` : '';
    throw new Error(`These profiles were not found, or have no email or phone number for the selected channels: ${unusable.slice(0, 10).join(', ')}${extra}.`);
  }
  return resolved;
}

export function jobIdOf(body: unknown): string | null {
  const data = isRecord(body) ? body['data'] : undefined;
  return isRecord(data) ? textOf(data['id']) ?? null : null;
}

export const BASE_URL = 'https://a.klaviyo.com/api';

export const KLAVIYO_REVISION = '2026-10-15';

export const CUSTOM_API_CALL_REVISION = '2025-04-15';

export const klaviyoTransport = { getDispatcher: verifiedTlsDispatcher, sleep };

export const klaviyoApi = { request, send, listPage, listAll, pollAfter };

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;

const MAX_RATE_LIMIT_RETRIES = 2;

const MAX_RETRY_WAIT_SECONDS = 10;

const FALLBACK_RETRY_WAIT_SECONDS = [2, 5];

const MAX_ERROR_TEXT = 500;

const PROFILE_CHUNK_SIZE = 100;

const POLL_HARD_CAP_FACTOR = 10;

const JSON_API = 'application/vnd.api+json';

function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function firstError(responseBody: unknown): { code: string | undefined } | undefined {
  if (!isRecord(responseBody) || !Array.isArray(responseBody['errors'])) {
    return undefined;
  }
  const first = responseBody['errors'].find(isRecord);
  return first === undefined ? undefined : { code: textOf(first['code']) };
}

function toResource(record: Record<string, unknown>): KlaviyoResource {
  return {
    type: textOf(record['type']) ?? '',
    id: textOf(record['id']) ?? '',
    attributes: isRecord(record['attributes']) ? record['attributes'] : {},
    relationships: isRecord(record['relationships']) ? record['relationships'] : {},
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function retryAfterSeconds(raw: string | string[] | undefined): number | undefined {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (text === undefined) {
    return undefined;
  }
  const seconds = Number(text);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === 'TimeoutError' || error.name === 'AbortError';
}

function transportReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error).slice(0, 200);
  }
  const cause: unknown = error.cause;
  const code = isRecord(cause) ? textOf(cause['code']) : undefined;
  return (code ?? error.message).slice(0, 200);
}

function transportError({ method, path, error }: { method: HttpMethod; path: string; error: unknown }): Error {
  const mayHaveApplied = method !== HttpMethod.GET
    ? ' The request may still have been applied; check Klaviyo before running the step again.'
    : '';
  if (isTimeout(error)) {
    return new Error(`Klaviyo ${method} ${path} did not answer within ${REQUEST_TIMEOUT_MS / 1000} s.${mayHaveApplied}`);
  }
  return new Error(`Klaviyo ${method} ${path} could not reach a.klaviyo.com (${transportReason(error)}).${mayHaveApplied}`);
}

async function request({ authorization, method, path, query, body, revision = KLAVIYO_REVISION, timeoutMs = REQUEST_TIMEOUT_MS }: KlaviyoRequest): Promise<KlaviyoResponse> {
  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: JSON_API,
    revision,
  };
  if (body !== undefined) {
    headers['Content-Type'] = JSON_API;
  }
  const httpRequest: HttpRequest = {
    method,
    url: buildUrl({ path, query }),
    headers,
    timeout: Math.max(1, Math.min(timeoutMs, REQUEST_TIMEOUT_MS)),
    followRedirects: false,
    responseType: 'text',
    redactBodyInErrors: true,
    retries: 0,
  };
  if (body !== undefined) {
    httpRequest.body = JSON.stringify(body);
  }
  const dispatcher = await klaviyoTransport.getDispatcher();
  for (let attempt = 0; ; attempt++) {
    const response = await sendOnce({ request: httpRequest, dispatcher, method, path });
    if (response.status >= 200 && response.status < 300) {
      return { status: response.status, body: response.body };
    }
    if (response.status === 429 && method === HttpMethod.GET && attempt < MAX_RATE_LIMIT_RETRIES) {
      const waitSeconds = response.retryAfter ?? FALLBACK_RETRY_WAIT_SECONDS[attempt];
      await klaviyoTransport.sleep(Math.min(waitSeconds, MAX_RETRY_WAIT_SECONDS) * 1000);
      continue;
    }
    if (response.status >= 300 && response.status < 400) {
      throw new KlaviyoApiError({ method, path, status: response.status, responseBody: 'unexpected redirect, not followed' });
    }
    throw new KlaviyoApiError({ method, path, status: response.status, responseBody: response.body, retryAfter: response.retryAfter });
  }
}

async function sendOnce({ request, dispatcher, method, path }: { request: HttpRequest; dispatcher: unknown; method: HttpMethod; path: string }): Promise<RawResponse> {
  try {
    const response = await httpClient.sendRequest<string>(request, { dispatcher });
    return { status: response.status, body: parseText(response.body), retryAfter: retryAfterSeconds(response.headers?.['retry-after']) };
  } catch (error) {
    if (error instanceof HttpError) {
      return { status: error.response.status, body: parseText(error.response.body), retryAfter: undefined };
    }
    throw transportError({ method, path, error });
  }
}

function parseText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  return value === '' ? undefined : safeJson(value);
}

async function send({ auth, ...rest }: KlaviyoSendRequest): Promise<KlaviyoResponse> {
  return request({ authorization: authorizationOf(auth), ...rest });
}

async function listPage({ auth, path, query, cursor }: KlaviyoPageRequest): Promise<KlaviyoPage> {
  const response = await send({
    auth,
    method: HttpMethod.GET,
    path,
    query: { ...query, 'page[cursor]': cursor ?? undefined },
  });
  const nextCursor = cursorFromNextLink(response.body);
  const included = isRecord(response.body) && Array.isArray(response.body['included']) ? response.body['included'].filter(isRecord).map(toResource) : [];
  return { items: resourcesOf(response.body), included, next_cursor: nextCursor, has_more: nextCursor !== null };
}

async function listAll({ auth, path, query, maxItems, what }: KlaviyoListAllRequest): Promise<KlaviyoListAll> {
  const items: KlaviyoResource[] = [];
  const included: KlaviyoResource[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page: KlaviyoPage = await listPage({ auth, path, query, cursor });
    items.push(...page.items);
    included.push(...page.included);
    if (!page.has_more || page.items.length === 0) {
      return { items, included };
    }
    if (items.length >= maxItems) {
      throw new KlaviyoCapError({ what, maxItems });
    }
    cursor = page.next_cursor;
  }
}

async function pollAfter({ auth, path, field, since, cap }: KlaviyoPollRequest): Promise<KlaviyoResource[]> {
  const items: KlaviyoResource[] = [];
  let cursor: string | null = null;
  let boundary: string | undefined;
  for (;;) {
    const page: KlaviyoPage = await listPage({
      auth,
      path,
      query: { filter: `greater-than(${field},${since})`, sort: field, 'page[size]': 100 },
      cursor,
    });
    for (const item of page.items) {
      const value = textOf(item.attributes[field]) ?? '';
      if (boundary !== undefined && value !== boundary) {
        return items;
      }
      items.push(item);
      if (boundary === undefined && items.length >= cap) {
        boundary = value;
      }
    }
    if (!page.has_more || page.items.length === 0) {
      return items;
    }
    if (items.length >= cap * POLL_HARD_CAP_FACTOR) {
      throw new Error(`Klaviyo returned more than ${items.length} items sharing the same ${field} time; stopped instead of skipping some.`);
    }
    cursor = page.next_cursor;
  }
}

export type KlaviyoQuery = Record<string, string | number | undefined | null>;

export type KlaviyoResource = {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
  relationships: Record<string, unknown>;
};

export type KlaviyoResponse = {
  status: number;
  body: unknown;
};

export type KlaviyoPage = {
  items: KlaviyoResource[];
  included: KlaviyoResource[];
  next_cursor: string | null;
  has_more: boolean;
};

export type KlaviyoListAll = {
  items: KlaviyoResource[];
  included: KlaviyoResource[];
};

type KlaviyoApiErrorParams = {
  method: HttpMethod;
  path: string;
  status: number;
  responseBody: unknown;
  retryAfter?: number;
  hint?: string;
};

export type KlaviyoRequest = {
  authorization: string;
  method: HttpMethod;
  path: string;
  query?: KlaviyoQuery;
  body?: unknown;
  revision?: string;
  timeoutMs?: number;
};

export type KlaviyoSendRequest = Omit<KlaviyoRequest, 'authorization'> & {
  auth: KlaviyoAuthValue;
};

export type KlaviyoPageRequest = {
  auth: KlaviyoAuthValue;
  path: string;
  query?: KlaviyoQuery;
  cursor?: string | null;
};

export type KlaviyoListAllRequest = {
  auth: KlaviyoAuthValue;
  path: string;
  query?: KlaviyoQuery;
  maxItems: number;
  what: string;
};

export type ConsentChannel = 'email' | 'sms' | 'sms_transactional';

export type ConsentProfile = {
  id?: string;
  email?: string;
  phone_number?: string;
  channels: ConsentChannel[];
};

export type SubscribeJobInput = {
  profiles: ConsentProfile[];
  listId?: string;
  customSource?: string;
  historicalImport: boolean;
  consentedAt?: string;
};

export type UnsubscribeJobInput = {
  profiles: ConsentProfile[];
  listId?: string;
};

export type KlaviyoPollRequest = {
  auth: KlaviyoAuthValue;
  path: string;
  field: string;
  since: string;
  cap: number;
};

type RawResponse = {
  status: number;
  body: unknown;
  retryAfter: number | undefined;
};
