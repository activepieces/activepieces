import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { netlifyClient, NetlifyApiError, NetlifyAuthValue } from './client';

const STORE_KEY = 'webhook_id';
const SECRET_KEY = 'webhook_signature_secret';
const SLOT_KEY_PREFIX = 'netlify_seen_events_';
const SLOT_COUNT = 64;
const MAX_PER_SLOT = 100;
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;

async function enable({
  auth,
  siteId,
  event,
  webhookUrl,
  store,
}: {
  auth: NetlifyAuthValue;
  siteId: unknown;
  event: string;
  webhookUrl: string;
  store: WebhookStore;
}): Promise<void> {
  const site = typeof siteId === 'string' ? siteId.trim() : '';
  if (site === '') {
    throw new Error('Site is required.');
  }
  const secret = randomBytes(32).toString('hex');
  const response = await netlifyClient.request({
    auth,
    method: HttpMethod.POST,
    path: '/hooks',
    query: { site_id: site },
    body: { site_id: site, type: 'url', event, data: { url: webhookUrl, signature_secret: secret } },
    redactBody: true,
  });
  const hookId = netlifyClient.isRecord(response.body) ? response.body['id'] : undefined;
  if (typeof hookId !== 'string' || hookId === '') {
    throw new Error('Netlify did not return the ID of the created webhook.');
  }
  try {
    await store.put(SECRET_KEY, secret);
    await store.put(STORE_KEY, hookId);
  } catch (error) {
    await deleteHook({ auth, hookId }).catch(() => undefined);
    throw error;
  }
}

async function disable({ auth, store }: { auth: NetlifyAuthValue; store: WebhookStore }): Promise<void> {
  const hookId = await store.get<string>(STORE_KEY);
  if (typeof hookId === 'string' && hookId !== '') {
    await deleteHook({ auth, hookId });
  }
  await store.delete(STORE_KEY);
  await store.delete(SECRET_KEY);
  await Promise.all(Array.from({ length: SLOT_COUNT }, (_, slot) => store.delete(`${SLOT_KEY_PREFIX}${slot}`)));
}

async function receive({ payload, store, now = Date.now() }: { payload: WebhookPayload; store: WebhookStore; now?: number }): Promise<unknown[]> {
  const secret = await store.get<string>(SECRET_KEY);
  if (typeof secret === 'string' && secret !== '') {
    const signature = headerValue({ headers: payload.headers, name: 'x-webhook-signature' });
    if (!verifySignature({ token: signature, secret, rawBody: rawBodyOf(payload) })) {
      return [];
    }
  }
  const eventId = eventIdOf(payload.body);
  if (eventId === null) {
    return [payload.body];
  }
  const claimed = await claimEvent({ store, eventId, now });
  if (!claimed) {
    return [];
  }
  return [withDedupeKey({ body: payload.body, eventId })];
}

async function claimEvent({ store, eventId, now }: { store: WebhookStore; eventId: string; now: number }): Promise<boolean> {
  const key = slotKey(eventId);
  const before = await readSlot({ store, key, now });
  if (before.some((entry) => entry.id === eventId)) {
    return false;
  }
  const mine: SeenEvent = { id: eventId, at: now, token: randomBytes(16).toString('hex') };
  await store.put(key, [...before.slice(-(MAX_PER_SLOT - 1)), mine]);
  const after = await readSlot({ store, key, now });
  const winner = after.find((entry) => entry.id === eventId);
  if (winner !== undefined) {
    return winner.token === mine.token;
  }
  await store.put(key, [...after.slice(-(MAX_PER_SLOT - 1)), mine]);
  return true;
}

async function readSlot({ store, key, now }: { store: WebhookStore; key: string; now: number }): Promise<SeenEvent[]> {
  const stored = await store.get<unknown>(key);
  return (Array.isArray(stored) ? stored : []).filter(
    (entry): entry is SeenEvent =>
      netlifyClient.isRecord(entry) &&
      typeof entry['id'] === 'string' &&
      typeof entry['token'] === 'string' &&
      typeof entry['at'] === 'number' &&
      now - entry['at'] < DEDUPE_WINDOW_MS,
  );
}

function slotKey(eventId: string): string {
  return `${SLOT_KEY_PREFIX}${createHash('sha256').update(eventId).digest().readUInt32BE(0) % SLOT_COUNT}`;
}

function withDedupeKey({ body, eventId }: { body: unknown; eventId: string }): unknown {
  if (!netlifyClient.isRecord(body)) return body;
  return { ...body, [DEDUPE_KEY_PROPERTY]: `netlify:${eventId}` };
}

function verifySignature({ token, secret, rawBody }: { token: string | undefined; secret: string; rawBody: string | null }): boolean {
  if (!token || rawBody === null) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [header, claims, signature] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${claims}`).digest();
  const given = Buffer.from(signature, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  const decodedHeader = decodeJson(header);
  const decodedClaims = decodeJson(claims);
  if (!netlifyClient.isRecord(decodedHeader) || decodedHeader['alg'] !== 'HS256') return false;
  if (!netlifyClient.isRecord(decodedClaims) || decodedClaims['iss'] !== 'netlify') return false;
  const bodyHash = createHash('sha256').update(rawBody).digest('hex');
  return typeof decodedClaims['sha256'] === 'string' && decodedClaims['sha256'] === bodyHash;
}

function decodeJson(segment: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function rawBodyOf(payload: WebhookPayload): string | null {
  const raw = payload.rawBody;
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (raw instanceof Uint8Array) return Buffer.from(raw).toString('utf8');
  return null;
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (!netlifyClient.isRecord(headers)) return undefined;
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = match?.[1];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' ? value : undefined;
}

function eventIdOf(body: unknown): string | null {
  if (!netlifyClient.isRecord(body) || typeof body['id'] !== 'string' || body['id'] === '') return null;
  const state = typeof body['state'] === 'string' ? `:${body['state']}` : '';
  return `${body['id']}${state}`;
}

async function deleteHook({ auth, hookId }: { auth: NetlifyAuthValue; hookId: string }): Promise<void> {
  try {
    await netlifyClient.request({ auth, method: HttpMethod.DELETE, path: `/hooks/${netlifyClient.segment({ value: hookId, label: 'Webhook ID' })}` });
  } catch (error) {
    if (error instanceof NetlifyApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

export const netlifyWebhook = { enable, disable, receive, verifySignature };

type WebhookStore = {
  put: (key: string, value: unknown) => Promise<unknown>;
  get: <T>(key: string) => Promise<T | null>;
  delete: (key: string) => Promise<void>;
};

type SeenEvent = { id: string; at: number; token: string };

type WebhookPayload = {
  body: unknown;
  headers?: unknown;
  rawBody?: unknown;
};
