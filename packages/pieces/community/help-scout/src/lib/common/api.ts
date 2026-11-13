import {
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import crypto from 'crypto';

class HelpScoutApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, responseBody, message }: { status: number; responseBody: unknown; message?: string }) {
    super(message ?? buildErrorMessage({ status, responseBody }));
    this.name = 'HelpScoutApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function trimTrailingPunctuation(text: string): string {
  return text.trim().replace(/[.!?;:,\s]+$/, '');
}

function extractVendorMessage(responseBody: unknown): string | undefined {
  if (typeof responseBody === 'string' && responseBody.trim().length > 0) {
    return responseBody.trim().slice(0, 300);
  }
  if (!isRecord(responseBody)) {
    return undefined;
  }
  const parts: string[] = [];
  for (const key of ['message', 'error_description', 'error']) {
    const value = responseBody[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      parts.push(trimTrailingPunctuation(value));
      break;
    }
  }
  const embedded = responseBody['_embedded'];
  if (isRecord(embedded)) {
    for (const item of toRecordArray(embedded['errors'])) {
      const detail = describeVendorError(item);
      if (detail) {
        parts.push(detail);
      }
    }
  }
  return parts.length > 0 ? parts.join('; ') : undefined;
}

function describeVendorError(item: Record<string, unknown>): string | undefined {
  const text = (key: string): string | undefined => {
    const value = item[key];
    if (typeof value === 'string' && value.trim().length > 0) return trimTrailingPunctuation(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return undefined;
  };
  const message = text('message') ?? text('description') ?? text('code');
  const path = text('path') ?? text('field');
  const rejected = text('rejectedValue');
  const source = text('source');
  const pieces = [
    path ? `${path}: ${message ?? 'invalid value'}` : message,
    rejected ? `rejected value "${rejected}"` : undefined,
    source && (path || message) ? `in ${source}` : undefined,
  ].filter((piece): piece is string => piece !== undefined && piece.length > 0);
  return pieces.length > 0 ? pieces.join(' ') : undefined;
}

function buildErrorMessage({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const vendorMessage = extractVendorMessage(responseBody);
  const hint = STATUS_HINTS[status];
  const base = vendorMessage
    ? `Help Scout API error (${status}): ${trimTrailingPunctuation(vendorMessage)}`
    : `Help Scout API error (${status})`;
  return hint ? `${base}. ${hint}` : `${base}.`;
}

async function helpScoutApiRequest({
  method,
  path,
  auth,
  body,
  queryParams,
}: {
  method: HttpMethod;
  path: string;
  auth: { access_token: string };
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<HelpScoutResponse> {
  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      Accept: 'application/hal+json, application/json',
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  };
  try {
    const response = await httpClient.sendRequest<unknown>(request);
    if (response.status < 200 || response.status >= 300) {
      throw new HelpScoutApiError({ status: response.status, responseBody: response.body });
    }
    return { status: response.status, body: response.body, headers: response.headers ?? {} };
  } catch (error) {
    if (isHelpScoutApiError(error)) {
      throw error;
    }
    const httpError = readHttpErrorLike(error);
    if (httpError) {
      throw new HelpScoutApiError(httpError);
    }
    throw error;
  }
}

function isHelpScoutApiError(value: unknown): value is { name: string; status: number; responseBody: unknown } {
  return isRecord(value) && value['name'] === 'HelpScoutApiError' && typeof value['status'] === 'number';
}

function readHttpErrorLike(value: unknown): { status: number; responseBody: unknown } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const response = value['response'];
  if (!isRecord(response) || typeof response['status'] !== 'number' || !('body' in response)) {
    return undefined;
  }
  return { status: response['status'], responseBody: response['body'] };
}

async function deleteConversationById({
  auth,
  conversationId,
}: {
  auth: { access_token: string };
  conversationId: string | number;
}): Promise<void> {
  try {
    await helpScoutApiRequest({
      method: HttpMethod.DELETE,
      path: `/conversations/${encodeId(conversationId)}`,
      auth,
    });
  } catch (error) {
    if (isHelpScoutApiError(error) && (error.status === 400 || error.status === 404)) {
      throw new HelpScoutApiError({
        status: error.status,
        responseBody: error.responseBody,
        message: `The conversation was not found or is already deleted (status ${error.status}).`,
      });
    }
    throw error;
  }
}

function stripLinksDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripLinksDeep);
  }
  if (!isRecord(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key !== '_links') {
      result[key] = stripLinksDeep(entry);
    }
  }
  return result;
}

function encodeId(id: string | number): string {
  return encodeURIComponent(String(id).trim());
}

function getResourceId(headers: HttpHeaders): string {
  const value = headers['resource-id'];
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) {
    throw new Error('Help Scout did not return the ID of the created record (no Resource-ID header).');
  }
  return id;
}

function getEmbeddedList({ body, key }: { body: unknown; key: string }): Record<string, unknown>[] {
  if (!isRecord(body)) {
    return [];
  }
  const embedded = body['_embedded'];
  if (!isRecord(embedded)) {
    return [];
  }
  return toRecordArray(embedded[key]);
}

function getTotalPages(body: unknown): number {
  if (!isRecord(body)) {
    return 1;
  }
  const page = body['page'];
  if (!isRecord(page)) {
    return 1;
  }
  const totalPages = page['totalPages'];
  return typeof totalPages === 'number' ? totalPages : 1;
}

async function fetchPaged({
  auth,
  path,
  embedKey,
  queryParams,
  limit,
}: {
  auth: { access_token: string };
  path: string;
  embedKey: string;
  queryParams?: QueryParams;
  limit: number;
}): Promise<{ items: Record<string, unknown>[]; truncated: boolean }> {
  const cap = clampLimit(limit);
  const items: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      path,
      auth,
      queryParams: { ...(queryParams ?? {}), page: String(page) },
    });
    const pageItems = getEmbeddedList({ body: response.body, key: embedKey });
    totalPages = getTotalPages(response.body);
    if (pageItems.length === 0) {
      return { items, truncated: false };
    }
    for (const item of pageItems) {
      if (items.length >= cap) {
        return { items, truncated: true };
      }
      items.push(stripLinks(item));
    }
    if (items.length >= cap) {
      return { items, truncated: page < totalPages };
    }
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);
  return { items, truncated: page <= totalPages };
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || limit === null || !Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_ITEMS);
}

function stripLinks(item: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (key !== '_links') {
      result[key] = value;
    }
  }
  return result;
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function rawBodyToBuffer(rawBody: unknown): Buffer | undefined {
  if (typeof rawBody === 'string') {
    return rawBody.length > 0 ? Buffer.from(rawBody, 'utf8') : undefined;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.length > 0 ? rawBody : undefined;
  }
  return undefined;
}

function verifyWebhookSignature({
  secret,
  signature,
  rawBody,
}: {
  secret: string | undefined;
  signature: string | undefined;
  rawBody: unknown;
}): boolean {
  if (!secret || !signature) {
    return false;
  }
  const bodyBuffer = rawBodyToBuffer(rawBody);
  if (!bodyBuffer) {
    return false;
  }
  const expected = crypto.createHmac('sha1', secret).update(bodyBuffer).digest();
  const received = Buffer.from(signature.trim(), 'base64');
  if (received.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(received, expected);
}

function readHeader({ headers, name }: { headers: Record<string, unknown>; name: string }): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }
  }
  return undefined;
}

async function createWebhook({
  auth,
  url,
  events,
  mailboxId,
}: {
  auth: { access_token: string };
  url: string;
  events: string[];
  mailboxId?: string | number;
}): Promise<StoredWebhook> {
  const secret = crypto.randomBytes(20).toString('hex');
  const body: Record<string, unknown> = { url, events, secret };
  if (mailboxId !== undefined && mailboxId !== null && mailboxId !== '') {
    body['mailboxIds'] = [Number(mailboxId)];
  }
  const response = await helpScoutApiRequest({
    method: HttpMethod.POST,
    path: '/webhooks',
    auth,
    body,
  });
  return { webhookId: getResourceId(response.headers), WebhookSecret: secret };
}

async function deleteWebhook({
  auth,
  webhookId,
}: {
  auth: { access_token: string };
  webhookId: string;
}): Promise<void> {
  try {
    await helpScoutApiRequest({
      method: HttpMethod.DELETE,
      path: `/webhooks/${encodeId(webhookId)}`,
      auth,
    });
  } catch (error) {
    if (isHelpScoutApiError(error) && error.status === 404) {
      return;
    }
    throw error;
  }
}

function verifiedWebhookBody({
  stored,
  headers,
  rawBody,
  body,
}: {
  stored: StoredWebhook | null | undefined;
  headers: Record<string, unknown>;
  rawBody: unknown;
  body: unknown;
}): Record<string, unknown> | undefined {
  const valid = verifyWebhookSignature({
    secret: stored?.WebhookSecret,
    signature: readHeader({ headers, name: 'x-helpscout-signature' }),
    rawBody,
  });
  if (!valid || !isRecord(body)) {
    return undefined;
  }
  return body;
}

function matchesAssignee({
  body,
  assignedTo,
}: {
  body: Record<string, unknown>;
  assignedTo: string | undefined | null;
}): boolean {
  if (!assignedTo) {
    return true;
  }
  const assignee = body['assignee'];
  if (!isRecord(assignee)) {
    return false;
  }
  const id = assignee['id'];
  return id !== undefined && id !== null && String(id) === String(assignedTo);
}

function yesNoToBoolean(value: string | undefined | null): boolean | undefined {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return undefined;
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const result: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item.trim().length > 0) {
      result.push(item.trim());
    } else if (typeof item === 'number') {
      result.push(String(item));
    }
  }
  return result;
}

function mergeTags({
  current,
  requested,
  mode,
}: {
  current: string[];
  requested: string[];
  mode: 'add' | 'remove' | 'replace';
}): string[] {
  const normalize = (tag: string) => tag.trim().toLowerCase();
  if (mode === 'replace') {
    return dedupeTags(requested);
  }
  if (mode === 'remove') {
    const removed = new Set(requested.map(normalize));
    return current.filter((tag) => !removed.has(normalize(tag)));
  }
  return dedupeTags([...current, ...requested]);
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const key = tag.trim().toLowerCase();
    if (key.length > 0 && !seen.has(key)) {
      seen.add(key);
      result.push(tag.trim());
    }
  }
  return result;
}

function readTagNames(conversation: unknown): string[] {
  if (!isRecord(conversation)) {
    return [];
  }
  return toRecordArray(conversation['tags'])
    .map((tag) => tag['tag'])
    .filter((tag): tag is string => typeof tag === 'string');
}

function findFirst({ body, key }: { body: unknown; key: string }): { found: boolean; data: Record<string, unknown> } {
  const list = getEmbeddedList({ body, key });
  return list.length > 0 ? { found: true, data: list[0] } : { found: false, data: {} };
}

function uniqueOrThrow({ values, label }: { values: string[]; label: string }): string[] {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique.`);
  }
  return values;
}

function buildConversationBody(input: ConversationInput): Record<string, unknown> {
  const customer: Record<string, unknown> = {};
  if (input.customerId !== undefined) {
    customer['id'] = input.customerId;
  } else if (input.customerEmail) {
    customer['email'] = input.customerEmail;
  }
  const thread: Record<string, unknown> = { type: input.threadType, text: input.text, customer };
  if (input.imported !== undefined) thread['imported'] = input.imported;
  if (input.threadType === 'customer' || input.threadType === 'reply') {
    if (input.cc.length > 0) thread['cc'] = input.cc;
    if (input.bcc.length > 0) thread['bcc'] = input.bcc;
  }
  const body: Record<string, unknown> = {
    type: input.type,
    mailboxId: input.mailboxId,
    subject: input.subject,
    customer,
    status: input.status,
    threads: [thread],
  };
  if (input.tags.length > 0) body['tags'] = input.tags;
  if (input.userId !== undefined) body['user'] = input.userId;
  if (input.assignTo !== undefined) body['assignTo'] = input.assignTo;
  if (input.imported !== undefined) body['imported'] = input.imported;
  return body;
}

function buildReplyBody(input: ReplyInput): Record<string, unknown> {
  const customer: Record<string, unknown> = {};
  if (input.customerId !== undefined) {
    customer['id'] = input.customerId;
  } else if (input.customerEmail) {
    customer['email'] = input.customerEmail;
  }
  const body: Record<string, unknown> = { text: input.text, customer };
  if (input.draft !== undefined) body['draft'] = input.draft;
  if (input.status) body['status'] = input.status;
  if (input.userId !== undefined) body['user'] = input.userId;
  if (input.cc.length > 0) body['cc'] = input.cc;
  if (input.bcc.length > 0) body['bcc'] = input.bcc;
  return body;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected a numeric Help Scout ID but got "${String(value)}".`);
  }
  return parsed;
}

const STATUS_HINTS: Record<number, string> = {
  401: 'Reconnect the Help Scout connection',
  403: 'The connected Help Scout user lacks permission for this resource',
  404: 'Check that the ID exists and the connected user can access it',
  429: 'Help Scout rate limit reached, retry later',
};

const BASE_URL = 'https://api.helpscout.net/v2';
const DEFAULT_LIMIT = 50;
const MAX_ITEMS = 500;
const MAX_PAGES = 40;

type HelpScoutResponse = {
  status: number;
  body: unknown;
  headers: HttpHeaders;
};

type StoredWebhook = {
  webhookId: string;
  WebhookSecret: string;
};

export const helpScoutApi = {
  request: helpScoutApiRequest,
  encodeId,
  getResourceId,
  getEmbeddedList,
  fetchPaged,
  clampLimit,
  stripLinks,
  stripLinksDeep,
  deleteConversationById,
  escapeQueryValue,
  verifyWebhookSignature,
  readHeader,
  createWebhook,
  deleteWebhook,
  verifiedWebhookBody,
  matchesAssignee,
  yesNoToBoolean,
  toStringList,
  mergeTags,
  readTagNames,
  findFirst,
  isRecord,
  extractVendorMessage,
  isHelpScoutApiError,
  readHttpErrorLike,
  uniqueOrThrow,
  buildConversationBody,
  buildReplyBody,
  optionalNumber,
};
export { BASE_URL, DEFAULT_LIMIT, MAX_ITEMS, HelpScoutApiError };
type ConversationInput = {
  type: string;
  mailboxId: number;
  subject: string;
  customerEmail?: string;
  customerId?: number;
  status: string;
  threadType: string;
  text: string;
  tags: string[];
  cc: string[];
  bcc: string[];
  userId?: number;
  assignTo?: number;
  imported?: boolean;
};

type ReplyInput = {
  text: string;
  customerEmail?: string;
  customerId?: number;
  draft?: boolean;
  status?: string;
  userId?: number;
  cc: string[];
  bcc: string[];
};

export type { HelpScoutResponse, StoredWebhook, ConversationInput, ReplyInput };
