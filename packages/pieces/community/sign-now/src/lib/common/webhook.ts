import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { OutputSchema, TriggerStrategy } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken, SignNowAuthValue } from './auth';
import { signNowClient, signNowData } from './client';

async function registerWebhook({
  token,
  event,
  entityId,
  callbackUrl,
  secretKey,
}: {
  token: string;
  event: string;
  entityId: string;
  callbackUrl: string;
  secretKey: string;
}): Promise<string> {
  const body = await signNowClient.request({
    token,
    method: 'POST',
    path: '/v2/event-subscriptions',
    operation: 'create event subscription',
    body: {
      event,
      entity_id: entityId,
      action: 'callback',
      attributes: {
        callback: callbackUrl,
        delete_access_token: true,
        secret_key: secretKey,
      },
    },
  });
  const data =
    signNowData.isRecord(body) && signNowData.isRecord(body['data'])
      ? body['data']
      : body;
  const id = signNowData.textAt({ value: data, key: 'id' });
  if (id === undefined || id === '') {
    throw new Error(
      'SignNow did not return a subscription ID; the trigger was not enabled.'
    );
  }
  return id;
}

async function unregisterWebhook({
  token,
  subscriptionId,
}: {
  token: string;
  subscriptionId: string;
}): Promise<void> {
  try {
    await signNowClient.request({
      token,
      method: 'DELETE',
      path: `/v2/event-subscriptions/${signNowClient.segment(subscriptionId)}`,
      operation: 'delete event subscription',
    });
  } catch (error) {
    if (!signNowClient.isNotFound(error)) {
      throw error;
    }
  }
}

async function enable({
  auth,
  event,
  webhookUrl,
  store,
  storeKey,
}: {
  auth: SignNowAuthValue;
  event: string;
  webhookUrl: string;
  store: WebhookStore;
  storeKey: string;
}): Promise<void> {
  const token = getSignNowBearerToken(auth);
  const userId = await signNowClient.getUserId({ token });
  const secretKey = randomBytes(32).toString('hex');
  const subscriptionId = await registerWebhook({
    token,
    event,
    entityId: userId,
    callbackUrl: webhookUrl,
    secretKey,
  });
  try {
    await store.put<StoredSubscription>(storeKey, {
      subscriptionId,
      secretKey,
    });
  } catch (error) {
    await unregisterWebhook({ token, subscriptionId }).catch(() => undefined);
    throw error;
  }
}

async function disable({
  auth,
  store,
  storeKey,
}: {
  auth: SignNowAuthValue;
  store: WebhookStore;
  storeKey: string;
}): Promise<void> {
  const stored = readStored(await store.get<unknown>(storeKey));
  if (stored.subscriptionId !== undefined) {
    await unregisterWebhook({
      token: getSignNowBearerToken(auth),
      subscriptionId: stored.subscriptionId,
    });
  }
  await store.delete(storeKey);
  await store.delete(`${storeKey}${SEEN_SUFFIX}`);
}

function readStored(value: unknown): {
  subscriptionId?: string;
  secretKey?: string;
} {
  if (typeof value === 'string' && value !== '') {
    return { subscriptionId: value };
  }
  const subscriptionId = signNowData.textAt({ value, key: 'subscriptionId' });
  const secretKey = signNowData.textAt({ value, key: 'secretKey' });
  return {
    subscriptionId: subscriptionId === '' ? undefined : subscriptionId,
    secretKey: secretKey === '' ? undefined : secretKey,
  };
}

function rawBodyText({
  rawBody,
  body,
}: {
  rawBody: unknown;
  body: unknown;
}): string {
  if (typeof rawBody === 'string') {
    return rawBody;
  }
  if (rawBody instanceof Uint8Array) {
    return Buffer.from(rawBody).toString('utf8');
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body ?? {});
}

function headerValue({
  headers,
  name,
}: {
  headers: Record<string, string> | undefined;
  name: string;
}): string | undefined {
  const match = Object.entries(headers ?? {}).find(
    ([key]) => key.toLowerCase() === name
  );
  return match !== undefined && match[1] !== '' ? match[1] : undefined;
}

function isValidSignature({
  secretKey,
  rawBody,
  signature,
}: {
  secretKey: string;
  rawBody: string;
  signature: string | undefined;
}): boolean {
  if (signature === undefined) {
    return false;
  }
  const expected = createHmac('sha256', secretKey)
    .update(rawBody, 'utf8')
    .digest();
  const received = Buffer.from(signature.trim(), 'base64');
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

function parsePayload(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function pruneSeen({ seen, now }: { seen: unknown; now: number }): SeenEntry[] {
  if (!Array.isArray(seen)) {
    return [];
  }
  return seen
    .filter(signNowData.isRecord)
    .map((entry) => ({
      key: signNowData.textAt({ value: entry, key: 'key' }) ?? '',
      at: signNowData.numberAt({ value: entry, key: 'at' }) ?? 0,
    }))
    .filter((entry) => entry.key !== '' && now - entry.at < DEDUPE_TTL_MS)
    .slice(-DEDUPE_MAX_ENTRIES);
}

async function eventsFrom({
  payload,
  event,
  store,
  storeKey,
  now = Date.now(),
}: {
  payload: {
    body: unknown;
    rawBody?: unknown;
    headers: Record<string, string>;
  };
  event: string;
  store: WebhookStore;
  storeKey: string;
  now?: number;
}): Promise<Record<string, unknown>[]> {
  const raw = rawBodyText({ rawBody: payload.rawBody, body: payload.body });
  const stored = readStored(await store.get<unknown>(storeKey));
  if (stored.secretKey !== undefined) {
    const signature = headerValue({
      headers: payload.headers,
      name: SIGNATURE_HEADER,
    });
    if (
      !isValidSignature({
        secretKey: stored.secretKey,
        rawBody: raw,
        signature,
      })
    ) {
      return [];
    }
  }
  const parsed = signNowData.isRecord(payload.body)
    ? payload.body
    : parsePayload(raw);
  if (!signNowData.isRecord(parsed) || !signNowData.isRecord(parsed['meta'])) {
    return [];
  }
  if (signNowData.textAt({ value: parsed['meta'], key: 'event' }) !== event) {
    return [];
  }
  const dedupeKey = createHash('sha256').update(raw, 'utf8').digest('hex');
  const seenKey = `${storeKey}${SEEN_SUFFIX}`;
  const seen = pruneSeen({ seen: await store.get<unknown>(seenKey), now });
  if (seen.some((entry) => entry.key === dedupeKey)) {
    return [];
  }
  await store.put<SeenEntry[]>(
    seenKey,
    [...seen, { key: dedupeKey, at: now }].slice(-DEDUPE_MAX_ENTRIES)
  );
  const meta = Object.fromEntries(
    Object.entries(parsed['meta']).filter(([key]) => key !== 'access_token')
  );
  return [{ ...parsed, meta }];
}

function webhookTriggerConfig({
  displayName,
  description,
  aiDescription,
  event,
  storeKey,
  outputSchema,
}: {
  displayName: string;
  description: string;
  aiDescription: string;
  event: string;
  storeKey: string;
  outputSchema: OutputSchema;
}) {
  return {
    auth: signNowAuth,
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: {},
    outputSchema,
    type: TriggerStrategy.WEBHOOK as const,
    async onEnable(context: {
      auth: SignNowAuthValue;
      webhookUrl: string;
      store: WebhookStore;
    }) {
      await enable({
        auth: context.auth,
        event,
        webhookUrl: context.webhookUrl,
        store: context.store,
        storeKey,
      });
    },
    async onDisable(context: { auth: SignNowAuthValue; store: WebhookStore }) {
      await disable({ auth: context.auth, store: context.store, storeKey });
    },
    async run(context: {
      payload: {
        body: unknown;
        rawBody?: unknown;
        headers: Record<string, string>;
      };
      store: WebhookStore;
    }) {
      return eventsFrom({
        payload: context.payload,
        event,
        store: context.store,
        storeKey,
      });
    },
  };
}

const SIGNATURE_HEADER = 'x-signnow-signature';
const SEEN_SUFFIX = '_seen_events';
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const DEDUPE_MAX_ENTRIES = 300;

export const signNowWebhook = {
  enable,
  disable,
  eventsFrom,
  isValidSignature,
  webhookTriggerConfig,
};

export type WebhookStore = {
  put: <T>(key: string, value: T) => Promise<T>;
  get: <T>(key: string) => Promise<T | null>;
  delete: (key: string) => Promise<void>;
};

type StoredSubscription = { subscriptionId: string; secretKey: string };
type SeenEntry = { key: string; at: number };
