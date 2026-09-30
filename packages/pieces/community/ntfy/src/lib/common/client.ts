import {
  httpClient,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { ntfyAuth } from '../auth';

const NTFY_ID_PATTERN = /^[-_A-Za-z0-9]{1,64}$/;
const CURSOR_OVERLAP_SECONDS = 60;

function encodeToRFC2047(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text, 'utf-8').toString('base64')}?=`;
}

function baseUrl(auth: NtfyAuthValue): string {
  const raw = (auth.props.base_url ?? '').trim().replace(/\/+$/, '');
  if (!URL.canParse(raw)) {
    throw new Error(
      'The Server URL on the ntfy connection is not a valid URL. Use the full address, e.g. https://ntfy.sh'
    );
  }
  const { protocol } = new URL(raw);
  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error('The Server URL on the ntfy connection must start with https:// or http://');
  }
  return raw;
}

function authHeaders(auth: NtfyAuthValue): Record<string, string> {
  const token = auth.props.access_token;
  if (typeof token === 'string' && token.trim().length > 0) {
    return { Authorization: `Bearer ${token.trim()}` };
  }
  return {};
}

function validateId({ value, label }: { value: unknown; label: string }): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!NTFY_ID_PATTERN.test(id)) {
    throw new Error(
      `${label} "${String(value ?? '')}" is not valid. ntfy only accepts 1-64 letters, digits, "-" and "_".`
    );
  }
  return id;
}

function validateTopicList(value: unknown): string {
  const raw = typeof value === 'string' ? value : '';
  const topics = raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (topics.length === 0) {
    throw new Error('Topic is required. Separate several topics with commas, e.g. alerts,backups');
  }
  return topics.map((t) => validateId({ value: t, label: 'Topic' })).join(',');
}

function parsePriority(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`Priority must be a whole number from 1 (min) to 5 (max), got "${String(value)}".`);
  }
  return n;
}

function normalizePriorityFilter(value: unknown): number[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  return value.map((v) => parsePriority(v)).filter((v): v is number => v !== undefined);
}

function normalizeTags(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const list: unknown[] = Array.isArray(value) ? value : String(value).split(',');
  const tags = list.map((t) => String(t ?? '').trim()).filter((t) => t.length > 0);
  return tags.length > 0 ? tags : undefined;
}

function parseActions(value: unknown): Record<string, unknown>[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? parseJsonOrThrow(value) : value;
  if (!Array.isArray(parsed)) {
    throw new Error('Action Buttons must be a JSON array of action objects.');
  }
  if (parsed.length === 0) {
    return undefined;
  }
  if (parsed.length > 3) {
    throw new Error('ntfy allows at most 3 action buttons per notification.');
  }
  return parsed.map((item) => {
    if (!isRecord(item)) {
      throw new Error('Each action button must be a JSON object with at least "action" and "label".');
    }
    return item;
  });
}

function buildSendNotificationHeaders(input: SendNotificationHeaderInput): HttpHeaders {
  const attach = nonEmpty(input.attach);
  const filename = nonEmpty(input.filename);
  const email = nonEmpty(input.email);
  const call = nonEmpty(input.call);
  const sequenceId = nonEmpty(input.sequence_id);
  return {
    'X-Message': encodeToRFC2047(input.message),
    ...(typeof input.title === 'string' && input.title.length > 0
      ? { 'X-Title': encodeToRFC2047(input.title) }
      : {}),
    'X-Priority': input.priority,
    'X-Tags': input.tags?.join(','),
    'X-Icon': input.icon,
    'X-Actions': input.actions,
    'X-Click': input.click,
    'X-Delay': input.delay,
    ...(attach ? { 'X-Attach': attach } : {}),
    ...(filename ? { 'X-Filename': encodeToRFC2047(filename) } : {}),
    ...(input.markdown === true ? { 'X-Markdown': 'yes' } : {}),
    ...(email ? { 'X-Email': email } : {}),
    ...(call ? { 'X-Call': call } : {}),
    ...(sequenceId ? { 'X-Sequence-ID': validateId({ value: sequenceId, label: 'Sequence ID' }) } : {}),
    ...(input.cache === 'no' ? { 'X-Cache': 'no' } : {}),
    ...(input.firebase === 'no' ? { 'X-Firebase': 'no' } : {}),
  };
}

function buildJsonPublishBody(input: JsonPublishInput): Record<string, unknown> {
  const textFields = ['title', 'click', 'icon', 'attach', 'filename', 'delay', 'email', 'call'] as const;
  const texts = Object.fromEntries(
    textFields
      .map((key) => [key, nonEmpty(input[key])] as const)
      .filter(([, v]) => v !== undefined)
  );
  const message = typeof input.message === 'string' && input.message.trim().length > 0 ? input.message : undefined;
  const priority = parsePriority(input.priority);
  const tags = normalizeTags(input.tags);
  const actions = parseActions(input.actions);
  const sequenceId = nonEmpty(input.sequence_id);
  return {
    topic: validateId({ value: input.topic, label: 'Topic' }),
    ...(message !== undefined ? { message } : {}),
    ...texts,
    ...(priority !== undefined ? { priority } : {}),
    ...(tags ? { tags } : {}),
    ...(actions ? { actions } : {}),
    ...(input.markdown === true ? { markdown: true } : {}),
    ...(sequenceId ? { sequence_id: validateId({ value: sequenceId, label: 'Sequence ID' }) } : {}),
    ...(input.disable_cache === true ? { cache: 'no' } : {}),
    ...(input.disable_firebase === true ? { firebase: 'no' } : {}),
  };
}

function parseNdjson(body: unknown): NtfyMessage[] {
  if (body === undefined || body === null || body === '') {
    return [];
  }
  if (typeof body !== 'string') {
    const items: unknown[] = Array.isArray(body) ? body : [body];
    return items.filter(isNtfyMessage);
  }
  return body
    .split('\n')
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, index }) => {
      const parsed: unknown = parseNdjsonLine({ line, index });
      if (!isNtfyMessage(parsed)) {
        throw new Error(`ntfy returned an unexpected line ${index + 1}: ${line.slice(0, 200)}`);
      }
      return parsed;
    });
}

function serverNowSeconds(headers: HttpHeaders | undefined): number {
  const value = firstHeader({ headers, name: 'date' });
  const parsed = value ? Date.parse(value) : NaN;
  return Math.floor((Number.isNaN(parsed) ? Date.now() : parsed) / 1000);
}

function toNtfyError(error: unknown): unknown {
  const response = isRecord(error) && isRecord(error['response']) ? error['response'] : undefined;
  const status = response?.['status'];
  if (typeof status !== 'number') {
    return error;
  }
  const body = normalizeErrorBody(response?.['body']);
  return new NtfyRequestError({
    status,
    message: `ntfy request failed with HTTP ${status}: ${body}.${statusHint(status)}`,
  });
}

async function request<T = unknown>({
  auth,
  path,
  method,
  headers,
  body,
  queryParams,
  responseType,
}: NtfyRequestParams): Promise<HttpResponse<T>> {
  const url = `${baseUrl(auth)}${path}`;
  try {
    return await httpClient.sendRequest<T>({
      method,
      url,
      body,
      queryParams,
      responseType,
      headers: { ...authHeaders(auth), ...headers },
    });
  } catch (error) {
    throw toNtfyError(error);
  }
}

async function pollMessages({
  auth,
  topics,
  since,
  scheduled,
  filters,
}: {
  auth: NtfyAuthValue;
  topics: string;
  since: string;
  scheduled?: boolean;
  filters?: PollFilters;
}): Promise<{ messages: NtfyMessage[]; truncated: boolean; serverNow: number }> {
  const f = filters ?? {};
  const queryParams: QueryParams = {
    poll: '1',
    since,
    ...(scheduled ? { sched: '1' } : {}),
    ...(f.priority && f.priority.length > 0 ? { priority: f.priority.join(',') } : {}),
    ...(f.tags && f.tags.length > 0 ? { tags: f.tags.join(',') } : {}),
    ...(f.title ? { title: f.title } : {}),
    ...(f.message ? { message: f.message } : {}),
  };
  const response = await request<string>({
    auth,
    method: HttpMethod.GET,
    path: `/${topics}/json`,
    queryParams,
    responseType: 'text',
  });
  const truncatedHeader = firstHeader({ headers: response.headers, name: 'x-messages-truncated' });
  return {
    messages: parseNdjson(response.body),
    truncated: truncatedHeader === '1' || truncatedHeader === 'true',
    serverNow: serverNowSeconds(response.headers),
  };
}

function advanceCursor({ cursor, fetched }: { cursor: NtfyCursor; fetched: NtfyMessage[] }): {
  newItems: NtfyMessage[];
  cursor: NtfyCursor;
} {
  const windowFloor = cursor.lastTime - CURSOR_OVERLAP_SECONDS;
  const messages = fetched.filter((m) => m.event === 'message');
  const alreadySeen = new Set(cursor.seen.map((s) => s.id));
  const newItems = uniqueById(messages)
    .filter((m) => !alreadySeen.has(m.id) && m.time >= windowFloor)
    .sort((a, b) => a.time - b.time);
  const lastTime = messages.reduce((max, m) => Math.max(max, m.time), cursor.lastTime);
  const keepFloor = lastTime - CURSOR_OVERLAP_SECONDS;
  const seen = [...cursor.seen, ...newItems.map((m) => ({ id: m.id, time: m.time }))].filter(
    (s) => s.time >= keepFloor
  );
  return { newItems, cursor: { lastTime, seen } };
}

function uniqueById(messages: NtfyMessage[]): NtfyMessage[] {
  const ids = new Set<string>();
  return messages.filter((m) => {
    if (ids.has(m.id)) {
      return false;
    }
    ids.add(m.id);
    return true;
  });
}

function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNtfyMessage(value: unknown): value is NtfyMessage {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['time'] === 'number' &&
    typeof value['event'] === 'string'
  );
}

function parseJsonOrThrow(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      'Action Buttons must be a JSON array, e.g. [{"action":"view","label":"Open","url":"https://example.com"}]'
    );
  }
}

function parseNdjsonLine({ line, index }: { line: string; index: number }): unknown {
  try {
    return JSON.parse(line);
  } catch {
    throw new Error(`ntfy returned a line that is not JSON (line ${index + 1}): ${line.slice(0, 200)}`);
  }
}

function firstHeader({ headers, name }: { headers: HttpHeaders | undefined; name: string }): string | undefined {
  if (!headers) {
    return undefined;
  }
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  const raw = key ? headers[key] : undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

function normalizeErrorBody(body: unknown): string {
  const parsed = typeof body === 'string' ? tryParseJson(body) : body;
  if (isRecord(parsed) && typeof parsed['error'] === 'string') {
    const code = parsed['code'];
    return `${parsed['error']}${typeof code === 'number' ? ` (ntfy code ${code})` : ''}`;
  }
  if (typeof body === 'string' && body.length > 0) {
    return body.slice(0, 300);
  }
  return 'no details';
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function statusHint(status: number): string {
  if (status === 401 || status === 403) {
    return ' Check the Access Token on the connection and that it may read/write this topic.';
  }
  if (status === 429) {
    return ' The ntfy server rate-limited this request (daily message, email or bandwidth quota). Try again later.';
  }
  if (status === 413) {
    return ' The message or attachment is larger than the server allows.';
  }
  return '';
}

export class NtfyRequestError extends Error {
  readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'NtfyRequestError';
    this.status = status;
  }
}

export const ntfyClient = {
  NTFY_ID_PATTERN,
  CURSOR_OVERLAP_SECONDS,
  encodeToRFC2047,
  baseUrl,
  authHeaders,
  validateId,
  validateTopicList,
  parsePriority,
  normalizePriorityFilter,
  normalizeTags,
  parseActions,
  buildSendNotificationHeaders,
  buildJsonPublishBody,
  parseNdjson,
  serverNowSeconds,
  toNtfyError,
  firstHeader,
  request,
  pollMessages,
  advanceCursor,
};

export type NtfyAuthValue = AppConnectionValueForAuthProperty<typeof ntfyAuth>;

export type NtfyMessage = {
  id: string;
  time: number;
  event: string;
  topic: string;
  expires?: number;
  sequence_id?: string;
  title?: string;
  message?: string;
  priority?: number;
  tags?: string[];
  click?: string;
  icon?: string;
  actions?: Record<string, unknown>[];
  attachment?: Record<string, unknown>;
  content_type?: string;
};

export type NtfyCursor = {
  lastTime: number;
  seen: { id: string; time: number }[];
};

export type PollFilters = {
  priority?: number[];
  tags?: string[];
  title?: string;
  message?: string;
};

export type SendNotificationHeaderInput = {
  message: string;
  title?: string;
  priority?: string;
  tags?: unknown[];
  icon?: string;
  actions?: string;
  click?: string;
  delay?: string;
  attach?: string;
  filename?: string;
  markdown?: boolean;
  email?: string;
  call?: string;
  sequence_id?: string;
  cache?: string;
  firebase?: string;
};

export type JsonPublishInput = {
  topic: unknown;
  message?: unknown;
  title?: unknown;
  priority?: unknown;
  tags?: unknown;
  click?: unknown;
  icon?: unknown;
  attach?: unknown;
  filename?: unknown;
  markdown?: unknown;
  actions?: unknown;
  delay?: unknown;
  email?: unknown;
  call?: unknown;
  sequence_id?: unknown;
  disable_cache?: unknown;
  disable_firebase?: unknown;
};

type NtfyRequestParams = {
  auth: NtfyAuthValue;
  path: string;
  method: HttpMethod;
  headers?: HttpHeaders;
  body?: HttpRequest['body'];
  queryParams?: QueryParams;
  responseType?: HttpRequest['responseType'];
};
