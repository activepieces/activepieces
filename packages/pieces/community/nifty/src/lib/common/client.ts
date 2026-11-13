import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';

const BASE_URL = 'https://openapi.niftypm.com/api/v1.0';
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const MAX_ID_LENGTH = 128;
const ID_FORBIDDEN = /[/?#\\\s]/;
const PROJECT_HIDDEN_KEYS = [
  'zoom_id',
  'zoom_password',
  'zoom_join_url',
  'webex_id',
  'webex_password',
  'webex_join_url',
];
const MEMBER_KEYS = ['id', 'user_id', 'name', 'email', 'initials', 'role', 'pending', 'removed'];

export class NiftyApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, message, responseBody }: { status: number; message: string; responseBody: unknown }) {
    super(message);
    this.name = 'NiftyApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is NiftyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function vendorMessage(body: unknown): string {
  if (isRecord(body)) {
    const message = typeof body['message'] === 'string' ? body['message'] : '';
    const errors = Array.isArray(body['errors'])
      ? body['errors']
          .filter(isRecord)
          .map((e) => (typeof e['message'] === 'string' ? e['message'] : ''))
          .filter((m) => m.length > 0)
      : [];
    const detail = errors.length > 0 ? ` (${errors.join('; ')})` : '';
    if (message.length > 0) {
      return `${trimTrailingPeriods(message)}${detail}`;
    }
  }
  if (typeof body === 'string' && body.length > 0) {
    return body.slice(0, 300);
  }
  return 'no details returned';
}

function trimTrailingPeriods(message: string): string {
  let end = message.length;
  while (end > 0 && (message[end - 1] === '.' || message[end - 1] === ' ')) {
    end--;
  }
  return message.slice(0, end);
}

function statusSentence({ status, detail }: { status: number; detail: string }): string {
  switch (status) {
    case 400:
      return `Nifty rejected the request (400): ${detail}. Check the values you entered.`;
    case 401:
      return `Nifty did not accept the connection (401): ${detail}. Reconnect your Nifty account.`;
    case 403:
      return `Nifty refused access (403): ${detail}. The record may not exist, may be in a project you are not a member of, or this connection was not granted access to this kind of data.`;
    case 404:
      return `Nifty could not find the record (404): ${detail}. It may have been deleted, or the ID is wrong.`;
    case 429:
      return `Nifty rate limit reached (429): ${detail}. Wait a minute and try again.`;
    default:
      return `Nifty request failed with HTTP ${status}: ${detail}.`;
  }
}

function toNiftyError(error: unknown): unknown {
  const response = isRecord(error) && isRecord(error['response']) ? error['response'] : undefined;
  const status = response?.['status'];
  if (typeof status !== 'number') {
    return error;
  }
  const responseBody = response?.['body'];
  return new NiftyApiError({
    status,
    responseBody,
    message: statusSentence({ status, detail: vendorMessage(responseBody) }),
  });
}

function assertRelativePath(path: string): void {
  if (path.length === 0 || path.startsWith('/') || path.includes('://') || path.includes('..') || path.includes('\\')) {
    throw new Error(`Refusing to call an unexpected Nifty path: "${path}".`);
  }
}

async function request({
  auth,
  method,
  path,
  query,
  body,
}: {
  auth: NiftyAuth;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}): Promise<HttpResponse<unknown>> {
  assertRelativePath(path);
  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      queryParams[key] = String(value);
    }
  }
  try {
    return await httpClient.sendRequest<unknown>({
      method,
      url: `${BASE_URL}/${path}`,
      queryParams,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });
  } catch (error) {
    throw toNiftyError(error);
  }
}

async function requestRecord(params: Parameters<typeof request>[0]): Promise<NiftyRecord> {
  const response = await request(params);
  if (!isRecord(response.body)) {
    throw new Error(`Nifty returned an unexpected response for ${params.path}: ${JSON.stringify(response.body).slice(0, 200)}`);
  }
  return response.body;
}

function extractItems({ body, key }: { body: unknown; key: string | null }): NiftyRecord[] {
  const list = key === null ? body : isRecord(body) ? body[key] : undefined;
  if (!Array.isArray(list)) {
    throw new Error(`Nifty returned an unexpected list response: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return list.filter(isRecord);
}

async function listPage({
  auth,
  path,
  key,
  query,
  limit,
  offset,
}: {
  auth: NiftyAuth;
  path: string;
  key: string;
  query?: Record<string, string | number | boolean | undefined>;
  limit: number;
  offset: number;
}): Promise<{ items: NiftyRecord[]; hasMore: boolean }> {
  const response = await request({ auth, method: HttpMethod.GET, path, query: { ...query, limit, offset } });
  const items = extractItems({ body: response.body, key });
  return { items, hasMore: items.length >= limit };
}

async function listAll({
  auth,
  path,
  key,
  query,
  maxPages = MAX_PAGES,
}: {
  auth: NiftyAuth;
  path: string;
  key: string;
  query?: Record<string, string | number | boolean | undefined>;
  maxPages?: number;
}): Promise<{ items: NiftyRecord[]; truncated: boolean }> {
  const items: NiftyRecord[] = [];
  for (let page = 0; page < maxPages; page++) {
    const result = await listPage({ auth, path, key, query, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    items.push(...result.items);
    if (!result.hasMore) {
      return { items, truncated: false };
    }
  }
  return { items, truncated: true };
}

function requireId({ value, label }: { value: unknown; label: string }): string {
  const id = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (id.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (id.length > MAX_ID_LENGTH || ID_FORBIDDEN.test(id)) {
    throw new Error(`${label} "${id.slice(0, 80)}" is not a valid Nifty ID. Pass the ID exactly as Nifty returns it, e.g. HjGDVlaejN.`);
  }
  return id;
}

function optionalId({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireId({ value, label });
}

function idList({ value, label }: { value: unknown; label: string }): string[] {
  const raw = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value];
  const ids = raw
    .flatMap((item) => (typeof item === 'string' ? item.split(',') : [item]))
    .filter((item) => !(typeof item === 'string' && item.trim() === ''))
    .map((item) => requireId({ value: item, label }));
  return [...new Set(ids)];
}

function segment(id: string): string {
  return encodeURIComponent(id);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value.length > 0 ? value : undefined;
}

function requireName({ value, label, max }: { value: unknown; label: string; max: number }): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (name.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (name.length > max) {
    throw new Error(`${label} is too long (${name.length} characters, the maximum is ${max}).`);
  }
  return name;
}

function optionalName({ value, label, max }: { value: unknown; label: string; max: number }): string | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  return requireName({ value, label, max });
}

function optionalIsoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim() : '';
  const parsed = Date.parse(text);
  if (text.length === 0 || Number.isNaN(parsed)) {
    throw new Error(`${label} "${String(value)}" is not a valid date. Use ISO 8601, e.g. 2026-10-20 or 2026-10-20T09:00:00Z.`);
  }
  return new Date(parsed).toISOString();
}

function optionalNumber({ value, label, min, max, integer }: { value: unknown; label: string; min: number; max: number; integer: boolean }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`${label} must be ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}, got "${String(value)}".`);
  }
  return n;
}

function cleanProject(project: NiftyRecord): NiftyRecord {
  return Object.fromEntries(Object.entries(project).filter(([key]) => !PROJECT_HIDDEN_KEYS.includes(key)));
}

function cleanMember(member: NiftyRecord): NiftyRecord {
  return Object.fromEntries(MEMBER_KEYS.filter((key) => key in member).map((key) => [key, member[key]]));
}

function text({ record, key }: { record: NiftyRecord; key: string }): string {
  const value = record[key];
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

export const niftyClient = {
  BASE_URL,
  PAGE_SIZE,
  MAX_PAGES,
  isRecord,
  request,
  requestRecord,
  listPage,
  listAll,
  requireId,
  optionalId,
  idList,
  segment,
  optionalText,
  requireName,
  optionalName,
  optionalIsoDate,
  optionalNumber,
  cleanProject,
  cleanMember,
  text,
};

export type NiftyAuth = AppConnectionValueForAuthProperty<typeof niftyAuth>;
export type NiftyRecord = Record<string, unknown>;
