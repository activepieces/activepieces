import { createHmac, timingSafeEqual } from 'crypto';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { isRecord } from './client';

export function verifyStandardWebhook({
  secret,
  rawBody,
  headers,
  nowMs,
}: {
  secret: string;
  rawBody: unknown;
  headers: Record<string, string | undefined> | undefined;
  nowMs: number;
}): boolean {
  const raw = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : undefined;
  const id = headerValue({ headers, name: 'webhook-id' });
  const timestamp = headerValue({ headers, name: 'webhook-timestamp' });
  const signatures = headerValue({ headers, name: 'webhook-signature' });
  if (raw === undefined || id === undefined || timestamp === undefined || signatures === undefined || !/^\d+$/.test(timestamp)) {
    return false;
  }
  const timestampMs = Number(timestamp) * 1000;
  if (nowMs - timestampMs > REPLAY_WINDOW_MS || timestampMs - nowMs > CLOCK_SKEW_MS) {
    return false;
  }
  const key = Buffer.from(secret.startsWith(SECRET_PREFIX) ? secret.slice(SECRET_PREFIX.length) : secret, 'base64');
  if (key.length === 0) {
    return false;
  }
  const expected = Buffer.from(createHmac('sha256', key).update(`${id}.${timestamp}.${raw}`).digest('base64'), 'utf8');
  return signatures
    .split(' ')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('v1,'))
    .some((entry) => {
      const received = Buffer.from(entry.slice(3), 'utf8');
      return received.length === expected.length && timingSafeEqual(received, expected);
    });
}

export async function handleFormbricksWebhook({
  payload,
  store,
  storeKey,
  eventType,
  nowMs,
}: {
  payload: { body: unknown; rawBody?: unknown; headers: Record<string, string | undefined> };
  store: { get<T>(key: string): Promise<T | null>; put<T>(key: string, value: T): Promise<T> };
  storeKey: string;
  eventType: string;
  nowMs: number;
}): Promise<unknown[]> {
  const stored = readStoredWebhook(await store.get<unknown>(storeKey));
  if (stored.secret !== null && !verifyStandardWebhook({ secret: stored.secret, rawBody: payload.rawBody, headers: payload.headers, nowMs })) {
    return [];
  }
  const body = parseBody(payload.body);
  if (body === undefined || body['event'] !== eventType || !isRecord(body['data'])) {
    return [];
  }
  const deliveryId = headerValue({ headers: payload.headers, name: 'webhook-id' });
  if (deliveryId === undefined) {
    return [body];
  }
  const timestamp = headerValue({ headers: payload.headers, name: 'webhook-timestamp' });
  const signedAtSec = timestamp !== undefined && /^\d+$/.test(timestamp) ? Number(timestamp) : Math.floor(nowMs / 1000);
  const slotKey = `${storeKey}_deliveries_${signedAtSec % DELIVERY_SLOTS}`;
  const slot = await store.get<{ second: number; ids: string[] }>(slotKey);
  const seen = slot !== null && slot.second === signedAtSec && Array.isArray(slot.ids) ? slot.ids : [];
  if (seen.includes(deliveryId)) {
    return [];
  }
  await store.put(slotKey, { second: signedAtSec, ids: [...seen, deliveryId] });
  return [{ ...body, [DEDUPE_KEY_PROPERTY]: deliveryId }];
}

export function readStoredWebhook(value: unknown): { webhookId: string | null; secret: string | null } {
  if (!isRecord(value)) {
    return { webhookId: null, secret: null };
  }
  if (typeof value['webhookId'] === 'string') {
    return { webhookId: value['webhookId'], secret: typeof value['secret'] === 'string' && value['secret'].length > 0 ? value['secret'] : null };
  }
  const legacy = value['data'];
  if (isRecord(legacy) && typeof legacy['id'] === 'string') {
    return { webhookId: legacy['id'], secret: null };
  }
  return { webhookId: null, secret: null };
}

function headerValue({ headers, name }: { headers: Record<string, string | undefined> | undefined; name: string }): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
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

const SECRET_PREFIX = 'whsec_';
const REPLAY_WINDOW_MS = 15 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const DELIVERY_SLOTS = Math.ceil((REPLAY_WINDOW_MS + CLOCK_SKEW_MS) / 1000) + 60;
