import {
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';

export type ZohoAuth = AppConnectionValueForAuthProperty<typeof zohoCrmAuth>;

const ZOHO_API_VERSION = 'v8';

export class ZohoCrmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ZohoCrmError';
  }
}

const FALLBACK_API_DOMAIN_BY_LOCATION: Record<string, string> = {
  'zoho.com': 'https://www.zohoapis.com',
  'zoho.eu': 'https://www.zohoapis.eu',
  'zoho.in': 'https://www.zohoapis.in',
  'zoho.com.au': 'https://www.zohoapis.com.au',
  'zoho.jp': 'https://www.zohoapis.jp',
  'zohocloud.ca': 'https://www.zohoapis.ca',
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function readField({ value, key }: { value: unknown; key: string }): unknown {
  return isRecord(value) ? value[key] : undefined;
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 200) : 'unknown error';
}

export function getApiDomain(auth: { data?: Record<string, unknown>; props?: Record<string, unknown> }): string {
  const domain = auth.data?.['api_domain'];
  if (typeof domain === 'string' && domain.length > 0) {
    return domain.replace(/\/+$/, '');
  }
  const location = auth.props?.['location'];
  const fallback = typeof location === 'string' ? FALLBACK_API_DOMAIN_BY_LOCATION[location] : undefined;
  if (fallback) {
    return fallback;
  }
  throw new ZohoCrmError(
    'This Zoho CRM connection has no api_domain (it is set by Zoho when you connect). Reconnect the Zoho CRM connection and try again.',
  );
}

export function customApiAuthHeaders({
  auth,
  url,
}: {
  auth: { access_token: string; data?: Record<string, unknown>; props?: Record<string, unknown> };
  url: unknown;
}): Record<string, string> {
  const apiHost = new URL(getApiDomain(auth)).host.toLowerCase();
  if (typeof url === 'string' && /^https?:\/\//i.test(url.trim())) {
    if (!isApiHostUrl({ raw: url.trim(), apiHost })) {
      throw new ZohoCrmError(
        `Custom API Call sends the Zoho CRM token only to https://${apiHost}. Use a path such as /Leads, or a full https://${apiHost}/crm/... URL.`,
      );
    }
  }
  return authHeaders(auth);
}

function isApiHostUrl({ raw, apiHost }: { raw: string; apiHost: string }): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' && parsed.username === '' && parsed.password === '' && parsed.host.toLowerCase() === apiHost;
  } catch {
    return false;
  }
}

export function authHeaders(auth: { access_token: string }): Record<string, string> {
  return { Authorization: `Zoho-oauthtoken ${auth.access_token}` };
}

function readResponse(error: unknown): { status?: number; body?: unknown } | undefined {
  const response = readField({ value: error, key: 'response' });
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response['status'];
  return {
    status: typeof status === 'number' ? status : undefined,
    body: response['body'],
  };
}

function toErrorBody(record: Record<string, unknown>): ZohoErrorBody {
  const details = record['details'];
  return {
    code: readString(record['code']),
    message: readString(record['message']),
    status: readString(record['status']),
    details: isRecord(details) ? details : undefined,
  };
}

function firstErrorBody(body: unknown): ZohoErrorBody | undefined {
  if (typeof body === 'string') {
    try {
      return firstErrorBody(JSON.parse(body));
    } catch {
      return { message: body };
    }
  }
  if (!isRecord(body)) {
    return undefined;
  }
  for (const key of ['data', 'tags', '__email_drafts']) {
    const list = body[key];
    if (Array.isArray(list) && list.length > 0 && isRecord(list[0])) {
      return toErrorBody(list[0]);
    }
  }
  return toErrorBody(body);
}

function describeZohoError({ error, status }: { error: ZohoErrorBody; status?: number }): string {
  const code = error.code ?? 'ERROR';
  const field = error.details?.['api_name'];
  const param = error.details?.['param_name'];
  const parts = [`Zoho CRM ${code}${status ? ` (HTTP ${status})` : ''}: ${error.message ?? 'request failed'}`];
  if (typeof field === 'string') {
    parts.push(`field: ${field}`);
  }
  if (typeof param === 'string') {
    parts.push(`parameter: ${param}`);
  }
  const hint = HINTS[code];
  if (hint) {
    parts.push(hint);
  }
  return parts.join(' — ');
}

const HINTS: Record<string, string> = {
  OAUTH_SCOPE_MISMATCH:
    'the connection was not granted the OAuth scope this endpoint needs; reconnect it (or this action needs a scope the piece does not request yet)',
  INVALID_TOKEN: 'the access token is invalid or expired; reconnect the Zoho CRM connection',
  AUTHENTICATION_FAILURE: 'reconnect the Zoho CRM connection',
  NO_PERMISSION: 'the connected Zoho user lacks permission for this module or record',
  INVALID_MODULE: 'use a module API name such as "Leads", "Deals" or "CustomModule1"',
  INVALID_URL_PATTERN: 'check the module API name and record id',
  INVALID_DATA: 'check the field API names and value formats',
  MANDATORY_NOT_FOUND: 'a required field is missing',
  DUPLICATE_DATA: 'a record with the same unique value already exists (update it, or create-or-update on that field instead)',
  ID_ALREADY_CONVERTED: 'the lead has already been converted',
  TOO_MANY_REQUESTS: 'rate limit reached; retry later',
  INTEGRATION_NOT_ENABLED:
    'this org stores file attachments in Zoho WorkDrive and the integration is off; an admin must enable it (Setup, Marketplace, Zoho, WorkDrive), or attach a link instead',
  DOWNLOAD_NOT_ALLOWED: 'link attachments have no file to download; open their link_url instead',
};

export function toZohoError(error: unknown): Error {
  const response = readResponse(error);
  if (!response) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const parsed = firstErrorBody(response.body);
  if (response.status === 429) {
    return new ZohoCrmError(describeZohoError({ error: { ...parsed, code: parsed?.code ?? 'TOO_MANY_REQUESTS' }, status: 429 }), 429, 'TOO_MANY_REQUESTS');
  }
  return new ZohoCrmError(describeZohoError({ error: parsed ?? {}, status: response.status }), response.status, parsed?.code);
}

export function zohoApiUrl({ auth, path, version = ZOHO_API_VERSION }: { auth: ZohoAuth; path: string; version?: string }): string {
  return `${getApiDomain(auth)}/crm/${version}${path}`;
}

export async function zohoRequestRaw<T>(req: ZohoRequest): Promise<{ status: number; body: T | undefined; headers: Record<string, unknown> }> {
  const url = zohoApiUrl({ auth: req.auth, path: req.path, version: req.version });
  try {
    const response = await httpClient.sendRequest<T>({
      method: req.method,
      url,
      headers: { ...authHeaders(req.auth), ...(req.headers ?? {}) },
      queryParams: req.query,
      body: req.body,
      responseType: req.responseType,
    });
    return { status: response.status, body: response.body, headers: response.headers ?? {} };
  } catch (error) {
    throw toZohoError(error);
  }
}

export async function zohoRequest<T>(req: ZohoRequest): Promise<T | undefined> {
  const { status, body } = await zohoRequestRaw<T>(req);
  if (status === 204) {
    return undefined;
  }
  return body;
}

function toWriteItem(value: unknown): ZohoWriteItem {
  if (!isRecord(value)) {
    return {};
  }
  const details = value['details'];
  const duplicateField = value['duplicate_field'];
  return {
    code: readString(value['code']),
    status: readString(value['status']),
    message: readString(value['message']),
    action: readString(value['action']),
    duplicate_field: typeof duplicateField === 'string' ? duplicateField : null,
    details: isRecord(details) ? details : undefined,
  };
}

function unwrapWriteItems({ body, key = 'data' }: { body: unknown; key?: string }): ZohoWriteItem[] {
  const list = readField({ value: body, key });
  if (!Array.isArray(list) || list.length === 0) {
    throw new ZohoCrmError(`Zoho CRM returned an unexpected response (no "${key}" array).`);
  }
  const items = list.map(toWriteItem);
  const failed = items.find((item) => item.status === 'error');
  if (failed) {
    throw new ZohoCrmError(describeZohoError({ error: failed }), undefined, failed.code);
  }
  return items;
}

export function unwrapWriteItem({ body, key = 'data' }: { body: unknown; key?: string }): ZohoWriteItem {
  return unwrapWriteItems({ body, key })[0];
}

function userRef(value: unknown): { id: string | null; name: string | null } {
  return {
    id: readString(readField({ value, key: 'id' })) ?? null,
    name: readString(readField({ value, key: 'name' })) ?? null,
  };
}

export function flattenWriteResult(item: ZohoWriteItem): Record<string, unknown> {
  const d = item.details ?? {};
  const createdBy = userRef(d['Created_By']);
  const modifiedBy = userRef(d['Modified_By']);
  return {
    id: readString(d['id']) ?? null,
    status: item.status ?? null,
    code: item.code ?? null,
    message: item.message ?? null,
    action: item.action ?? null,
    duplicate_field: item.duplicate_field ?? null,
    created_time: readString(d['Created_Time']) ?? null,
    modified_time: readString(d['Modified_Time']) ?? null,
    created_by_id: createdBy.id,
    created_by_name: createdBy.name,
    modified_by_id: modifiedBy.id,
    modified_by_name: modifiedBy.name,
  };
}

const ID_RE = /^[0-9]{1,25}$/;
const API_NAME_RE = /^[A-Za-z0-9_$]{1,100}$/;
const KEY_RE = /^[A-Za-z0-9]{1,200}$/;

export function requireId({ value, name }: { value: unknown; name: string }): string {
  const s = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!ID_RE.test(s)) {
    throw new ZohoCrmError(`${name} must be a numeric Zoho id such as "5725767000000524157" (got "${String(value ?? '')}").`);
  }
  return s;
}

export function requireKey({ value, name }: { value: unknown; name: string }): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!KEY_RE.test(s)) {
    throw new ZohoCrmError(`${name} must be the id string returned by Zoho (letters and digits only).`);
  }
  return s;
}

export function optionalId({ value, name }: { value: unknown; name: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireId({ value, name });
}

export function requireApiName({ value, name }: { value: unknown; name: string }): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!API_NAME_RE.test(s)) {
    throw new ZohoCrmError(`${name} must be a Zoho API name such as "Leads" or "Custom_Field__c" (got "${String(value ?? '')}").`);
  }
  return s;
}

export function optionalInt({ value, name, min, max }: { value: unknown; name: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ZohoCrmError(`${name} must be a whole number between ${min} and ${max}.`);
  }
  return n;
}

export function validatePaging({
  page,
  perPage,
  pageToken,
  tokenSupported,
}: {
  page?: number;
  perPage: number;
  pageToken?: string;
  tokenSupported: boolean;
}): void {
  if (page !== undefined && pageToken) {
    throw new ZohoCrmError('Use either page or page_token, not both.');
  }
  if (page !== undefined && page * perPage > MAX_PAGED_ITEMS) {
    throw new ZohoCrmError(
      `Zoho only serves the first ${MAX_PAGED_ITEMS.toLocaleString('en-US')} items by page number (page × per_page).${
        tokenSupported ? ' Pass next_page_token from the previous result instead.' : ''
      }`,
    );
  }
}

const MAX_PAGED_ITEMS = 2000;

export function parseJsonObject({ value, name }: { value: unknown; name: string }): Record<string, unknown> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  const parsed = typeof value === 'string' ? parseJsonText({ text: value, name }) : value;
  if (!isRecord(parsed)) {
    throw new ZohoCrmError(`${name} must be a JSON object, e.g. {"Lead_Source": "Web"}.`);
  }
  return parsed;
}

function parseJsonText({ text, name }: { text: string; name: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ZohoCrmError(`${name} must be a JSON object, e.g. {"Lead_Source": "Web"}.`);
  }
}

function listItems(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (Array.isArray(item)) {
        return item;
      }
      return typeof item === 'string' ? jsonList(item) ?? [item] : [item];
    });
  }
  const text = String(value);
  return jsonList(text) ?? text.split(',');
}

function jsonList(text: string): unknown[] | undefined {
  const trimmed = text.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function stringList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  return listItems(value)
    .map((v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : ''))
    .filter((v) => v.length > 0);
}

export const WORKFLOW_TRIGGERS = ['workflow', 'approval', 'blueprint', 'pathfinder', 'orchestration'] as const;

const WORKFLOW_TRIGGER_SET = new Set<string>(WORKFLOW_TRIGGERS);

export function parseTriggers({ value, skipAll }: { value: unknown; skipAll?: boolean }): string[] | undefined {
  if (skipAll === true) {
    return [];
  }
  const list = stringList(value);
  if (list.length === 0) {
    return undefined;
  }
  const bad = list.filter((t) => !WORKFLOW_TRIGGER_SET.has(t));
  if (bad.length > 0) {
    throw new ZohoCrmError(`Unknown automation trigger(s): ${bad.join(', ')}. Allowed: ${WORKFLOW_TRIGGERS.join(', ')}.`);
  }
  return list;
}

type ZohoErrorBody = {
  code?: string;
  message?: string;
  status?: string;
  details?: Record<string, unknown>;
};

export type ZohoRequest = {
  auth: ZohoAuth;
  method: HttpMethod;
  path: string;
  version?: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  responseType?: HttpRequest['responseType'];
};

export type ZohoWriteItem = {
  code?: string;
  status?: string;
  message?: string;
  action?: string;
  duplicate_field?: string | null;
  details?: Record<string, unknown>;
};

export type ZohoListInfo = {
  per_page?: number;
  count?: number;
  page?: number;
  more_records?: boolean;
  next_page_token?: string | null;
  previous_page_token?: string | null;
  page_token_expiry?: string | null;
};

export type ZohoListResponse<T> = { data?: T[]; info?: ZohoListInfo };
