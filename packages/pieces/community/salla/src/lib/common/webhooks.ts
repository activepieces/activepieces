import { HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { SallaAuth, sallaApi } from './client';

async function register({
  auth,
  event,
  url,
  rule,
}: {
  auth: SallaAuth;
  event: string;
  url: string;
  rule?: string;
}): Promise<StoredSallaWebhook> {
  const token = crypto.randomBytes(32).toString('hex');
  const trimmedRule = typeof rule === 'string' ? rule.trim() : '';
  const body: Record<string, unknown> = {
    name: `Activepieces ${event}`,
    event,
    url,
    version: 2,
    headers: [{ key: WEBHOOK_TOKEN_HEADER, value: token }],
  };
  if (trimmedRule.length > 0) {
    body['rule'] = trimmedRule;
  }
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/webhooks/subscribe',
    body,
  });
  const data = response.body.data;
  const id = sallaApi.isRecord(data) ? data['id'] : undefined;
  if (typeof id !== 'number' && typeof id !== 'string') {
    throw new Error('Salla registered the webhook but did not return its ID, so it could not be saved. Check the webhooks in the Salla Partners Portal and try again.');
  }
  const webhookId = String(id);
  const echoedToken = readRegisteredHeader({ headers: sallaApi.isRecord(data) ? data['headers'] : undefined, name: WEBHOOK_TOKEN_HEADER });
  if (echoedToken !== undefined && echoedToken !== token) {
    try {
      await sallaApi.request<unknown>({
        auth,
        method: HttpMethod.PUT,
        path: `/webhooks/${encodeURIComponent(webhookId)}`,
        body: { url, headers: [{ key: WEBHOOK_TOKEN_HEADER, value: token }] },
      });
    } catch (error) {
      await remove({ auth, webhookId }).catch(() => undefined);
      throw error;
    }
  }
  return { webhookId, token, event };
}

function readRegisteredHeader({ headers, name }: { headers: unknown; name: string }): string | undefined {
  const target = name.toLowerCase();
  if (Array.isArray(headers)) {
    for (const entry of headers) {
      if (sallaApi.isRecord(entry) && typeof entry['key'] === 'string' && entry['key'].toLowerCase() === target) {
        return typeof entry['value'] === 'string' ? entry['value'] : undefined;
      }
    }
    return undefined;
  }
  if (sallaApi.isRecord(headers)) {
    const value = readHeader({ headers, name });
    return value;
  }
  return undefined;
}

async function remove({ auth, webhookId }: { auth: SallaAuth; webhookId: string | undefined | null }): Promise<void> {
  if (webhookId === undefined || webhookId === null || String(webhookId).trim().length === 0) {
    return;
  }
  try {
    await sallaApi.request({
      auth,
      method: HttpMethod.DELETE,
      path: '/webhooks/unsubscribe',
      query: { id: String(webhookId).trim() },
    });
  } catch (error) {
    if (sallaApi.isSallaApiError(error) && (error.status === 404 || error.status === 410)) {
      return;
    }
    throw error;
  }
}

function isAuthentic({
  stored,
  headers,
}: {
  stored: StoredSallaWebhook | null | undefined;
  headers: Record<string, unknown> | undefined;
}): boolean {
  if (!stored?.token || !headers) {
    return false;
  }
  const received = readHeader({ headers, name: WEBHOOK_TOKEN_HEADER });
  if (!received) {
    return false;
  }
  const expected = Buffer.from(stored.token, 'utf8');
  const actual = Buffer.from(received.trim(), 'utf8');
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, actual);
}

function readHeader({ headers, name }: { headers: Record<string, unknown>; name: string }): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== target) {
      continue;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
  }
  return undefined;
}

function parseEvent(body: unknown): SallaWebhookEvent | undefined {
  if (!sallaApi.isRecord(body)) {
    return undefined;
  }
  const event = body['event'];
  const data = body['data'];
  if (typeof event !== 'string' || !sallaApi.isRecord(data)) {
    return undefined;
  }
  const merchant = body['merchant'];
  const createdAt = body['created_at'];
  return {
    event,
    merchant: typeof merchant === 'number' || typeof merchant === 'string' ? merchant : undefined,
    createdAt: typeof createdAt === 'string' ? createdAt : undefined,
    data,
  };
}

function verifiedEvent({
  stored,
  headers,
  body,
  expectedEvents,
}: {
  stored: StoredSallaWebhook | null | undefined;
  headers: Record<string, unknown> | undefined;
  body: unknown;
  expectedEvents: string[];
}): SallaWebhookEvent | undefined {
  if (!isAuthentic({ stored, headers })) {
    return undefined;
  }
  const parsed = parseEvent(body);
  if (!parsed || !expectedEvents.includes(parsed.event)) {
    return undefined;
  }
  return parsed;
}

function dedupeKey(event: SallaWebhookEvent): string {
  const id = event.data['id'];
  const idPart = typeof id === 'number' || typeof id === 'string' ? String(id) : fallbackIdPart(event.data);
  return `${event.event}:${idPart}:${event.createdAt ?? ''}:${contentDigest(event.data)}`;
}

function contentDigest(data: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

function fallbackIdPart(data: Record<string, unknown>): string {
  for (const key of ['cart', 'order', 'customer']) {
    const nested = data[key];
    if (!sallaApi.isRecord(nested)) {
      continue;
    }
    const nestedId = nested['id'];
    if (typeof nestedId === 'number' || (typeof nestedId === 'string' && nestedId.trim().length > 0)) {
      return `${key}-${String(nestedId).trim()}`;
    }
  }
  return `sha256-${contentDigest(data)}`;
}

async function listWebhookEvents({ auth }: { auth: SallaAuth }): Promise<SallaWebhookEventOption[]> {
  const response = await sallaApi.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/webhooks/events' });
  const data = Array.isArray(response.body.data) ? response.body.data : [];
  const seen = new Set<string>();
  const events: SallaWebhookEventOption[] = [];
  for (const entry of data) {
    if (!sallaApi.isRecord(entry) || typeof entry['event'] !== 'string') {
      continue;
    }
    const event = entry['event'].trim();
    if (event.length === 0 || seen.has(event)) {
      continue;
    }
    seen.add(event);
    const label = typeof entry['label'] === 'string' && entry['label'].trim().length > 0 ? entry['label'].trim() : event;
    const id = entry['id'];
    events.push({ event, label, id: typeof id === 'number' || typeof id === 'string' ? id : null });
  }
  return events;
}

const WEBHOOK_TOKEN_HEADER = 'X-Activepieces-Webhook-Token';

export const sallaWebhooks = {
  register,
  remove,
  isAuthentic,
  readHeader,
  parseEvent,
  verifiedEvent,
  dedupeKey,
  contentDigest,
  listWebhookEvents,
};

export { WEBHOOK_TOKEN_HEADER };

type StoredSallaWebhook = {
  webhookId: string;
  token: string;
  event: string;
};

type SallaWebhookEvent = {
  event: string;
  merchant?: number | string;
  createdAt?: string;
  data: Record<string, unknown>;
};

type SallaWebhookEventOption = {
  event: string;
  label: string;
  id: number | string | null;
};

export type { StoredSallaWebhook, SallaWebhookEvent, SallaWebhookEventOption };
