import { randomBytes, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { isLemlistStatus, isRecord, lemlistApiCall } from './client';
import { lemlistInput } from './input';
import { lemlistResults } from './results';

async function createHook({
  apiKey,
  targetUrl,
  secret,
}: {
  apiKey: string;
  targetUrl: string;
  secret: string;
}): Promise<string> {
  const body = await lemlistApiCall<unknown>({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: '/hooks',
    body: { targetUrl, secret },
  });
  const id = isRecord(body) ? body['_id'] : undefined;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('lemlist did not return a webhook ID.');
  }
  return id;
}

async function deleteHook({ apiKey, webhookId }: { apiKey: string; webhookId: string }): Promise<void> {
  try {
    await lemlistApiCall({
      apiKey,
      method: HttpMethod.DELETE,
      resourceUri: `/hooks/${lemlistInput.idSegment({ value: webhookId, label: 'Webhook ID' })}`,
    });
  } catch (error) {
    if (isLemlistStatus({ error, status: 404 })) {
      return;
    }
    throw error;
  }
}

async function findHookIdByUrl({ apiKey, targetUrl }: { apiKey: string; targetUrl: string }): Promise<string | undefined> {
  const body = await lemlistApiCall<unknown>({ apiKey, method: HttpMethod.GET, resourceUri: '/hooks' });
  const match = lemlistResults.listFrom({ body }).find((hook) => hook['targetUrl'] === targetUrl);
  const id = match?.['_id'];
  return typeof id === 'string' ? id : undefined;
}

async function enable({
  apiKey,
  targetUrl,
  store,
  storeKey,
}: {
  apiKey: string;
  targetUrl: string;
  store: WebhookStore;
  storeKey: string;
}): Promise<void> {
  const secret = randomBytes(32).toString('hex');
  let webhookId: string;
  try {
    webhookId = await createHook({ apiKey, targetUrl, secret });
  } catch (error) {
    if (!isLemlistStatus({ error, status: 409 })) {
      throw error;
    }
    const leftover = await findHookIdByUrl({ apiKey, targetUrl });
    if (leftover === undefined) {
      throw new Error(
        'lemlist refused the webhook: the team already has 200 webhooks (disabled ones count too). Delete unused webhooks in lemlist and try again.'
      );
    }
    await deleteHook({ apiKey, webhookId: leftover });
    webhookId = await createHook({ apiKey, targetUrl, secret });
  }
  try {
    await store.put<StoredWebhook>(storeKey, { webhookId, secret });
  } catch (error) {
    await deleteHook({ apiKey, webhookId });
    throw error;
  }
}

async function disable({
  apiKey,
  store,
  storeKey,
}: {
  apiKey: string;
  store: WebhookStore;
  storeKey: string;
}): Promise<void> {
  const stored = await store.get<StoredWebhook>(storeKey);
  const webhookId = isRecord(stored) && typeof stored['webhookId'] === 'string' ? stored['webhookId'] : undefined;
  if (webhookId !== undefined) {
    await deleteHook({ apiKey, webhookId });
  }
  await store.delete(storeKey);
  await store.delete(dedupeKey(storeKey));
}

function secretsMatch({ expected, received }: { expected: string; received: unknown }): boolean {
  if (typeof received !== 'string') {
    return false;
  }
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseBody(body: unknown): Record<string, unknown> | undefined {
  if (isRecord(body)) {
    return body;
  }
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function receive({
  body,
  store,
  storeKey,
  nowMs,
  accept,
}: {
  body: unknown;
  store: WebhookStore;
  storeKey: string;
  nowMs: number;
  accept: (activity: Record<string, unknown>) => boolean;
}): Promise<Record<string, unknown> | undefined> {
  const event = parseBody(body);
  if (event === undefined) {
    return undefined;
  }
  const stored = await store.get<StoredWebhook>(storeKey);
  const expected = isRecord(stored) && typeof stored['secret'] === 'string' ? stored['secret'] : undefined;
  if (expected !== undefined && !secretsMatch({ expected, received: event['secret'] })) {
    return undefined;
  }
  const activity = Object.fromEntries(Object.entries(event).filter(([key]) => key !== 'secret'));
  const createdAt = typeof activity['createdAt'] === 'string' ? Date.parse(activity['createdAt']) : Number.NaN;
  if (!Number.isNaN(createdAt) && nowMs - createdAt > MAX_EVENT_AGE_MS) {
    return undefined;
  }
  if (!accept(activity)) {
    return undefined;
  }
  const activityId = typeof activity['_id'] === 'string' ? activity['_id'] : undefined;
  if (activityId !== undefined) {
    const seen = (await store.get<string[]>(dedupeKey(storeKey))) ?? [];
    if (seen.includes(activityId)) {
      return undefined;
    }
    await store.put(dedupeKey(storeKey), [...seen, activityId].slice(-MAX_REMEMBERED_ACTIVITIES));
    return { ...activity, [DEDUPE_KEY_PROPERTY]: activityId };
  }
  return activity;
}

function dedupeKey(storeKey: string): string {
  return `${storeKey}_seen_activity_ids`;
}

const MAX_REMEMBERED_ACTIVITIES = 1000;
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

export const lemlistWebhook = { enable, disable, receive, secretsMatch };

export type StoredWebhook = { webhookId: string; secret?: string };

export type WebhookStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
  delete: (key: string) => Promise<void>;
};
