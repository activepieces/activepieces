import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';

type SystemeAuth = string | { apiKey: string };

type QueryValue = string | number | boolean | undefined | null;

class SystemeIoApiError extends Error {
  readonly status: number | undefined;
  readonly responseBody: unknown;

  constructor({ message, status, body }: { message: string; status?: number; body?: unknown }) {
    super(message);
    this.name = 'SystemeIoApiError';
    this.status = status;
    this.responseBody = body;
  }
}

function responseOf(error: unknown): { status?: number; body?: unknown } | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return undefined;
  }
  const status: unknown = Reflect.get(response, 'status');
  return {
    status: typeof status === 'number' ? status : undefined,
    body: Reflect.get(response, 'body'),
  };
}

function vendorDetail(body: unknown): string | undefined {
  let parsed: unknown = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return body.trim() === '' ? undefined : body.slice(0, 500);
    }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return undefined;
  }
  const violations: unknown = Reflect.get(parsed, 'violations');
  if (Array.isArray(violations) && violations.length > 0) {
    const parts = violations
      .map((v: unknown) => {
        if (typeof v !== 'object' || v === null) return undefined;
        const path: unknown = Reflect.get(v, 'propertyPath');
        const message: unknown = Reflect.get(v, 'message');
        if (typeof message !== 'string') return undefined;
        return typeof path === 'string' && path !== '' ? `${path}: ${message}` : message;
      })
      .filter((p): p is string => typeof p === 'string');
    if (parts.length > 0) {
      return parts.join('; ');
    }
  }
  const detail: unknown = Reflect.get(parsed, 'detail');
  if (typeof detail === 'string' && detail !== '') {
    return detail;
  }
  const message: unknown = Reflect.get(parsed, 'message');
  if (typeof message === 'string' && message !== '') {
    return message;
  }
  const title: unknown = Reflect.get(parsed, 'title');
  return typeof title === 'string' && title !== '' ? title : undefined;
}

function toApiError(error: unknown): Error {
  const response = responseOf(error);
  if (!response || response.status === undefined) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = response.status;
  const detail = vendorDetail(response.body);
  let hint = '';
  if (status === 401) {
    hint = ' Check that the API key is valid (Dashboard > Profile > MCP & API keys).';
  } else if (status === 403) {
    hint = ' This API key may not access this record or feature; check the id and your Systeme.io plan.';
  } else if (status === 404) {
    hint = ' The record was not found; check the id.';
  } else if (status === 429) {
    hint = ' Rate limited by Systeme.io (the quota is shared across all API keys); retry later.';
  }
  const text = `Systeme.io API error ${status}${detail ? `: ${detail}` : ''}`;
  return new SystemeIoApiError({
    message: `${/[.!?]$/.test(text) ? text : `${text}.`}${hint}`,
    status,
    body: response.body,
  });
}

export function apiErrorStatus(error: unknown): number | undefined {
  if (error instanceof SystemeIoApiError) {
    return error.status;
  }
  if (typeof error === 'object' && error !== null) {
    const status: unknown = Reflect.get(error, 'status');
    if (typeof status === 'number') {
      return status;
    }
  }
  return responseOf(error)?.status;
}

function requireId({ value, name }: { value: unknown; name: string }): number {
  const raw = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  const id = /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id)) {
    throw new Error(`${name} must be a positive whole number (a Systeme.io id), got "${String(value ?? '')}".`);
  }
  return id;
}

function optionalId({ value, name }: { value: unknown; name: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireId({ value, name });
}

function idList({ value, name }: { value: unknown; name: string }): number[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be a list of ids.`);
  }
  return value.map((item: unknown) => requireId({ value: item, name }));
}

function clampInt({ value, name, min, max, fallback }: { value: unknown; name: string; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be a whole number between ${min} and ${max}.`);
  }
  return parsed;
}

function phpJsonEncode(value: unknown): string {
  const json = JSON.stringify(value);
  let out = '';
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const code = json.charCodeAt(i);
    if (ch === '/') {
      out += '\\/';
    } else if (code > 0x7f) {
      out += '\\u' + code.toString(16).padStart(4, '0');
    } else {
      out += ch;
    }
  }
  return out;
}

function signatureCandidates(rawBody: unknown): string[] {
  const candidates: string[] = [];
  let text: string | undefined;
  if (typeof rawBody === 'string') {
    text = rawBody;
  } else if (Buffer.isBuffer(rawBody)) {
    text = rawBody.toString('utf8');
  }
  if (text !== undefined && text !== '') {
    candidates.push(text);
    try {
      const normalized = phpJsonEncode(JSON.parse(text));
      if (normalized !== text) {
        candidates.push(normalized);
      }
    } catch {
      return candidates;
    }
  } else if (typeof rawBody === 'object' && rawBody !== null) {
    candidates.push(phpJsonEncode(rawBody));
  }
  return candidates;
}

function hmacMatches({ secret, input, signature }: { secret: string; input: string; signature: string }): boolean {
  const expected = crypto.createHmac('sha256', secret).update(input, 'utf8').digest('hex');
  const given = signature.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(given) || given.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(given, 'hex'), Buffer.from(expected, 'hex'));
}

function webhookOwner({ webhookUrl }: { webhookUrl: string }): string {
  let parts: string[] = [];
  try {
    parts = new URL(webhookUrl).pathname.split('/').filter((part) => part !== '');
  } catch {
    parts = [];
  }
  const at = parts.lastIndexOf('webhooks');
  const owner = (at >= 0 ? parts.slice(at + 1) : []).join('-');
  if (/^[A-Za-z0-9_-]{1,80}$/.test(owner)) {
    return owner;
  }
  return crypto.createHash('sha256').update(webhookUrl, 'utf8').digest('hex').slice(0, 16);
}

function webhookName({ eventType, webhookUrl }: { eventType: string; webhookUrl: string }): string {
  return `Activepieces Webhook - ${eventType} - ${webhookOwner({ webhookUrl })}`;
}

const PAGE_SIZE_FALLBACKS = [50, 20, 10];

const WEBHOOK_SCHEMA_VERSIONS: Record<string, number> = {
  CONTACT_CREATED: 1,
  CONTACT_TAG_ADDED: 1,
  CONTACT_TAG_REMOVED: 1,
  CONTACT_OPT_IN: 1,
  SALE_NEW: 2,
  SALE_CANCELED: 2,
};

function webhookSchemaVersion({ eventType }: { eventType: string }): number {
  const version = WEBHOOK_SCHEMA_VERSIONS[eventType];
  if (version === undefined) {
    throw new Error(`Unknown Systeme.io webhook event ${eventType}.`);
  }
  return version;
}

function isPageLimitRejection(error: unknown): boolean {
  if (apiErrorStatus(error) !== 422) {
    return false;
  }
  const body = error instanceof SystemeIoApiError ? error.responseBody : responseOf(error)?.body;
  const text = typeof body === 'string' ? body : JSON.stringify(body ?? '');
  return text.includes('pagination.limit');
}

export const systemeIoCommon = {
  baseUrl: 'https://api.systeme.io/api',

  webhookName,

  async apiCall<T>({
    method,
    url,
    body,
    auth,
    headers,
    queryParams,
  }: {
    method: HttpMethod;
    url: string;
    body?: unknown;
    auth: SystemeAuth;
    headers?: Record<string, string>;
    queryParams?: Record<string, QueryValue>;
  }): Promise<T> {
    const apiKey = typeof auth === 'string' ? auth : auth.apiKey;

    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(queryParams ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        query[key] = String(value);
      }
    }

    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${this.baseUrl}${url}`,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          ...headers,
        },
        queryParams: Object.keys(query).length > 0 ? query : undefined,
        body,
      });
      return response.body;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async paginate<T extends { id?: unknown }>({
    auth,
    url,
    query,
    maxItems,
    pageSize = 100,
    startingAfter,
  }: {
    auth: SystemeAuth;
    url: string;
    query?: Record<string, QueryValue>;
    maxItems: number;
    pageSize?: number;
    startingAfter?: number;
  }): Promise<{ items: T[]; hasMore: boolean; nextCursor: number | null }> {
    const items: T[] = [];
    let cursor = startingAfter;
    let vendorHasMore = true;
    let limit = Math.max(10, Math.min(100, pageSize));
    while (items.length < maxItems && vendorHasMore) {
      let page: { items?: T[]; hasMore?: boolean };
      try {
        page = await this.apiCall<{ items?: T[]; hasMore?: boolean }>({
          method: HttpMethod.GET,
          url,
          auth,
          queryParams: { ...query, limit, startingAfter: cursor },
        });
      } catch (error) {
        const smaller = PAGE_SIZE_FALLBACKS.find((size) => size < limit);
        if (smaller === undefined || !isPageLimitRejection(error)) {
          throw error;
        }
        limit = smaller;
        continue;
      }
      const pageItems = Array.isArray(page?.items) ? page.items : [];
      vendorHasMore = page?.hasMore === true && pageItems.length > 0;
      const room = maxItems - items.length;
      const taken = pageItems.slice(0, room);
      items.push(...taken);
      if (taken.length < pageItems.length) {
        vendorHasMore = true;
        break;
      }
      const lastId = Number(pageItems[pageItems.length - 1]?.id);
      if (!Number.isInteger(lastId) || lastId <= 0) {
        break;
      }
      cursor = lastId;
    }
    const lastReturned = Number(items[items.length - 1]?.id);
    const hasMore = vendorHasMore;
    return {
      items,
      hasMore,
      nextCursor: hasMore && Number.isInteger(lastReturned) && lastReturned > 0 ? lastReturned : null,
    };
  },

  verifyWebhookSignature: ({
    secret,
    signatureHeader,
    rawBody,
  }: {
    secret?: string;
    signatureHeader?: string | string[];
    rawBody?: unknown;
  }): boolean => {
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!secret || !signature || rawBody === undefined || rawBody === null) {
      return false;
    }
    try {
      return signatureCandidates(rawBody).some((candidate) => hmacMatches({ secret, input: candidate, signature }));
    } catch {
      return false;
    }
  },

  async createWebhook({
    eventType,
    webhookUrl,
    auth,
    secret,
  }: {
    eventType: string;
    webhookUrl: string;
    auth: SystemeAuth;
    secret: string;
  }) {
    return this.apiCall<{ id: string }>({
      method: HttpMethod.POST,
      url: '/webhooks',
      body: {
        name: webhookName({ eventType, webhookUrl }),
        url: webhookUrl,
        subscriptions: [{ event: eventType, schemaVersion: webhookSchemaVersion({ eventType }) }],
        secret: secret,
      },
      auth,
    });
  },

  async listWebhooks({ auth }: { auth: SystemeAuth }): Promise<Array<{ id: string; url?: string; name?: string }>> {
    const page = await this.apiCall<{ items?: Array<{ id: string; url?: string; name?: string }> }>({
      method: HttpMethod.GET,
      url: '/webhooks',
      auth,
    });
    return Array.isArray(page?.items) ? page.items : [];
  },

  async deleteWebhook({
    webhookId,
    auth,
  }: {
    webhookId: string;
    auth: SystemeAuth;
  }) {
    return this.apiCall({
      method: HttpMethod.DELETE,
      url: `/webhooks/${encodeURIComponent(webhookId)}`,
      auth,
    });
  },

  async getContacts({
    auth,
    limit = 50,
    startingAfter,
  }: {
    auth: string | { apiKey: string };
    limit?: number;
    startingAfter?: string;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (startingAfter) params.append('startingAfter', startingAfter);

    return this.apiCall({
      method: HttpMethod.GET,
      url: `/contacts?${params.toString()}`,
      auth,
    });
  },

  async findContactsByEmail({ auth, email }: { auth: SystemeAuth; email: string }) {
    const page = await this.apiCall<{ items?: SystemeContact[] }>({
      method: HttpMethod.GET,
      url: '/contacts',
      auth,
      queryParams: { email, limit: 10 },
    });
    return Array.isArray(page?.items) ? page.items : [];
  },

  async getContact({
    contactId,
    auth,
  }: {
    contactId: string | number;
    auth: SystemeAuth;
  }) {
    return this.apiCall<SystemeContact>({
      method: HttpMethod.GET,
      url: `/contacts/${requireId({ value: contactId, name: 'Contact ID' })}`,
      auth,
    });
  },

  async getTags({
    auth,
    query,
    maxItems = 1000,
  }: {
    auth: SystemeAuth;
    query?: string;
    maxItems?: number;
  }) {
    const result = await this.paginate<SystemeTag>({
      auth,
      url: '/tags',
      query: { query },
      maxItems,
    });
    return { items: result.items, hasMore: result.hasMore };
  },

  async getContactFields({
    auth,
  }: {
    auth: string | { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: '/contact_fields',
      auth,
    });
  },
};

export const systemeIoInput = { requireId, optionalId, idList, clampInt, phpJsonEncode };

export type SystemeContact = {
  id: number;
  email: string;
  registeredAt?: string;
  locale?: string;
  sourceURL?: string | null;
  unsubscribed?: boolean;
  bounced?: boolean;
  needsConfirmation?: boolean;
  fields?: { fieldName?: string; slug: string; value: string | null }[];
  tags?: { id: number; name: string }[];
};

export type SystemeTag = { id: number; name: string; createdAt?: string };
