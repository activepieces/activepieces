import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { Store, WebhookResponse } from '@activepieces/pieces-framework';
import { XERO_URLS, XeroApiError, xeroApi, xeroValue } from './client';

function mergeIds({ previous, ids, limit }: { previous: unknown; ids: string[]; limit: number }) {
  const known = new Set(Array.isArray(previous) ? previous.filter((value): value is string => typeof value === 'string') : []);
  const touched = [...new Set(ids)];
  const newIds = touched.filter((id) => !known.has(id));
  const touchedSet = new Set(touched);
  const merged = [...[...known].filter((id) => !touchedSet.has(id)), ...touched];
  return { newIds, stored: merged.slice(Math.max(merged.length - limit, 0)) };
}

async function emitFirstSeen<T>({
  store,
  key,
  items,
  idOf,
  limit = SEEN_ID_LIMIT,
}: {
  store: Store;
  key: string;
  items: T[];
  idOf: (item: T) => string | undefined;
  limit?: number;
}): Promise<T[]> {
  const previous = await store.get<unknown>(key);
  const known = new Set(Array.isArray(previous) ? previous.filter((value): value is string => typeof value === 'string') : []);
  const emitted: T[] = [];
  const batchIds = new Set<string>();
  for (const item of items) {
    const id = idOf(item);
    if (!id || batchIds.has(id)) continue;
    batchIds.add(id);
    if (!known.has(id)) emitted.push(item);
  }
  const { stored } = mergeIds({ previous, ids: [...batchIds], limit });
  await store.put(key, stored);
  return emitted;
}

async function seedSeenIds({ store, key, ids, limit = SEEN_ID_LIMIT }: { store: Store; key: string; ids: string[]; limit?: number }) {
  const { stored } = mergeIds({ previous: await store.get<unknown>(key), ids, limit });
  await store.put(key, stored);
}

function boundMap<V>({ map, limit = SEEN_ID_LIMIT }: { map: Record<string, V>; limit?: number }): Record<string, V> {
  const entries = Object.entries(map);
  if (entries.length <= limit) return map;
  return Object.fromEntries(entries.slice(entries.length - limit));
}

function readMap<V>({ value, isValue }: { value: unknown; isValue: (entry: unknown) => entry is V }): Record<string, V> {
  if (!xeroValue.isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, V] => isValue(entry[1])));
}

function verifySignature({ webhookKey, rawBody, signature }: { webhookKey: unknown; rawBody: unknown; signature: unknown }): boolean {
  if (typeof webhookKey !== 'string' || webhookKey.length === 0) return false;
  if (typeof signature !== 'string' || signature.length === 0) return false;
  const body = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody : undefined;
  if (body === undefined) return false;
  const expected = createHmac('sha256', webhookKey).update(body).digest();
  const received = Buffer.from(signature, 'base64');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function continueToRun(): WebhookResponse;
function continueToRun(): WebhookResponse | undefined {
  return undefined;
}

async function handshake({ payload, webhookKey }: { payload: XeroWebhookPayload; webhookKey: unknown }): Promise<WebhookResponse> {
  const valid = verifySignature({
    webhookKey,
    rawBody: payload.rawBody,
    signature: headerValue({ headers: payload.headers, name: SIGNATURE_HEADER }),
  });
  if (!valid) return { status: 401 };
  return continueToRun();
}

function headerValue({ headers, name }: { headers: Record<string, string>; name: string }): string | undefined {
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return match ? headers[match] : undefined;
}

function readEvents({ body }: { body: unknown }): XeroWebhookEvent[] {
  if (!xeroValue.isRecord(body)) return [];
  return xeroValue.readRecords(body['events']).flatMap((event) => {
    const resourceId = xeroValue.readString(event['resourceId']);
    const tenantId = xeroValue.readString(event['tenantId']);
    const eventCategory = xeroValue.readString(event['eventCategory']);
    const eventType = xeroValue.readString(event['eventType']);
    if (!resourceId || !xeroValue.isGuid(resourceId) || !tenantId || !eventCategory || !eventType) return [];
    return [
      {
        resourceUrl: xeroValue.readString(event['resourceUrl']) ?? null,
        resourceId,
        eventDateUtc: xeroValue.readString(event['eventDateUtc']) ?? null,
        eventType,
        eventCategory,
        tenantId,
        tenantType: xeroValue.readString(event['tenantType']) ?? null,
      },
    ];
  });
}

async function fetchResource({
  accessToken,
  event,
  resource,
}: {
  accessToken: string;
  event: XeroWebhookEvent;
  resource: XeroWebhookResource;
}): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const body = await xeroApi.request<unknown>({
        accessToken,
        tenantId: event.tenantId,
        method: HttpMethod.GET,
        url: `${XERO_URLS.api}/${resource.path}/${encodeURIComponent(event.resourceId)}`,
        operation: `fetch ${resource.path} ${event.resourceId} for a webhook event`,
      });
      return xeroApi.recordsOf({ body, key: resource.path })[0] ?? null;
    } catch (error) {
      if (error instanceof XeroApiError && error.status === 404) return null;
      const delay = webhookTiming.fetchRetryDelaysMs[attempt];
      if (delay === undefined || !isTransient({ error })) throw error;
      await pause({ ms: delay });
    }
  }
}

function isTransient({ error }: { error: unknown }): boolean {
  if (!(error instanceof XeroApiError)) return true;
  return error.status >= 500 || error.status === 408;
}

function pause({ ms }: { ms: number }): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

async function claimDelivery({ store, keys }: { store: Store; keys: string[] }): Promise<string | null> {
  const claimKey = `${WEBHOOK_CLAIM_PREFIX}${createHash('sha256').update([...keys].sort().join('|')).digest('base64url').slice(0, 22)}`;
  const token = randomUUID();
  await store.put(claimKey, token);
  await pause({ ms: webhookTiming.claimSettleMs });
  return (await store.get<unknown>(claimKey)) === token ? claimKey : null;
}

async function processDelivery({
  payload,
  webhookKey,
  tenantId,
  accessToken,
  store,
  resource,
  fetchFull,
  accept,
}: {
  payload: XeroWebhookPayload;
  webhookKey: unknown;
  tenantId: unknown;
  accessToken: string;
  store: Store;
  resource: XeroWebhookResource;
  fetchFull: boolean;
  accept?: (record: Record<string, unknown>) => boolean;
}): Promise<unknown[]> {
  const valid = verifySignature({
    webhookKey,
    rawBody: payload.rawBody,
    signature: headerValue({ headers: payload.headers, name: SIGNATURE_HEADER }),
  });
  if (!valid) return [];
  const events = readEvents({ body: payload.body }).filter(
    (event) =>
      event.eventCategory === resource.category &&
      resource.eventTypes.includes(event.eventType) &&
      (typeof tenantId !== 'string' || tenantId.length === 0 || event.tenantId === tenantId),
  );
  if (events.length === 0) return [];
  const candidates = unseen({ events, seen: await readSeenEvents({ store, now: Date.now() }) });
  if (candidates.size === 0) return [];
  const claimKey = await claimDelivery({ store, keys: [...candidates.keys()] });
  if (claimKey === null) return [];
  const now = Date.now();
  const fresh = unseen({ events: [...candidates.values()], seen: await readSeenEvents({ store, now }) });
  try {
    if (fresh.size === 0) return [];
    await writeSeenEvents({ store, now, add: [...fresh.keys()] });
  } finally {
    await store.delete(claimKey);
  }
  try {
    const results: unknown[] = [];
    for (const event of fresh.values()) {
      if (!fetchFull) {
        results.push(event);
        continue;
      }
      const record = await fetchResource({ accessToken, event, resource });
      if (record && (accept === undefined || accept(record))) results.push(record);
    }
    return results;
  } catch (error) {
    await writeSeenEvents({ store, now, remove: [...fresh.keys()] });
    throw error;
  }
}

function unseen({ events, seen }: { events: XeroWebhookEvent[]; seen: Record<string, number> }): Map<string, XeroWebhookEvent> {
  const fresh = new Map<string, XeroWebhookEvent>();
  for (const event of events) {
    const key = eventKey({ event });
    if (seen[key] === undefined && !fresh.has(key)) fresh.set(key, event);
  }
  return fresh;
}

function eventKey({ event }: { event: XeroWebhookEvent }): string {
  return createHash('sha256').update(`${event.tenantId}|${event.resourceId}|${event.eventType}|${event.eventDateUtc ?? ''}`).digest('base64url').slice(0, 22);
}

async function readSeenEvents({ store, now }: { store: Store; now: number }): Promise<Record<string, number>> {
  const stored = readMap({ value: await store.get<unknown>(WEBHOOK_SEEN_KEY), isValue: (entry): entry is number => typeof entry === 'number' });
  return Object.fromEntries(Object.entries(stored).filter(([, seenAt]) => now - seenAt < WEBHOOK_DEDUPE_WINDOW_MS));
}

async function writeSeenEvents({ store, now, add = [], remove = [] }: { store: Store; now: number; add?: string[]; remove?: string[] }) {
  const current = await readSeenEvents({ store, now });
  for (const key of remove) delete current[key];
  for (const key of add) current[key] = now;
  await store.put(WEBHOOK_SEEN_KEY, boundMap({ map: current, limit: WEBHOOK_SEEN_LIMIT }));
}

function instructions({ category }: { category: 'Contact' | 'Invoice' }): string {
  return `
This trigger needs a webhook on **your own Xero app** (the app whose Client ID and Secret this connection uses). Xero allows one delivery URL per app, so one app can feed only one flow, and connections made through a shared app (such as Activepieces Cloud's built-in Xero app) cannot set up webhooks.

1. Publish this flow first, so the URL below is live.
2. Go to Xero Developer > My Apps > [Your App] > Webhooks.
3. Select the ${category} category.
4. Set the Delivery URL to:
\n\n\`\`\`text
{{webhookUrl}}
\`\`\`
5. Copy the Webhook Key from the Webhooks page into the Webhook Key field below and publish again.
6. Click Save, then "Send Intent to receive". This trigger answers Xero's check: 200 for a correctly signed request and 401 otherwise.

Notes:
- Only events for the selected organisation are used.
- Every delivery's x-xero-signature header is checked with your Webhook Key; repeated deliveries of the same event are ignored.
  `;
}

const SIGNATURE_HEADER = 'x-xero-signature';
const WEBHOOK_SEEN_KEY = 'xero_webhook_seen_events';
const WEBHOOK_DEDUPE_WINDOW_MS = 48 * 60 * 60 * 1000;
const WEBHOOK_SEEN_LIMIT = 10000;
const WEBHOOK_CLAIM_PREFIX = 'xero_webhook_claim_';

export const webhookTiming = { claimSettleMs: 1500, fetchRetryDelaysMs: [2000, 5000] };

export const SEEN_ID_LIMIT = 5000;

export const xeroTriggerState = {
  mergeIds,
  emitFirstSeen,
  seedSeenIds,
  boundMap,
  readMap,
};

export const xeroWebhook = {
  verifySignature,
  handshake,
  processDelivery,
  readEvents,
  instructions,
  handshakeConfiguration: { paramName: SIGNATURE_HEADER },
};

export type XeroWebhookPayload = {
  body: unknown;
  rawBody?: unknown;
  headers: Record<string, string>;
};

export type XeroWebhookEvent = {
  resourceUrl: string | null;
  resourceId: string;
  eventDateUtc: string | null;
  eventType: string;
  eventCategory: string;
  tenantId: string;
  tenantType: string | null;
};

export type XeroWebhookResource = {
  category: 'CONTACT' | 'INVOICE';
  path: 'Contacts' | 'Invoices';
  eventTypes: string[];
};
