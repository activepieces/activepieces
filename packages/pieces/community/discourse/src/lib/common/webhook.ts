import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DiscourseApiError, DiscourseCredentials, discourseRequest, headerValue, isRecord } from './client';
import { discourseMap } from './mappers';

async function enable({
  auth,
  webhookUrl,
  store,
  events,
}: {
  auth: DiscourseCredentials;
  webhookUrl: string;
  store: WebhookStore;
  events: string[];
}): Promise<void> {
  const eventTypeIds = await resolveEventTypeIds({ auth, events });
  const secret = randomBytes(32).toString('hex');
  const body = discourseMap.rec(
    await discourseRequest({
      auth,
      method: HttpMethod.POST,
      path: '/admin/api/web_hooks.json',
      body: {
        web_hook: {
          payload_url: webhookUrl,
          content_type: JSON_CONTENT_TYPE,
          secret,
          wildcard_web_hook: false,
          verify_certificate: true,
          active: true,
          web_hook_event_type_ids: eventTypeIds,
        },
      },
    }),
  );
  const id = discourseMap.num(discourseMap.rec(body['web_hook'])['id']);
  if (id === null) {
    throw new Error('Discourse did not return the ID of the created webhook.');
  }
  try {
    await store.put(WEBHOOK_KEY, { id, secret });
  } catch (error) {
    await deleteHook({ auth, id }).catch(() => undefined);
    throw error;
  }
}

async function resolveEventTypeIds({ auth, events }: { auth: DiscourseCredentials; events: string[] }): Promise<number[]> {
  const body = discourseMap.rec(
    await discourseRequest({ auth, method: HttpMethod.GET, path: '/admin/api/web_hooks.json', query: { limit: 1 } }),
  );
  const grouped = discourseMap.rec(discourseMap.rec(body['extras'])['grouped_event_types']);
  const byName = new Map<string, number>();
  for (const group of Object.values(grouped)) {
    for (const item of discourseMap.list(group).map(discourseMap.rec)) {
      const id = discourseMap.num(item['id']);
      const name = discourseMap.str(item['name']);
      if (id !== null && name !== null) {
        byName.set(name, id);
      }
    }
  }
  return events.map((event) => {
    const id = byName.get(event);
    if (id === undefined) {
      throw new Error(`This Discourse forum does not offer the "${event}" webhook event. Update Discourse or check the API key is a global admin key.`);
    }
    return id;
  });
}

async function disable({ auth, store }: { auth: DiscourseCredentials; store: WebhookStore }): Promise<void> {
  const stored = parseStored(await store.get<unknown>(WEBHOOK_KEY));
  if (stored === undefined) {
    return;
  }
  await deleteHook({ auth, id: stored.id });
  await store.delete(WEBHOOK_KEY);
  await store.delete(DELIVERIES_KEY);
}

async function deleteHook({ auth, id }: { auth: DiscourseCredentials; id: number }): Promise<void> {
  try {
    await discourseRequest({ auth, method: HttpMethod.DELETE, path: `/admin/api/web_hooks/${id}.json` });
  } catch (error) {
    if (error instanceof DiscourseApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

function verifySignature({
  secret,
  rawBody,
  headers,
}: {
  secret: string;
  rawBody: unknown;
  headers: Record<string, string | string[] | undefined> | undefined;
}): boolean {
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    return false;
  }
  const signature = headerValue({ headers, name: 'x-discourse-event-signature' });
  if (signature === undefined || !signature.startsWith('sha256=')) {
    return false;
  }
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8');
  const received = Buffer.from(signature.slice('sha256='.length).trim().toLowerCase(), 'utf8');
  return received.length === expected.length && timingSafeEqual(received, expected);
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

function isWithinWindow({ timestamp, nowMs }: { timestamp: unknown; nowMs: number }): boolean {
  const text = discourseMap.str(timestamp);
  if (text === null) {
    return true;
  }
  const time = Date.parse(text);
  if (Number.isNaN(time)) {
    return true;
  }
  return nowMs - time <= REPLAY_WINDOW_MS && time - nowMs <= CLOCK_SKEW_MS;
}

async function receive({
  payload,
  store,
  events,
  nowMs,
}: {
  payload: { body: unknown; rawBody?: unknown; headers?: Record<string, string | string[] | undefined> };
  store: WebhookStore;
  events: string[];
  nowMs: number;
}): Promise<{ event: string; eventId: string; body: Record<string, unknown> } | undefined> {
  const stored = parseStored(await store.get<unknown>(WEBHOOK_KEY));
  if (stored === undefined) {
    return undefined;
  }
  if (!verifySignature({ secret: stored.secret, rawBody: payload.rawBody, headers: payload.headers })) {
    return undefined;
  }
  const event = headerValue({ headers: payload.headers, name: 'x-discourse-event' });
  if (event === undefined || !events.includes(event)) {
    return undefined;
  }
  const body = parseBody(payload.body) ?? parseBody(payload.rawBody);
  if (body === undefined) {
    return undefined;
  }
  const record = discourseMap.rec(Object.values(body)[0]);
  const timestamp = event.endsWith('_edited') ? record['updated_at'] ?? record['created_at'] : record['created_at'];
  if (!isWithinWindow({ timestamp, nowMs })) {
    return undefined;
  }
  const eventId = headerValue({ headers: payload.headers, name: 'x-discourse-event-id' }) ?? '';
  const deliveryKey = `${stored.id}:${signedBodyFingerprint(payload.rawBody)}`;
  const seen = (await store.get<string[]>(DELIVERIES_KEY)) ?? [];
  if (seen.includes(deliveryKey)) {
    return undefined;
  }
  await store.put(DELIVERIES_KEY, [...seen, deliveryKey].slice(-MAX_REMEMBERED_DELIVERIES));
  return { event, eventId, body };
}

function signedBodyFingerprint(rawBody: unknown): string {
  const data = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
  return createHash('sha256').update(data).digest('hex');
}

function parseStored(value: unknown): { id: number; secret: string } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const id = discourseMap.num(value['id']);
  const secret = value['secret'];
  return id === null || typeof secret !== 'string' || secret.length === 0 ? undefined : { id, secret };
}

export const discourseWebhook = { enable, disable, receive, verifySignature };

export const WEBHOOK_INSTRUCTIONS = `This trigger creates a webhook in your Discourse forum automatically when the flow is published and removes it when the flow is turned off.

It needs a **global API key created by an admin** (Admin → Advanced → API Keys). Every delivery is checked against the HMAC signature Discourse sends in X-Discourse-Event-Signature.`;

export type WebhookStore = {
  get: <T>(key: string) => Promise<T | null>;
  put: <T>(key: string, value: T) => Promise<T>;
  delete: (key: string) => Promise<void>;
};

const WEBHOOK_KEY = 'discourse_webhook';
const DELIVERIES_KEY = 'discourse_webhook_deliveries';
const JSON_CONTENT_TYPE = 1;
const MAX_REMEMBERED_DELIVERIES = 1000;
const REPLAY_WINDOW_MS = 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
