import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { dripApi, DripRecord } from './client';

const TOKEN_PARAM = 'ap_token';
const CLAIM_SLOTS = 256;
const CLAIM_SETTLE_MS = 500;
const ABANDONED_CLAIM_MS = 60_000;
const SLOT_BATCH = 32;
const SLOT_CAPACITY = 16;
const INDEX_WRITE_ATTEMPTS = 3;

async function enable({ token, accountId, webhookUrl, store, storeKey, event }: EnableParams): Promise<void> {
  const account = dripApi.parseAccountId(accountId);
  const secret = randomBytes(32).toString('hex');
  const body = await dripApi.request<unknown>({
    token,
    method: HttpMethod.POST,
    path: `${dripApi.accountPath(account)}/webhooks`,
    operation: 'create webhook',
    body: { webhooks: [{ post_url: withToken({ url: webhookUrl, secret }), events: [event] }] },
  });
  const created = dripApi.firstRecord({ body, key: 'webhooks', operation: 'create webhook' });
  const webhookId = dripApi.optionalText(created['id']);
  if (webhookId === undefined) {
    throw new Error('Drip created the webhook but returned no webhook ID.');
  }
  try {
    await store.put<DripWebhookInformation>(storeKey, { webhookId, userId: account, secret });
  } catch (error) {
    await deleteWebhook({ token, accountId: account, webhookId }).catch(() => undefined);
    throw error;
  }
}

async function disable({ token, store, storeKey }: DisableParams): Promise<void> {
  const stored = await store.get<DripWebhookInformation>(storeKey);
  if (stored === null || stored === undefined) {
    return;
  }
  await deleteWebhook({ token, accountId: stored.userId, webhookId: stored.webhookId });
  await store.delete(storeKey);
  const indexKeys = Array.from({ length: CLAIM_SLOTS }, (_, slot) => indexKeyOf({ storeKey, slot }));
  for (let start = 0; start < indexKeys.length; start += SLOT_BATCH) {
    await Promise.all(indexKeys.slice(start, start + SLOT_BATCH).map((indexKey) => clearIndex({ store, indexKey })));
  }
}

async function clearIndex({ store, indexKey }: { store: Store; indexKey: string }): Promise<void> {
  for (const claimKey of await readIndex({ store, indexKey })) {
    await store.delete(claimKey);
  }
  await store.delete(indexKey);
}

async function handle({ token, store, storeKey, event, payload, matches }: HandleParams): Promise<unknown[]> {
  const stored = await store.get<DripWebhookInformation>(storeKey);
  if (stored === null || stored === undefined) {
    return [];
  }
  const body = payload.body;
  if (!dripApi.isRecord(body) || body['event'] !== event) {
    return [];
  }
  const data = body['data'];
  if (!dripApi.isRecord(data) || String(data['account_id'] ?? '') !== String(stored.userId)) {
    return [];
  }
  const delivered = readToken(payload.queryParams);
  let verifiedBody: DripRecord = body;
  if (stored.secret) {
    if (delivered === undefined || !sameSecret({ expected: stored.secret, given: delivered })) {
      return [];
    }
  } else {
    const refetched = await confirmWithDrip({ token, accountId: stored.userId, event, body, data });
    if (refetched === undefined) {
      return [];
    }
    verifiedBody = refetched;
  }
  if (matches && !matches(verifiedBody)) {
    return [];
  }
  const key = dedupeKey({ event, data, occurredAt: body['occurred_at'] });
  if (!(await claimDelivery({ store, storeKey, key }))) {
    return [];
  }
  return [{ ...verifiedBody, [DEDUPE_KEY_PROPERTY]: `drip:${storeKey}:${key}` }];
}

async function claimDelivery({ store, storeKey, key }: { store: Store; storeKey: string; key: string }): Promise<boolean> {
  const claimKey = claimKeyOf({ storeKey, key });
  const existing = await store.get<DeliveryClaim>(claimKey);
  if (existing !== null && existing !== undefined && !isAbandoned({ claim: existing, now: Date.now() })) {
    return false;
  }
  const claim: DeliveryClaim = { token: randomUUID(), at: Date.now(), done: false };
  try {
    await store.put<DeliveryClaim>(claimKey, claim);
    await dripApi.sleep(CLAIM_SETTLE_MS);
    const winner = await store.get<DeliveryClaim>(claimKey);
    if (winner !== null && winner !== undefined && winner.token !== claim.token) {
      return false;
    }
    await indexClaim({ store, indexKey: indexKeyOf({ storeKey, slot: slotOf(key) }), claimKey });
    await store.put<DeliveryClaim>(claimKey, { ...claim, done: true });
    return true;
  } catch (error) {
    await releaseClaim({ store, claimKey, claimToken: claim.token });
    throw error;
  }
}

function isAbandoned({ claim, now }: { claim: DeliveryClaim; now: number }): boolean {
  return claim.done === false && typeof claim.at === 'number' && now - claim.at > ABANDONED_CLAIM_MS;
}

async function releaseClaim({ store, claimKey, claimToken }: { store: Store; claimKey: string; claimToken: string }): Promise<void> {
  try {
    const current = await store.get<DeliveryClaim>(claimKey);
    if (current?.token === claimToken) {
      await store.delete(claimKey);
    }
  } catch {
    return;
  }
}

async function readIndex({ store, indexKey }: { store: Store; indexKey: string }): Promise<string[]> {
  const list = await store.get<unknown>(indexKey);
  return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : [];
}

async function indexClaim({ store, indexKey, claimKey }: { store: Store; indexKey: string; claimKey: string }): Promise<void> {
  for (let attempt = 0; attempt < INDEX_WRITE_ATTEMPTS; attempt++) {
    const next = [...(await readIndex({ store, indexKey })).filter((item) => item !== claimKey), claimKey];
    const evicted = next.slice(0, Math.max(0, next.length - SLOT_CAPACITY));
    await store.put<string[]>(indexKey, next.slice(-SLOT_CAPACITY));
    for (const old of evicted) {
      await store.delete(old);
    }
    if ((await readIndex({ store, indexKey })).includes(claimKey)) {
      return;
    }
  }
}

function slotOf(key: string): number {
  return parseInt(key.slice(0, 2), 16) % CLAIM_SLOTS;
}

function claimKeyOf({ storeKey, key }: { storeKey: string; key: string }): string {
  return `${storeKey}_d_${key.slice(0, 40)}`;
}

function indexKeyOf({ storeKey, slot }: { storeKey: string; slot: number }): string {
  return `${storeKey}_i_${slot}`;
}

function withToken({ url, secret }: { url: string; secret: string }): string {
  const parsed = new URL(url);
  parsed.searchParams.set(TOKEN_PARAM, secret);
  return parsed.toString();
}

function readToken(queryParams: Record<string, unknown> | undefined): string | undefined {
  const value = queryParams?.[TOKEN_PARAM];
  const first: unknown = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' && first.length > 0 ? first : undefined;
}

function sameSecret({ expected, given }: { expected: string; given: string }): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function confirmWithDrip({ token, accountId, event, body, data }: { token: string; accountId: string; event: string; body: DripRecord; data: DripRecord }): Promise<DripRecord | undefined> {
  const subscriber = data['subscriber'];
  if (event === 'subscriber.deleted' || !dripApi.isRecord(subscriber)) {
    return undefined;
  }
  const id = dripApi.optionalText(subscriber['id']);
  const email = dripApi.optionalText(subscriber['email']);
  if (id === undefined) {
    return undefined;
  }
  let fetched: DripRecord;
  try {
    const response = await dripApi.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${dripApi.accountPath(accountId)}/subscribers/${dripApi.seg({ value: id, label: 'Subscriber ID' })}`,
      operation: 'confirm webhook subscriber',
    });
    fetched = dripApi.firstRecord({ body: response, key: 'subscribers', operation: 'confirm webhook subscriber' });
  } catch (error) {
    if (dripApi.isNotFound(error)) {
      return undefined;
    }
    throw error;
  }
  if (email !== undefined && String(fetched['email'] ?? '').toLowerCase() !== email.toLowerCase()) {
    return undefined;
  }
  const properties = dripApi.isRecord(data['properties']) ? data['properties'] : {};
  const tag = dripApi.optionalText(properties['tag'])?.toLowerCase();
  const tags = Array.isArray(fetched['tags']) ? fetched['tags'].map((item) => String(item).toLowerCase()) : [];
  if (event === 'subscriber.applied_tag' && (tag === undefined || !tags.includes(tag))) {
    return undefined;
  }
  if (event === 'subscriber.removed_tag' && (tag === undefined || tags.includes(tag))) {
    return undefined;
  }
  return { ...body, data: { ...data, subscriber: fetched } };
}

function dedupeKey({ event, data, occurredAt }: { event: string; data: DripRecord; occurredAt: unknown }): string {
  const subscriber = dripApi.isRecord(data['subscriber']) ? data['subscriber'] : {};
  const parts = [event, String(subscriber['id'] ?? subscriber['email'] ?? ''), String(occurredAt ?? ''), JSON.stringify(data['properties'] ?? null)];
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

async function deleteWebhook({ token, accountId, webhookId }: { token: string; accountId: string; webhookId: string }): Promise<void> {
  try {
    await dripApi.request<unknown>({
      token,
      method: HttpMethod.DELETE,
      path: `${dripApi.accountPath(accountId)}/webhooks/${dripApi.seg({ value: webhookId, label: 'Webhook ID' })}`,
      operation: 'delete webhook',
    });
  } catch (error) {
    if (!dripApi.isNotFound(error)) {
      throw error;
    }
  }
}

function propertiesOf(body: DripRecord): DripRecord {
  const data = body['data'];
  if (!dripApi.isRecord(data) || !dripApi.isRecord(data['properties'])) {
    return {};
  }
  return data['properties'];
}

function textMatches({ expected, actual }: { expected: unknown; actual: unknown }): boolean {
  const wanted = dripApi.optionalText(expected);
  if (wanted === undefined) {
    return true;
  }
  return String(actual ?? '').trim().toLowerCase() === wanted.toLowerCase();
}

export const dripWebhook = {
  enable,
  disable,
  handle,
  withToken,
  propertiesOf,
  textMatches,
  TOKEN_PARAM,
  CLAIM_SLOTS,
  SLOT_CAPACITY,
  ABANDONED_CLAIM_MS,
  claimKeyOf,
  indexKeyOf,
};

type DeliveryClaim = { token: string; at?: number; done?: boolean };

export type DripWebhookInformation = {
  webhookId: string;
  userId: string;
  secret?: string;
};

type EnableParams = {
  token: string;
  accountId: string;
  webhookUrl: string;
  store: Store;
  storeKey: string;
  event: string;
};

type DisableParams = {
  token: string;
  store: Store;
  storeKey: string;
};

type HandleParams = {
  token: string;
  store: Store;
  storeKey: string;
  event: string;
  payload: { body: unknown; queryParams?: Record<string, unknown> };
  matches?: (body: DripRecord) => boolean;
};
