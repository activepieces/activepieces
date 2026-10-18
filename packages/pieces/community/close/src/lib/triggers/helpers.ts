import crypto from 'crypto';
import { DEDUPE_KEY_PROPERTY, TriggerHookContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../auth';
import { CloseApiError, closeClient } from '../common/client';
import { closeMappers } from '../common/mappers';

const HOUR_MS = 60 * 60 * 1000;
const SEEN_RETENTION_HOURS = 73;
const MAX_BUCKETS_PER_RUN = 24;

export const verifySignature = ({ signatureKey, timestamp, rawBody, signatureHash }: { signatureKey?: string; timestamp?: string; rawBody?: unknown; signatureHash?: string }): boolean => {
  if (!signatureKey || !timestamp || !signatureHash || rawBody === undefined || rawBody === null) return false;
  const body = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : '';
  if (body === '' || !/^[0-9a-f]+$/i.test(signatureHash)) return false;
  try {
    const generated = crypto.createHmac('sha256', Buffer.from(signatureKey, 'hex')).update(timestamp + body, 'utf8').digest();
    const received = Buffer.from(signatureHash, 'hex');
    return received.length === generated.length && crypto.timingSafeEqual(generated, received);
  } catch {
    return false;
  }
};

export function closeCreatedTriggerHooks({ storeKey, objectType }: CreatedTriggerParams) {
  return {
    async onEnable(context: CloseHookContext) {
      const created = await closeClient.request<{ id?: string; signature_key?: string }>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/webhook/',
        body: { url: context.webhookUrl, events: [{ object_type: objectType, action: 'created' }] },
      });
      if (typeof created?.id !== 'string' || typeof created.signature_key !== 'string') {
        throw new Error('Close did not return a webhook ID and signature key.');
      }
      try {
        await context.store.put<WebhookState>(storeKey, { id: created.id, signatureKey: created.signature_key });
      } catch (error) {
        await deleteWebhook({ auth: context.auth, id: created.id }).catch(() => undefined);
        throw error;
      }
    },
    async onDisable(context: CloseHookContext) {
      const state = await context.store.get<WebhookState>(storeKey);
      if (state?.id) await deleteWebhook({ auth: context.auth, id: state.id });
      await clearSeen({ store: context.store, storeKey, now: Date.now() });
      await context.store.delete(storeKey);
      await context.store.delete(`${storeKey}-seen`);
    },
    async run(context: CloseHookContext) {
      const state = await context.store.get<WebhookState>(storeKey);
      const headers = context.payload.headers ?? {};
      if (!verifySignature({ signatureKey: state?.signatureKey, timestamp: headers['close-sig-timestamp'], rawBody: context.payload.rawBody, signatureHash: headers['close-sig-hash'] })) {
        return [];
      }
      const event = closeClient.isRecord(context.payload.body) ? context.payload.body['event'] : undefined;
      if (!closeClient.isRecord(event) || event['object_type'] !== objectType || event['action'] !== 'created') return [];
      const objectId = typeof event['object_id'] === 'string' ? event['object_id'] : closeClient.isRecord(event['data']) && typeof event['data']['id'] === 'string' ? event['data']['id'] : undefined;
      if (!objectId) return [];
      const eventId = typeof event['id'] === 'string' ? event['id'] : objectId;
      const seenKey = `${storeKey}-seen:${eventId}`;
      if (await context.store.get<boolean>(seenKey)) return [];
      const record = await closeClient.request({ auth: context.auth, method: HttpMethod.GET, path: `/${objectType}/${closeClient.pathId(objectId)}/` });
      await context.store.put(seenKey, true);
      await recordSeen({ store: context.store, storeKey, eventId, now: Date.now() }).catch(() => undefined);
      const output = closeMappers.withCustomMap({ objectType, record });
      return [closeClient.isRecord(output) ? { ...output, [DEDUPE_KEY_PROPERTY]: `close:${objectType}:${eventId}` } : output];
    },
  };
}

async function recordSeen({ store, storeKey, eventId, now }: { store: CloseStore; storeKey: string; eventId: string; now: number }): Promise<void> {
  const hour = hourOf(now);
  const ids = idsOf(await store.get<unknown>(bucketKey({ storeKey, hour })));
  if (!ids.includes(eventId)) await store.put(bucketKey({ storeKey, hour }), [...ids, eventId]);
  if ((await store.get<unknown>(`${storeKey}-seen-latest`)) !== hour) await store.put(`${storeKey}-seen-latest`, hour);
  const cutoff = hour - SEEN_RETENTION_HOURS;
  const pruned = await store.get<unknown>(`${storeKey}-seen-pruned`);
  if (typeof pruned !== 'number') {
    await store.put(`${storeKey}-seen-pruned`, cutoff);
    return;
  }
  const last = Math.min(cutoff, pruned + MAX_BUCKETS_PER_RUN);
  for (let h = pruned + 1; h <= last; h++) {
    await deleteBucket({ store, storeKey, hour: h });
  }
  if (last > pruned) await store.put(`${storeKey}-seen-pruned`, last);
}

async function clearSeen({ store, storeKey, now }: { store: CloseStore; storeKey: string; now: number }): Promise<void> {
  const hour = hourOf(now);
  const pruned = await store.get<unknown>(`${storeKey}-seen-pruned`);
  const latest = await store.get<unknown>(`${storeKey}-seen-latest`);
  const last = typeof latest === 'number' ? Math.min(latest, hour) : hour;
  const first = typeof pruned === 'number' ? pruned + 1 : last - SEEN_RETENTION_HOURS;
  for (let h = first; h <= last; h++) {
    await deleteBucket({ store, storeKey, hour: h });
  }
  await store.delete(`${storeKey}-seen-pruned`);
  await store.delete(`${storeKey}-seen-latest`);
}

async function deleteBucket({ store, storeKey, hour }: { store: CloseStore; storeKey: string; hour: number }): Promise<void> {
  const ids = idsOf(await store.get<unknown>(bucketKey({ storeKey, hour })));
  await Promise.all(ids.map((id) => store.delete(`${storeKey}-seen:${id}`)));
  await store.delete(bucketKey({ storeKey, hour }));
}

function hourOf(now: number): number {
  return Math.floor(now / HOUR_MS);
}

function bucketKey({ storeKey, hour }: { storeKey: string; hour: number }): string {
  return `${storeKey}-seen-hour:${hour}`;
}

function idsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}

async function deleteWebhook({ auth, id }: { auth: { secret_text: string }; id: string }): Promise<void> {
  try {
    await closeClient.request({ auth, method: HttpMethod.DELETE, path: `/webhook/${closeClient.pathId(id)}/` });
  } catch (error) {
    if (error instanceof CloseApiError && error.status === 404) return;
    throw error;
  }
}

type CloseStore = CloseHookContext['store'];

type WebhookState = { id: string; signatureKey: string };

type CreatedTriggerParams = {
  storeKey: string;
  objectType: 'lead' | 'contact' | 'opportunity';
};

type CloseHookContext = TriggerHookContext<typeof closeAuth, Record<string, never>, TriggerStrategy.WEBHOOK>;
