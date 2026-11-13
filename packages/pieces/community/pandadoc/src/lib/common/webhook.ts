import { createHmac, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { encodeId, isPandaDocStatus, isRecord, pandadocRequest } from './client';
import { pandadocApi } from './api';
import { pandadocNormalize, WebhookDocumentEvent } from './normalize';

function verifySignature({ sharedKey, rawBody, signature }: { sharedKey: string; rawBody: unknown; signature: string | undefined }): boolean {
  const raw = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.isBuffer(rawBody) ? rawBody : undefined;
  if (raw === undefined || signature === undefined || !/^[0-9a-fA-F]{64}$/.test(signature)) {
    return false;
  }
  const expected = Buffer.from(createHmac('sha256', sharedKey).update(raw).digest('hex'), 'utf8');
  const received = Buffer.from(signature.toLowerCase(), 'utf8');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function subscribe({
  apiKey,
  webhookUrl,
  name,
  events,
  store,
  storeKey,
}: {
  apiKey: string;
  webhookUrl: string;
  name: string;
  events: string[];
  store: WebhookStore;
  storeKey: string;
}): Promise<void> {
  const response = await pandadocRequest<unknown>({
    apiKey,
    method: HttpMethod.POST,
    path: '/webhook-subscriptions',
    body: {
      name: `Activepieces: ${name}`,
      url: webhookUrl,
      active: true,
      triggers: events,
      payload: ['metadata', 'fields', 'tokens'],
    },
  });
  const body = pandadocNormalize.rec(response.body);
  const webhookId = pandadocNormalize.str(body['uuid']);
  if (webhookId === null) {
    throw new Error('PandaDoc did not return the new webhook subscription ID.');
  }
  const sharedKey = pandadocNormalize.str(body['shared_key']);
  await store.put<StoredWebhook>(storeKey, { webhookId, sharedKey });
}

async function unsubscribe({ apiKey, store, storeKey }: { apiKey: string; store: WebhookStore; storeKey: string }): Promise<void> {
  const stored = await readStored({ store, storeKey });
  if (stored.webhookId === null) {
    return;
  }
  try {
    await pandadocRequest({ apiKey, method: HttpMethod.DELETE, path: `/webhook-subscriptions/${encodeId({ id: stored.webhookId, label: 'Webhook ID' })}` });
  } catch (error) {
    if (!isPandaDocStatus({ error, statuses: [404] })) {
      throw error;
    }
  }
  await store.delete(storeKey);
  await store.delete(LEGACY_STORE_KEY);
}

async function readStored({ store, storeKey }: { store: WebhookStore; storeKey: string }): Promise<{ webhookId: string | null; sharedKey: string | null }> {
  const current = await store.get<unknown>(storeKey);
  if (isRecord(current) && typeof current['webhookId'] === 'string') {
    const sharedKey = current['sharedKey'];
    return { webhookId: current['webhookId'], sharedKey: typeof sharedKey === 'string' && sharedKey.length > 0 ? sharedKey : null };
  }
  const legacy = await store.get<unknown>(LEGACY_STORE_KEY);
  return { webhookId: typeof legacy === 'string' && legacy.length > 0 ? legacy : null, sharedKey: null };
}

async function receive({
  payload,
  store,
  storeKey,
  events,
  select,
}: {
  payload: { body: unknown; rawBody?: unknown; headers: Record<string, string | undefined>; queryParams?: Record<string, string | undefined> };
  store: WebhookStore;
  storeKey: string;
  events: string[];
  select?: (items: WebhookDocumentEvent[]) => Promise<WebhookDocumentEvent[]> | WebhookDocumentEvent[];
}): Promise<WebhookDocumentEvent[]> {
  const stored = await readStored({ store, storeKey });
  if (stored.sharedKey !== null && !verifySignature({ sharedKey: stored.sharedKey, rawBody: payload.rawBody, signature: payload.queryParams?.['signature'] })) {
    return [];
  }
  const items = parseItems(payload.body)
    .filter((item) => events.includes(item.event))
    .map((item) => pandadocNormalize.webhookEvent(item));
  if (items.length === 0) {
    return [];
  }
  const deliveryId = headerValue({ headers: payload.headers, name: EVENT_ID_HEADER });
  if (deliveryId === undefined) {
    return select === undefined ? items : select(items);
  }
  const dedupeKey = `${storeKey}_deliveries`;
  const seen = (await store.get<string[]>(dedupeKey)) ?? [];
  if (seen.includes(deliveryId)) {
    return [];
  }
  const keyed = items.map((item, index) => ({ ...item, [DEDUPE_KEY_PROPERTY]: `${deliveryId}:${index}` }));
  const selected = select === undefined ? keyed : await select(keyed);
  await store.put(dedupeKey, [...seen, deliveryId].slice(-MAX_REMEMBERED_DELIVERIES));
  return selected;
}

function parseItems(body: unknown): { event: string; data: unknown }[] {
  const parsed = typeof body === 'string' || Buffer.isBuffer(body) ? safeJson(body.toString()) : body;
  const list = Array.isArray(parsed) ? parsed : isRecord(parsed) ? [parsed] : [];
  return list.flatMap((item) => {
    if (!isRecord(item) || typeof item['event'] !== 'string' || !isRecord(item['data'])) {
      return [];
    }
    return [{ event: item['event'], data: item['data'] }];
  });
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function headerValue({ headers, name }: { headers: Record<string, string | undefined> | undefined; name: string }): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

async function matchesFilters({
  apiKey,
  item,
  templateIds,
  folderIds,
}: {
  apiKey: string;
  item: WebhookDocumentEvent;
  templateIds: string[] | undefined;
  folderIds: string[] | undefined;
}): Promise<boolean> {
  const wantsTemplate = templateIds !== undefined && templateIds.length > 0;
  const wantsFolder = folderIds !== undefined && folderIds.length > 0;
  if (!wantsTemplate && !wantsFolder) {
    return true;
  }
  const needsLookup = (wantsTemplate && item.template_id === null) || (wantsFolder && item.folder_uuid === null);
  const details = needsLookup && item.id !== null ? await pandadocApi.getDocumentDetails({ apiKey, documentId: item.id }) : undefined;
  const templateId = item.template_id ?? details?.template_id ?? null;
  const folderId = item.folder_uuid ?? details?.folder_uuid ?? null;
  if (wantsTemplate && (templateId === null || !templateIds.includes(templateId))) {
    return false;
  }
  if (wantsFolder && (folderId === null || !folderIds.includes(folderId))) {
    return false;
  }
  return true;
}

async function filterItems({
  apiKey,
  items,
  templateIds,
  folderIds,
}: {
  apiKey: string;
  items: WebhookDocumentEvent[];
  templateIds: string[] | undefined;
  folderIds: string[] | undefined;
}): Promise<WebhookDocumentEvent[]> {
  const checks = await Promise.all(items.map((item) => matchesFilters({ apiKey, item, templateIds, folderIds })));
  return items.filter((_, index) => checks[index]);
}

export const pandadocWebhook = {
  verifySignature,
  subscribe,
  unsubscribe,
  readStored,
  receive,
  matchesFilters,
  filterItems,
  parseItems,
};

export type WebhookStore = {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<T>;
  delete(key: string): Promise<void>;
};

type StoredWebhook = { webhookId: string; sharedKey: string | null };

const LEGACY_STORE_KEY = 'webhook_id';
const EVENT_ID_HEADER = 'x-pandadoc-webhook-event-id';
const MAX_REMEMBERED_DELIVERIES = 200;
