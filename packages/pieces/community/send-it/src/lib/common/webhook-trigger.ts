import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { SendItRecord, apiKeyOf, isNotFound, isRecord, optionalText, sendItApi } from './client';

export const sendItWebhook = { enable, disable, handle, verifySignature };

export function sendItWebhookHooks({ event, sampleData, mapEvent }: SendItWebhookHooksParams) {
  return {
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context: { auth: unknown; store: Store; webhookUrl: string }): Promise<void> {
      await enable({ apiKey: apiKeyOf(context.auth), store: context.store, event, webhookUrl: context.webhookUrl });
    },
    async onDisable(context: { auth: unknown; store: Store }): Promise<void> {
      await disable({ apiKey: apiKeyOf(context.auth), store: context.store });
    },
    async run(context: { store: Store; payload: WebhookPayload }): Promise<unknown[]> {
      return handle({ store: context.store, event, payload: context.payload, mapEvent });
    },
    async test(): Promise<unknown[]> {
      return [sampleData];
    },
  } satisfies { type: TriggerStrategy.WEBHOOK } & Record<string, unknown>;
}

async function enable({ apiKey, store, event, webhookUrl }: { apiKey: string; store: Store; event: string; webhookUrl: string }): Promise<void> {
  const response = await sendItApi.request({ apiKey, method: HttpMethod.POST, path: '/webhooks', operation: 'create webhook', body: { url: webhookUrl, events: [event] } });
  const webhook = isRecord(response) && isRecord(response['webhook']) ? response['webhook'] : {};
  const webhookId = optionalText(webhook['id']);
  const secret = optionalText(webhook['secret']);
  if (webhookId === undefined || secret === undefined) {
    if (webhookId !== undefined) {
      await deleteWebhook({ apiKey, webhookId }).catch(() => undefined);
    }
    throw new Error('SendIt created the webhook but returned no webhook ID or signing secret.');
  }
  try {
    await store.put(WEBHOOK_ID_KEY, webhookId);
    await store.put(SECRET_KEY, secret);
  } catch (error) {
    await deleteWebhook({ apiKey, webhookId }).catch(() => undefined);
    throw error;
  }
}

async function disable({ apiKey, store }: { apiKey: string; store: Store }): Promise<void> {
  const webhookId = optionalText(await store.get<string>(WEBHOOK_ID_KEY));
  if (webhookId !== undefined) {
    await deleteWebhook({ apiKey, webhookId });
  }
  await store.delete(WEBHOOK_ID_KEY);
  await store.delete(SECRET_KEY);
  await store.delete(SEEN_KEY);
  const index = await readSeenIndex({ store });
  for (let start = 0; start < index.length; start += SEEN_PRUNE_PER_EVENT) {
    await Promise.all(index.slice(start, start + SEEN_PRUNE_PER_EVENT).map((entry) => store.delete(`${SEEN_KEY_PREFIX}${entry.id}`)));
  }
  await store.delete(SEEN_INDEX_KEY);
}

async function deleteWebhook({ apiKey, webhookId }: { apiKey: string; webhookId: string }): Promise<void> {
  try {
    await sendItApi.request({ apiKey, method: HttpMethod.DELETE, path: `/webhooks/${encodeURIComponent(webhookId)}`, operation: 'delete webhook' });
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
}

async function handle({
  store,
  event,
  payload,
  mapEvent,
  now = Date.now(),
}: {
  store: Store;
  event: string;
  payload: WebhookPayload;
  mapEvent: (body: SendItRecord) => SendItRecord;
  now?: number;
}): Promise<unknown[]> {
  const body = payload.body;
  if (!isRecord(body) || body['event'] !== event) {
    return [];
  }
  const secret = optionalText(await store.get<string>(SECRET_KEY));
  if (secret === undefined) {
    const webhookId = optionalText(await store.get<string>(WEBHOOK_ID_KEY));
    if (webhookId === undefined) {
      return [];
    }
  } else if (!verifySignature({ secret, header: headerOf({ headers: payload.headers, name: 'x-sendit-signature' }), rawBody: rawBodyText(payload.rawBody), now })) {
    return [];
  }
  const deliveryId = optionalText(body['deliveryId']);
  if (deliveryId !== undefined) {
    const markerKey = `${SEEN_KEY_PREFIX}${deliveryId}`;
    const legacy = await store.get<string[]>(SEEN_KEY);
    if ((await store.get<number>(markerKey)) !== null || (Array.isArray(legacy) && legacy.includes(deliveryId))) {
      return [];
    }
    await store.put(markerKey, now);
    await pruneSeenMarkers({ store, added: { id: deliveryId, at: now }, now });
  }
  const mapped = mapEvent(body);
  return [deliveryId === undefined ? mapped : { ...mapped, [DEDUPE_KEY_PROPERTY]: `sendit:${deliveryId}` }];
}

async function readSeenIndex({ store }: { store: Store }): Promise<SeenIndexEntry[]> {
  const stored = await store.get<unknown>(SEEN_INDEX_KEY);
  if (!Array.isArray(stored)) {
    return [];
  }
  return stored.filter((entry): entry is SeenIndexEntry => isRecord(entry) && typeof entry['id'] === 'string' && typeof entry['at'] === 'number');
}

async function pruneSeenMarkers({ store, added, now }: { store: Store; added: SeenIndexEntry; now: number }): Promise<void> {
  const cutoff = now - SEEN_RETENTION_MS;
  const index = (await readSeenIndex({ store })).filter((entry) => entry.id !== added.id);
  const expired = index.filter((entry) => entry.at < cutoff).slice(0, SEEN_PRUNE_PER_EVENT);
  const expiredIds = new Set(expired.map((entry) => entry.id));
  await Promise.all(expired.map((entry) => store.delete(`${SEEN_KEY_PREFIX}${entry.id}`)));
  const remaining = index.filter((entry) => !expiredIds.has(entry.id));
  await store.put(SEEN_INDEX_KEY, remaining.length < SEEN_INDEX_LIMIT ? [...remaining, added] : remaining);
}

function verifySignature({ secret, header, rawBody, now }: { secret: string; header: string | undefined; rawBody: string | undefined; now: number }): boolean {
  if (header === undefined || rawBody === undefined) {
    return false;
  }
  const parts = header.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (timestamp === undefined || !/^\d+$/.test(timestamp) || signatures.length === 0) {
    return false;
  }
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  return signatures.some((signature) => {
    if (!/^[0-9a-f]+$/i.test(signature)) {
      return false;
    }
    const given = Buffer.from(signature, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

function headerOf({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (!isRecord(headers)) {
    return undefined;
  }
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = entry?.[1];
  return optionalText(Array.isArray(value) ? value[0] : value);
}

function rawBodyText(rawBody: unknown): string | undefined {
  if (typeof rawBody === 'string') {
    return rawBody;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8');
  }
  if (isRecord(rawBody) && rawBody['type'] === 'Buffer' && Array.isArray(rawBody['data'])) {
    return Buffer.from(rawBody['data'].map(Number)).toString('utf8');
  }
  return undefined;
}


const SIGNATURE_TOLERANCE_SECONDS = 900;

const WEBHOOK_ID_KEY = 'webhookId';

const SECRET_KEY = 'webhookSecret';

const SEEN_KEY = 'seenDeliveryIds';
const SEEN_KEY_PREFIX = 'seenDelivery:';
const SEEN_INDEX_KEY = 'seenDeliveryIndex';
const SEEN_INDEX_LIMIT = 5000;
const SEEN_PRUNE_PER_EVENT = 25;
const SEEN_RETENTION_MS = 2 * SIGNATURE_TOLERANCE_SECONDS * 1000;

export type WebhookPayload = { body: unknown; headers?: unknown; rawBody?: unknown };

export type SendItWebhookHooksParams = {
  event: string;
  sampleData: SendItRecord;
  mapEvent: (body: SendItRecord) => SendItRecord;
};

type SeenIndexEntry = { id: string; at: number };
