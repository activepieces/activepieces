import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from './auth';
import { LemonSqueezyApiError, RATE_LIMIT_WAITS, getTestModeForKey, isRecord, lsRequest, numericId, readPath, seg } from './client';
import { storeOptions } from './props';

export const createWebhookTriggerKey = (eventName: string) => `_${eventName}_trigger`;

export const generateWebhookSecret = () => randomBytes(20).toString('hex');

export const createStoreDropdownProperty = () =>
  Property.Dropdown({
    displayName: 'Store',
    required: true,
    refreshers: ['auth'],
    auth: lemonSqueezyAuth,
    options: async ({ auth }) => storeOptions({ auth }),
  });

export async function subscribeWebhook({
  apiKey,
  storeId,
  events,
  targetUrl,
  secret,
  testMode,
}: {
  apiKey: string;
  storeId: string;
  events: string[];
  targetUrl: string;
  secret: string;
  testMode: boolean;
}): Promise<string> {
  const { body } = await lsRequest({
    apiKey,
    method: 'POST',
    path: '/webhooks',
    rateLimitWaitsMs: RATE_LIMIT_WAITS.interactive,
    body: {
      data: {
        type: 'webhooks',
        attributes: { url: targetUrl, events, secret, test_mode: testMode },
        relationships: { store: { data: { type: 'stores', id: numericId({ value: storeId, label: 'Store' }) } } },
      },
    },
  });
  const id = readPath({ value: body, path: ['data', 'id'] });
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('Lemon Squeezy did not return a webhook ID.');
  }
  return String(id);
}

export async function unsubscribeWebhook({ apiKey, webhookId }: { apiKey: string; webhookId: string }): Promise<void> {
  try {
    await lsRequest({
      apiKey,
      method: 'DELETE',
      path: `/webhooks/${seg({ value: webhookId, label: 'Webhook ID' })}`,
      rateLimitWaitsMs: RATE_LIMIT_WAITS.interactive,
    });
  } catch (error) {
    if (error instanceof LemonSqueezyApiError && error.status === 404) return;
    throw error;
  }
}

export async function enableWebhook({
  auth,
  store,
  storeId,
  webhookUrl,
  eventName,
}: {
  auth: { secret_text: string };
  store: TriggerStore;
  storeId: unknown;
  webhookUrl: string;
  eventName: string;
}): Promise<void> {
  const apiKey = auth.secret_text;
  const testMode = await getTestModeForKey(apiKey);
  const secret = generateWebhookSecret();
  const webhookId = await subscribeWebhook({
    apiKey,
    storeId: String(storeId ?? ''),
    events: [eventName],
    targetUrl: webhookUrl,
    secret,
    testMode,
  });
  try {
    await store.put(createWebhookTriggerKey(eventName), { webhookId, secret, storeId: String(storeId ?? ''), testMode });
  } catch (error) {
    await unsubscribeWebhook({ apiKey, webhookId }).catch(() => undefined);
    throw error;
  }
}

export async function disableWebhook({
  auth,
  store,
  eventName,
}: {
  auth: { secret_text: string };
  store: TriggerStore;
  eventName: string;
}): Promise<void> {
  const stored = toStoredWebhook(await store.get(createWebhookTriggerKey(eventName)));
  if (stored) {
    await unsubscribeWebhook({ apiKey: auth.secret_text, webhookId: stored.webhookId });
  }
  await store.delete(createWebhookTriggerKey(eventName));
  await store.delete(seenKey(eventName));
}

export function verifyLemonSqueezySignature({
  secret,
  signature,
  rawBody,
}: {
  secret: string | undefined;
  signature: string | undefined;
  rawBody: unknown;
}): boolean {
  const body = rawBodyBuffer(rawBody);
  if (!secret || !signature || !body || !/^[0-9a-f]+$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function handleWebhook({
  payload,
  store,
  eventName,
}: {
  payload: { body: unknown; headers: Record<string, unknown>; rawBody?: unknown };
  store: TriggerStore;
  eventName: string;
}): Promise<unknown[]> {
  const stored = toStoredWebhook(await store.get(createWebhookTriggerKey(eventName)));
  const valid = verifyLemonSqueezySignature({
    secret: stored?.secret,
    signature: headerValue({ headers: payload.headers, name: 'x-signature' }),
    rawBody: payload.rawBody,
  });
  if (!valid) return [];

  const body = payload.body;
  if (readPath({ value: body, path: ['meta', 'event_name'] }) !== eventName) return [];

  const dataId = readPath({ value: body, path: ['data', 'id'] });
  if (typeof dataId !== 'string' && typeof dataId !== 'number') return [body];
  const updatedAt = readPath({ value: body, path: ['data', 'attributes', 'updated_at'] });
  const dedupeId = `${String(dataId)}:${typeof updatedAt === 'string' ? updatedAt : ''}`;
  const seenRaw = await store.get(seenKey(eventName));
  const seen = Array.isArray(seenRaw) ? seenRaw.filter((s): s is string => typeof s === 'string') : [];
  if (seen.includes(dedupeId)) return [];
  await store.put(seenKey(eventName), [...seen, dedupeId].slice(-SEEN_LIMIT));

  return [body];
}

const SEEN_LIMIT = 200;

function seenKey(eventName: string): string {
  return `_${eventName}_seen`;
}

function toStoredWebhook(value: unknown): StoredWebhook | null {
  if (!isRecord(value)) return null;
  const { webhookId, secret } = value;
  if (typeof webhookId !== 'string' || typeof secret !== 'string') return null;
  return { webhookId, secret };
}

function headerValue({ headers, name }: { headers: Record<string, unknown> | undefined; name: string }): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) {
      return Array.isArray(value) ? String(value[0]) : typeof value === 'string' ? value : undefined;
    }
  }
  return undefined;
}

function rawBodyBuffer(rawBody: unknown): Buffer | undefined {
  if (Buffer.isBuffer(rawBody)) return rawBody;
  if (typeof rawBody === 'string') return Buffer.from(rawBody, 'utf8');
  if (rawBody instanceof Uint8Array) return Buffer.from(rawBody);
  return undefined;
}

type TriggerStore = {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<T>;
  delete(key: string): Promise<void>;
};

type StoredWebhook = { webhookId: string; secret: string };
