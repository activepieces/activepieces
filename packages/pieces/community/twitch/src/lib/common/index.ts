import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { OutputSchemaField, Property } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.twitch.tv/helix';
const PAGE_SIZE = 100;
const LOGIN_PATTERN = /^[a-z0-9_]{1,25}$/;
const tokenUserCache = new WeakMap<TwitchAuthValue, Promise<TwitchUser>>();

function buildUrl({ path, query }: { path: string; query?: QueryParams }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      search.append(key, item);
    }
  }
  const qs = search.toString();
  return qs.length > 0 ? `${BASE_URL}${path}?${qs}` : `${BASE_URL}${path}`;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: {
  auth: TwitchAuthValue;
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: Record<string, unknown>;
}): Promise<{ status: number; body: T }> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: buildUrl({ path, query }),
    headers: {
      'Client-ID': auth.client_id,
      Authorization: `Bearer ${auth.access_token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body,
  });
  return { status: response.status, body: response.body };
}

async function paginate<T>({
  auth,
  path,
  query,
  limit,
  pageSize = PAGE_SIZE,
}: {
  auth: TwitchAuthValue;
  path: string;
  query?: QueryParams;
  limit: number;
  pageSize?: number;
}): Promise<{ items: T[]; nextCursor: string | null; total: number | null }> {
  const items: T[] = [];
  let cursor: string | undefined;
  let total: number | null = null;
  while (items.length < limit) {
    const remaining = limit - items.length;
    const response = await request<HelixPage<T>>({
      auth,
      method: HttpMethod.GET,
      path,
      query: {
        ...query,
        first: String(Math.min(pageSize, remaining)),
        after: cursor,
      },
    });
    const page = response.body.data ?? [];
    if (total === null && typeof response.body.total === 'number') {
      total = response.body.total;
    }
    items.push(...page.slice(0, remaining));
    cursor = response.body.pagination?.cursor;
    if (!cursor || page.length === 0) {
      return { items, nextCursor: null, total };
    }
  }
  return { items, nextCursor: cursor ?? null, total };
}

function normalizeLogin(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return '';
  }
  let candidate = trimmed;
  if (trimmed.includes('/') || trimmed.includes('?')) {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    let segments: string[] = [];
    try {
      segments = new URL(withScheme).pathname.split('/').filter((s) => s.length > 0);
    } catch {
      return '';
    }
    candidate = segments[0] ?? '';
  }
  const login = candidate.replace(/^@/, '').toLowerCase();
  return LOGIN_PATTERN.test(login) ? login : '';
}

function normalizeLogins(inputs: unknown[]): string[] {
  const logins = inputs
    .filter((value): value is string => typeof value === 'string')
    .map((value) => normalizeLogin(value))
    .filter((login) => login.length > 0);
  return Array.from(new Set(logins));
}

function omitKeys<T extends Record<string, unknown>>({
  item,
  keys,
}: {
  item: T;
  keys: string[];
}): Record<string, unknown> {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !keys.includes(key)));
}

function chunk<T>({ items, size }: { items: T[]; size: number }): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function toStringList(values: unknown[] | undefined): string[] {
  if (!values) {
    return [];
  }
  const list = values
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  return Array.from(new Set(list));
}

function validateLimit(limit: number | undefined): number {
  const value = limit ?? 20;
  if (!Number.isInteger(value) || value < 1 || value > 1000) {
    throw new Error('Limit must be a whole number between 1 and 1000.');
  }
  return value;
}

async function getTokenUser({ auth }: { auth: TwitchAuthValue }): Promise<TwitchUser> {
  const cached = tokenUserCache.get(auth);
  if (cached) {
    return cached;
  }
  const pending = fetchTokenUser({ auth });
  tokenUserCache.set(auth, pending);
  try {
    return await pending;
  } catch (error) {
    tokenUserCache.delete(auth);
    throw error;
  }
}

async function fetchTokenUser({ auth }: { auth: TwitchAuthValue }): Promise<TwitchUser> {
  const response = await request<HelixPage<TwitchUser>>({
    auth,
    method: HttpMethod.GET,
    path: '/users',
  });
  const user = response.body.data?.[0];
  if (!user) {
    throw new Error('Could not resolve the Twitch user of this connection.');
  }
  return user;
}

async function requestOrNotFound<T>(params: {
  auth: TwitchAuthValue;
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: Record<string, unknown>;
}): Promise<{ status: number; body: T } | null> {
  try {
    return await request<T>(params);
  } catch (error) {
    if (error instanceof HttpError && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

async function resolveUserId({
  auth,
  value,
}: {
  auth: TwitchAuthValue;
  value: string | undefined;
}): Promise<string> {
  const trimmed = value?.trim();
  if (trimmed) {
    return trimmed;
  }
  const user = await getTokenUser({ auth });
  return user.id;
}

function optionalText(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function requiredText({ value, label }: { value: string | undefined | null; label: string }): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function triState(value: string | undefined | null): boolean | undefined {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return undefined;
}

function assertInteger({
  value,
  min,
  max,
  label,
}: {
  value: number | undefined | null;
  min: number;
  max: number;
  label: string;
}): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return value;
}

function assertTextLength({
  value,
  max,
  label,
}: {
  value: string;
  max: number;
  label: string;
}): string {
  if (value.trim().length === 0 || value.length > max) {
    throw new Error(`${label} must be between 1 and ${max} characters.`);
  }
  return value;
}

function idList({ values, max, label }: { values: unknown[] | undefined; max: number; label: string }): string[] {
  const list = toStringList(values);
  if (list.length > max) {
    throw new Error(`${label} accepts at most ${max} values.`);
  }
  return list;
}

function unixToIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === 'string') {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
      return seconds === 0 ? null : new Date(seconds * 1000).toISOString();
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

function compact(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

function firstItem<T>({ page, label }: { page: HelixPage<T>; label: string }): T {
  const item = page.data?.[0];
  if (item === undefined) {
    throw new Error(`Twitch returned no ${label}.`);
  }
  return item;
}

function broadcasterIdProp() {
  return Property.ShortText({
    displayName: 'Broadcaster ID',
    description: 'Numeric Twitch user ID of the channel. Leave empty for your own channel.',
    required: false,
  });
}

function moderatorIdProp() {
  return Property.ShortText({
    displayName: 'Moderator ID',
    description: 'Numeric Twitch user ID acting as moderator. Leave empty to use your own account.',
    required: false,
  });
}

function userIdProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function limitProp({ max }: { max: number }) {
  return Property.Number({
    displayName: 'Limit',
    description: `Maximum number of items to return (1-${max}).`,
    required: false,
    defaultValue: 20,
  });
}

function yesNoProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function validateLimitMax({ limit, max }: { limit: number | undefined; max: number }): number {
  const value = limit ?? 20;
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`Limit must be a whole number between 1 and ${max}.`);
  }
  return value;
}

const userFields: OutputSchemaField[] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'user_login', label: 'User Login' },
  { key: 'user_name', label: 'User Name' },
];

const listMetaFields: OutputSchemaField[] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'next_cursor', label: 'Next Cursor' },
];

const streamFields: OutputSchemaField[] = [
  { key: 'id', label: 'Stream ID' },
  { key: 'user_id', label: 'Streamer ID' },
  { key: 'user_login', label: 'Streamer Login' },
  { key: 'user_name', label: 'Streamer Name' },
  { key: 'game_id', label: 'Category ID' },
  { key: 'game_name', label: 'Category Name' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'viewer_count', label: 'Viewer Count', format: 'number' },
  { key: 'started_at', label: 'Started At', format: 'datetime' },
  { key: 'language', label: 'Language' },
  { key: 'thumbnail_url', label: 'Thumbnail URL Template' },
  { key: 'tags', label: 'Tags' },
  { key: 'is_mature', label: 'Is Mature', format: 'boolean' },
];

export const twitchCommon = {
  baseUrl: BASE_URL,
  pageSize: PAGE_SIZE,
  request,
  paginate,
  normalizeLogin,
  normalizeLogins,
  chunk,
  omitKeys,
  toStringList,
  validateLimit,
  getTokenUser,
  streamFields,
  userFields,
  listMetaFields,
  requestOrNotFound,
  resolveUserId,
  optionalText,
  requiredText,
  triState,
  assertInteger,
  assertTextLength,
  idList,
  compact,
  unixToIso,
  firstItem,
  validateLimitMax,
  props: {
    broadcasterId: broadcasterIdProp,
    moderatorId: moderatorIdProp,
    userId: userIdProp,
    limit: limitProp,
    yesNo: yesNoProp,
  },
};

export type TwitchAuthValue = {
  access_token: string;
  client_id: string;
};

export type QueryParams = Record<string, string | string[] | undefined>;

export type HelixPage<T> = {
  data?: T[];
  pagination?: { cursor?: string };
  total?: number;
};

export type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  created_at: string;
};

export type TwitchStream = {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tags: string[];
  is_mature: boolean;
};
