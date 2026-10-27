import { createHmac, timingSafeEqual } from 'crypto';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { ArteemisApiError, arteemisApi, isRecord } from './client';
import { ArteemisEvent, ArteemisEventType, flattenEvent } from './events';

const STORE_KEY = 'arteemis_webhook';
const SEEN_KEY = 'arteemis_webhook_seen_event_ids';
const MAX_REMEMBERED_EVENTS = 500;
/** How far a signature's timestamp may be from now, either way (Standard Webhooks). */
const TOLERANCE_SECONDS = 5 * 60;

type Endpoint = { id: string; url: string; events: string[] };
type StoredWebhook = { endpointId: string; secret: string };

export type WebhookStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
  delete: (key: string) => Promise<void>;
};

async function deleteEndpoint({ apiKey, endpointId }: { apiKey: string; endpointId: string }): Promise<void> {
  try {
    await arteemisApi.call({ apiKey, tool: 'webhooks_manage', body: { operation: 'delete', endpoint_id: endpointId } });
  } catch (error) {
    // Already gone (deleted in Arteemis): nothing left to remove.
    if (error instanceof ArteemisApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

/** Creates the flow's own Arteemis endpoint for one event, and keeps its id and signing secret. */
async function enable({
  apiKey,
  webhookUrl,
  store,
  event,
  label,
}: {
  apiKey: string;
  webhookUrl: string;
  store: WebhookStore;
  event: ArteemisEventType;
  label: string;
}): Promise<void> {
  // The URL belongs to this flow alone: an endpoint already on it is a leftover, removed first.
  const { data: listed } = await arteemisApi.call<{ endpoints: Endpoint[] }>({ apiKey, tool: 'webhooks_list' });
  for (const endpoint of listed.endpoints.filter((item) => item.url === webhookUrl)) {
    await deleteEndpoint({ apiKey, endpointId: endpoint.id });
  }
  const { data } = await arteemisApi.call<{ endpoint: Endpoint; secret: string }>({
    apiKey,
    tool: 'webhooks_manage',
    body: { operation: 'create', url: webhookUrl, events: [event], description: `Activepieces: ${label}` },
  });
  try {
    await store.put<StoredWebhook>(STORE_KEY, { endpointId: data.endpoint.id, secret: data.secret });
  } catch (error) {
    await deleteEndpoint({ apiKey, endpointId: data.endpoint.id });
    throw error;
  }
}

async function disable({ apiKey, store }: { apiKey: string; store: WebhookStore }): Promise<void> {
  const stored = parseStored(await store.get<unknown>(STORE_KEY));
  if (stored !== undefined) {
    await deleteEndpoint({ apiKey, endpointId: stored.endpointId });
  }
  await store.delete(STORE_KEY);
  await store.delete(SEEN_KEY);
}

function headerValue(headers: Record<string, unknown> | undefined, name: string): string | undefined {
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name);
  const value = Array.isArray(entry?.[1]) ? entry?.[1][0] : entry?.[1];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Standard Webhooks: `webhook-signature` holds `v1,<base64 HMAC-SHA256>` entries, separated by spaces, of
 * `<webhook-id>.<webhook-timestamp>.<raw body>` keyed with the base64 that follows `whsec_` in the secret.
 */
function verifySignature({
  secret,
  headers,
  rawBody,
  nowSeconds,
}: {
  secret: string;
  headers: Record<string, unknown> | undefined;
  rawBody: unknown;
  nowSeconds: number;
}): boolean {
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    return false;
  }
  const id = headerValue(headers, 'webhook-id');
  const timestamp = headerValue(headers, 'webhook-timestamp');
  const signatures = headerValue(headers, 'webhook-signature');
  if (id === undefined || timestamp === undefined || signatures === undefined) {
    return false;
  }
  const sentAt = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(sentAt) || Math.abs(nowSeconds - sentAt) > TOLERANCE_SECONDS) {
    return false;
  }
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.`).update(rawBody).digest();
  return signatures.split(' ').some((entry) => {
    const [version, signature] = entry.split(',');
    if (version !== 'v1' || !signature) {
      return false;
    }
    const given = Buffer.from(signature, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

function parseBody(body: unknown): Record<string, unknown> | undefined {
  if (isRecord(body)) {
    return body;
  }
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    try {
      const parsed: unknown = JSON.parse(body.toString());
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseStored(value: unknown): StoredWebhook | undefined {
  if (!isRecord(value) || typeof value['endpointId'] !== 'string' || typeof value['secret'] !== 'string') {
    return undefined;
  }
  return { endpointId: value['endpointId'], secret: value['secret'] };
}

function isEvent(value: Record<string, unknown>): value is ArteemisEvent {
  return typeof value['id'] === 'string' && typeof value['type'] === 'string' && isRecord(value['data']);
}

/**
 * One delivery, checked against the endpoint's secret: the flattened event, or undefined for a forged or replayed
 * delivery, a test ping, another event type, or an event already received (Arteemis retries a delivery that got no
 * answer, for about 21 hours).
 */
async function receive({
  payload,
  store,
  event,
  nowMs,
}: {
  payload: { body: unknown; rawBody?: unknown; headers?: Record<string, unknown> };
  store: WebhookStore;
  event: ArteemisEventType;
  nowMs: number;
}): Promise<Record<string, unknown> | undefined> {
  const stored = parseStored(await store.get<unknown>(STORE_KEY));
  if (stored === undefined) {
    return undefined;
  }
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!verifySignature({ secret: stored.secret, headers: payload.headers, rawBody: payload.rawBody, nowSeconds })) {
    return undefined;
  }
  const body = parseBody(payload.body) ?? parseBody(payload.rawBody);
  if (body === undefined || !isEvent(body) || body.type !== event) {
    return undefined;
  }
  const seen = (await store.get<string[]>(SEEN_KEY)) ?? [];
  if (seen.includes(body.id)) {
    return undefined;
  }
  await store.put(SEEN_KEY, [...seen, body.id].slice(-MAX_REMEMBERED_EVENTS));
  return { ...flattenEvent(body), [DEDUPE_KEY_PROPERTY]: body.id };
}

export const arteemisWebhook = { enable, disable, receive, verifySignature };
