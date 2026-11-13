import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createWorkableClient, encodeId, isRecord, normalizeSubdomain, tokenOf, WorkableApiError } from './client';
import { workableValues } from './values';

const v = workableValues;

async function enable({ auth, subdomain, webhookUrl, store, config, filters }: EnableParams): Promise<void> {
  const client = createWorkableClient({ auth, subdomain });
  const accountId = await client.getSubdomain();
  const body = {
    target: webhookUrl,
    event: config.event,
    args: {
      account_id: accountId,
      job_shortcode: v.optionalText(filters.jobShortcode) ?? '',
      stage_slug: v.optionalText(filters.stageSlug) ?? '',
    },
  };
  let created: unknown;
  try {
    created = await client.request({ method: HttpMethod.POST, path: '/subscriptions', body });
  } catch (error) {
    if (!(error instanceof WorkableApiError) || error.status !== 409) {
      throw error;
    }
    await removeSubscriptionsForTarget({ client, webhookUrl });
    created = await client.request({ method: HttpMethod.POST, path: '/subscriptions', body });
  }
  const id = v.str(v.rec(created)['id']);
  if (id === null) {
    throw new Error('Workable did not return the ID of the created webhook subscription.');
  }
  try {
    await store.put(config.storeKey, { webhookId: id, subdomain: accountId });
  } catch (error) {
    await deleteSubscription({ client, id }).catch(() => undefined);
    throw error;
  }
}

async function removeSubscriptionsForTarget({ client, webhookUrl }: { client: ReturnType<typeof createWorkableClient>; webhookUrl: string }) {
  const listed = await client.request({ method: HttpMethod.GET, path: '/subscriptions' });
  const subscriptions = Array.isArray(listed) ? v.records(listed) : v.records(v.rec(listed)['subscriptions']);
  for (const subscription of subscriptions) {
    const id = v.str(subscription['id']);
    if (id !== null && subscription['target'] === webhookUrl) {
      await deleteSubscription({ client, id });
    }
  }
}

async function deleteSubscription({ client, id }: { client: ReturnType<typeof createWorkableClient>; id: string }): Promise<void> {
  try {
    await client.request({ method: HttpMethod.DELETE, path: `/subscriptions/${encodeId({ value: id, label: 'Subscription ID' })}` });
  } catch (error) {
    if (error instanceof WorkableApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

async function disable({ auth, subdomain, store, config }: DisableParams): Promise<void> {
  const stored = v.rec(await store.get<unknown>(config.storeKey));
  const id = v.str(stored['webhookId']);
  if (id !== null) {
    const storedSubdomain = typeof stored['subdomain'] === 'string' ? stored['subdomain'] : undefined;
    const client = createWorkableClient({ auth, subdomain: storedSubdomain ?? subdomain });
    await deleteSubscription({ client, id });
  }
  await store.delete(config.storeKey);
  await store.delete(config.deliveriesKey);
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (!isRecord(headers)) {
    return undefined;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' && single.trim().length > 0 ? single.trim() : undefined;
}

function safeEqual({ a, b }: { a: string; b: string }): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifySignature({ token, rawBody, headers }: { token: string; rawBody: unknown; headers: unknown }): boolean {
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    return false;
  }
  const received = headerValue({ headers, name: SIGNATURE_HEADER });
  if (received === undefined) {
    return false;
  }
  const signature = received.startsWith('sha256=') ? received.slice('sha256='.length) : received;
  const digest = createHmac('sha256', token).update(rawBody).digest();
  return safeEqual({ a: signature.toLowerCase(), b: digest.toString('hex') }) || safeEqual({ a: signature, b: digest.toString('base64') });
}

function parseBody({ rawBody, body }: { rawBody: unknown; body: unknown }): Record<string, unknown> | undefined {
  if (typeof rawBody === 'string' || Buffer.isBuffer(rawBody)) {
    try {
      const parsed: unknown = JSON.parse(rawBody.toString());
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return isRecord(body) ? body : undefined;
}

function isWithinWindow({ firedAt, nowMs }: { firedAt: unknown; nowMs: number }): boolean {
  const text = v.str(firedAt);
  if (text === null) {
    return true;
  }
  const time = Date.parse(text);
  if (Number.isNaN(time)) {
    return true;
  }
  return nowMs - time <= REPLAY_WINDOW_MS && time - nowMs <= CLOCK_SKEW_MS;
}

async function receive({ auth, payload, store, config, nowMs }: ReceiveParams): Promise<Record<string, unknown> | undefined> {
  if (!verifySignature({ token: tokenOf(auth), rawBody: payload.rawBody, headers: payload.headers })) {
    return undefined;
  }
  const envelope = parseBody({ rawBody: payload.rawBody, body: payload.body });
  if (envelope === undefined) {
    return undefined;
  }
  const eventType = v.str(envelope['event_type']);
  if (eventType !== null && eventType !== config.event) {
    return undefined;
  }
  if (!isWithinWindow({ firedAt: envelope['fired_at'], nowMs })) {
    return undefined;
  }
  const rawText = Buffer.isBuffer(payload.rawBody) ? payload.rawBody : Buffer.from(String(payload.rawBody), 'utf8');
  const deliveryKey = v.str(envelope['id']) ?? createHash('sha256').update(rawText).digest('hex');
  const seen = v.list(await store.get<unknown>(config.deliveriesKey)).filter((item): item is string => typeof item === 'string');
  if (seen.includes(deliveryKey)) {
    return undefined;
  }
  await store.put(config.deliveriesKey, [...seen, deliveryKey].slice(-MAX_REMEMBERED_DELIVERIES));
  return { ...v.rec(envelope['data']), event_type: eventType ?? config.event, fired_at: envelope['fired_at'] ?? null };
}

async function sample({ auth, subdomain, config, filters }: SampleParams): Promise<Record<string, unknown>[]> {
  const client = createWorkableClient({ auth, subdomain });
  const shortcode = v.optionalText(filters.jobShortcode);
  const stage = v.optionalText(filters.stageSlug);
  const since = new Date(Date.now() - SAMPLE_LOOKBACK_MS).toISOString();
  const query = {
    shortcode,
    stage: shortcode === undefined ? undefined : stage,
    limit: 100,
    [config.event === 'candidate_moved' ? 'updated_after' : 'created_after']: since,
  };
  const listed = await client.request({ method: HttpMethod.GET, path: '/candidates', query });
  const newest = v.records(v.rec(listed)['candidates']).slice(-SAMPLE_SIZE).reverse();
  const result: Record<string, unknown>[] = [];
  for (const item of newest) {
    const id = v.str(item['id']);
    if (id === null) {
      continue;
    }
    const full = await client.request({ method: HttpMethod.GET, path: `/candidates/${encodeId({ value: id, label: 'Candidate ID' })}` });
    const record = v.rec(v.rec(full)['candidate'] ?? full);
    result.push({ ...record, event_type: config.event, fired_at: record['updated_at'] ?? null });
  }
  return result;
}

export const WEBHOOK_INSTRUCTIONS = `This trigger creates a Workable webhook subscription when the flow is published and removes it when the flow is turned off.

Every delivery is checked against the **X-Workable-Signature** HMAC, signed with your API access token. Deliveries without a valid signature are ignored, and Workable retries of the same event run the flow only once.`;

export const workableWebhook = { enable, disable, receive, sample, verifySignature, normalizeSubdomain };

export type WebhookStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
  delete: (key: string) => Promise<void>;
};

export type WebhookConfig = { event: 'candidate_created' | 'candidate_moved'; storeKey: string; deliveriesKey: string };

type Filters = { jobShortcode?: unknown; stageSlug?: unknown };

type EnableParams = { auth: unknown; subdomain?: unknown; webhookUrl: string; store: WebhookStore; config: WebhookConfig; filters: Filters };
type DisableParams = { auth: unknown; subdomain?: unknown; store: WebhookStore; config: WebhookConfig };
type ReceiveParams = {
  auth: unknown;
  payload: { body: unknown; rawBody?: unknown; headers?: unknown };
  store: WebhookStore;
  config: WebhookConfig;
  nowMs: number;
};
type SampleParams = { auth: unknown; subdomain?: unknown; config: WebhookConfig; filters: Filters };

const SIGNATURE_HEADER = 'x-workable-signature';
const MAX_REMEMBERED_DELIVERIES = 500;
const REPLAY_WINDOW_MS = 6 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const SAMPLE_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
const SAMPLE_SIZE = 3;
