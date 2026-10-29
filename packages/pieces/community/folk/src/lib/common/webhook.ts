import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { folkClient, FolkAuthValue } from './client';

function verifySignature({
  secret,
  headers,
  rawBody,
  nowSeconds,
}: {
  secret: string;
  headers: Record<string, unknown>;
  rawBody: unknown;
  nowSeconds: number;
}): { valid: true; webhookId: string } | { valid: false; reason: string } {
  const lower = lowerCaseHeaders({ headers });
  const webhookId = lower['webhook-id'];
  const timestamp = lower['webhook-timestamp'];
  const signatures = lower['webhook-signature'];
  if (!webhookId || !timestamp || !signatures) {
    return { valid: false, reason: 'missing signature headers' };
  }
  if (!/^\d{1,12}$/.test(timestamp)) {
    return { valid: false, reason: 'bad timestamp' };
  }
  if (Math.abs(nowSeconds - Number(timestamp)) > TOLERANCE_SECONDS) {
    return { valid: false, reason: 'timestamp outside the tolerance window' };
  }
  const body = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : undefined;
  if (body === undefined) {
    return { valid: false, reason: 'raw body unavailable' };
  }
  const key = secretKey({ secret });
  if (key.length === 0) {
    return { valid: false, reason: 'empty secret' };
  }
  const expected = createHmac('sha256', key).update(`${webhookId}.${timestamp}.${body}`).digest();
  const matches = signatures
    .split(' ')
    .filter((entry) => entry.startsWith('v1,'))
    .some((entry) => {
      const given = Buffer.from(entry.slice(3), 'base64');
      return given.length === expected.length && timingSafeEqual(given, expected);
    });
  return matches ? { valid: true, webhookId } : { valid: false, reason: 'signature mismatch' };
}

function sign({ secret, webhookId, timestamp, body }: { secret: string; webhookId: string; timestamp: number; body: string }): string {
  return `v1,${createHmac('sha256', secretKey({ secret })).update(`${webhookId}.${timestamp}.${body}`).digest('base64')}`;
}

function rememberDelivery({ seen, deliveryId }: { seen: unknown; deliveryId: string }): { duplicate: boolean; seen: string[]; evicted: string[] } {
  const ids = Array.isArray(seen) ? seen.filter((id): id is string => typeof id === 'string') : [];
  if (ids.includes(deliveryId)) {
    return { duplicate: true, seen: ids, evicted: [] };
  }
  const all = [...ids, deliveryId];
  const cut = Math.max(all.length - MAX_SEEN_IDS, 0);
  return { duplicate: false, seen: all.slice(cut), evicted: all.slice(0, cut) };
}

function claimKeyOf({ deliveryId }: { deliveryId: string }): string {
  return `_evt_${createHash('sha256').update(deliveryId).digest('hex').slice(0, 40)}`;
}

async function claimDelivery({ store, deliveryId }: { store: Store; deliveryId: string }): Promise<boolean> {
  const key = claimKeyOf({ deliveryId });
  if ((await store.get<string>(key)) !== null) {
    return false;
  }
  const token = randomUUID();
  await store.put(key, token);
  await sleep(CLAIM_SETTLE_MS);
  if ((await store.get<string>(key)) !== token) {
    return false;
  }
  const remembered = rememberDelivery({ seen: await store.get<unknown>(SEEN_KEY), deliveryId: key });
  await store.put(SEEN_KEY, remembered.seen);
  await Promise.all(remembered.evicted.map((evictedKey) => store.delete(evictedKey)));
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handlers({ eventType, label }: { eventType: string; label: string }) {
  return {
    async onEnable(context: EnableContext): Promise<void> {
      const groupId = context.propsValue?.groupId;
      const subscribedEvents = [{ eventType, ...(groupId ? { filter: { groupId } } : {}) }];
      const created = await folkClient.sendData<{ id?: unknown; signingSecret?: unknown }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/v1/webhooks',
        body: { name: `Activepieces ${label}`, targetUrl: context.webhookUrl, subscribedEvents },
      });
      const webhookId = typeof created.id === 'string' ? created.id : undefined;
      const signingSecret = typeof created.signingSecret === 'string' ? created.signingSecret : undefined;
      if (!webhookId || !signingSecret) {
        if (webhookId) {
          await folkClient.deleteWebhook({ auth: context.auth, webhookId }).catch(() => undefined);
        }
        throw new Error('Folk created the webhook but did not return its ID and signing secret. Try publishing again.');
      }
      try {
        await context.store.put(WEBHOOK_ID_KEY, webhookId);
        await context.store.put(SECRET_KEY, signingSecret);
      } catch (error) {
        await folkClient.deleteWebhook({ auth: context.auth, webhookId }).catch(() => undefined);
        throw error;
      }
    },
    async onDisable(context: DisableContext): Promise<void> {
      const webhookId = await context.store.get<string>(WEBHOOK_ID_KEY);
      if (webhookId) {
        await folkClient.deleteWebhook({ auth: context.auth, webhookId });
      }
      await context.store.delete(WEBHOOK_ID_KEY);
      await context.store.delete(SECRET_KEY);
      const seen = await context.store.get<unknown>(SEEN_KEY);
      const claimKeys = Array.isArray(seen) ? seen.filter((key): key is string => typeof key === 'string') : [];
      await Promise.all(claimKeys.map((key) => context.store.delete(key)));
      await context.store.delete(SEEN_KEY);
    },
    async run(context: RunContext): Promise<unknown[]> {
      const body = context.payload.body;
      if (typeof body !== 'object' || body === null || Reflect.get(body, 'type') !== eventType) {
        return [];
      }
      const secret = await context.store.get<string>(SECRET_KEY);
      const eventId: unknown = Reflect.get(body, 'id');
      let deliveryId = typeof eventId === 'string' ? eventId : undefined;
      if (secret) {
        const verification = verifySignature({
          secret,
          headers: context.payload.headers ?? {},
          rawBody: context.payload.rawBody,
          nowSeconds: Math.floor(Date.now() / 1000),
        });
        if (!verification.valid) {
          return [];
        }
        deliveryId = deliveryId ?? verification.webhookId;
      }
      if (deliveryId && !(await claimDelivery({ store: context.store, deliveryId }))) {
        return [];
      }
      return [body];
    },
  };
}

function secretKey({ secret }: { secret: string }): Buffer {
  const trimmed = secret.trim();
  const encoded = trimmed.startsWith('whsec_') ? trimmed.slice('whsec_'.length) : trimmed;
  return Buffer.from(encoded, 'base64');
}

function lowerCaseHeaders({ headers }: { headers: Record<string, unknown> }): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name.toLowerCase(),
      Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : undefined,
    ])
  );
}

const TOLERANCE_SECONDS = 3600;
const MAX_SEEN_IDS = 200;
const WEBHOOK_ID_KEY = '_webhookId';
const SECRET_KEY = '_signingSecret';
const SEEN_KEY = '_seenEventIds';
const CLAIM_SETTLE_MS = 300;

export const folkWebhook = { verifySignature, sign, rememberDelivery, handlers, TOLERANCE_SECONDS, MAX_SEEN_IDS };

type EnableContext = { auth: FolkAuthValue; webhookUrl: string; store: Store; propsValue?: { groupId?: string } };
type DisableContext = { auth: FolkAuthValue; store: Store };
type RunContext = { store: Store; payload: { body: unknown; headers?: Record<string, unknown>; rawBody?: unknown } };
