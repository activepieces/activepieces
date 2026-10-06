import { HttpMethod } from '@activepieces/pieces-common';
import { heartbeatApi } from './client';

async function deleteWebhook({ token, webhookId }: { token: string; webhookId: string }): Promise<void> {
  try {
    await heartbeatApi.request({ token, method: HttpMethod.DELETE, path: `/webhooks/${webhookId}`, operation: 'delete webhook' });
  } catch (error) {
    if (heartbeatApi.statusOf(error) !== 404) {
      throw error;
    }
  }
}

async function enable({ token, store, webhookUrl, action }: EnableParams): Promise<string> {
  const previous = await store.get<StoredWebhook>(WEBHOOK_STORE_KEY);
  if (previous?.webhookId) {
    await deleteWebhook({ token, webhookId: previous.webhookId });
    await store.delete(WEBHOOK_STORE_KEY);
  }
  const existing = heartbeatApi.recordList(
    await heartbeatApi.request<unknown>({ token, method: HttpMethod.GET, path: '/webhooks', operation: 'list webhooks' }),
  );
  for (const hook of existing) {
    if (hook['url'] === webhookUrl && typeof hook['id'] === 'string') {
      await deleteWebhook({ token, webhookId: hook['id'] });
    }
  }
  const created = await heartbeatApi.request<unknown>({
    token,
    method: HttpMethod.PUT,
    path: '/webhooks',
    operation: 'create webhook',
    body: { action, url: webhookUrl },
  });
  const webhookId = heartbeatApi.isRecord(created) ? created['id'] : undefined;
  if (typeof webhookId !== 'string') {
    throw new Error('Heartbeat did not return a webhook ID, so the trigger could not be enabled. Try again.');
  }
  try {
    await store.put<StoredWebhook>(WEBHOOK_STORE_KEY, { webhookId });
  } catch (error) {
    await deleteWebhook({ token, webhookId });
    throw error;
  }
  return webhookId;
}

async function disable({ token, store }: { token: string; store: WebhookStore }): Promise<void> {
  const stored = await store.get<StoredWebhook>(WEBHOOK_STORE_KEY);
  if (!stored?.webhookId) {
    return;
  }
  await deleteWebhook({ token, webhookId: stored.webhookId });
  await store.delete(WEBHOOK_STORE_KEY);
}

async function isFirstDelivery({ store, key }: { store: WebhookStore; key: string }): Promise<boolean> {
  const seen = (await store.get<string[]>(SEEN_STORE_KEY)) ?? [];
  if (seen.includes(key)) {
    return false;
  }
  await store.put<string[]>(SEEN_STORE_KEY, [...seen, key].slice(-MAX_SEEN_KEYS));
  return true;
}

function payloadOf(body: unknown): Record<string, unknown> {
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return heartbeatApi.isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return heartbeatApi.isRecord(body) ? body : {};
}

function uuidOrNull(value: unknown): string | null {
  try {
    return heartbeatApi.uuid({ value, label: 'ID' });
  } catch {
    return null;
  }
}

async function fetchOrNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (heartbeatApi.statusOf(error) === 404) {
      return null;
    }
    throw error;
  }
}

const WEBHOOK_STORE_KEY = 'heartbeat_webhook';
const SEEN_STORE_KEY = 'heartbeat_seen_deliveries';
const MAX_SEEN_KEYS = 500;

export const heartbeatWebhooks = {
  enable,
  disable,
  isFirstDelivery,
  payloadOf,
  uuidOrNull,
  fetchOrNull,
  MAX_SEEN_KEYS,
  WEBHOOK_STORE_KEY,
  SEEN_STORE_KEY,
};

type StoredWebhook = { webhookId: string };

type WebhookStore = {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<T>;
  delete(key: string): Promise<void>;
};

type EnableParams = {
  token: string;
  store: WebhookStore;
  webhookUrl: string;
  action: { name: string; filter?: Record<string, unknown> };
};
