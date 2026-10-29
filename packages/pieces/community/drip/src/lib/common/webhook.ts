import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { dripApi, DripRecord } from './client';

const TOKEN_PARAM = 'ap_token';
const CLAIM_CELLS = 256;
const CLAIM_PROBES = 4;
const CLAIM_SETTLE_MS = 500;
const ABANDONED_CLAIM_MS = 60_000;
const CELL_DELETE_BATCH = 32;

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
  const keys = Array.from({ length: CLAIM_CELLS }, (_, cell) => cellKeyOf({ storeKey, cell })).flatMap((cellKey) => [cellKey, doneKeyOf(cellKey)]);
  for (let start = 0; start < keys.length; start += CELL_DELETE_BATCH) {
    await Promise.all(keys.slice(start, start + CELL_DELETE_BATCH).map((key) => store.delete(key)));
  }
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
  const cells = probeCells({ storeKey, key });
  const states = await readCells({ store, cells });
  if (states.some((state) => holds({ state, key, now: Date.now() }))) {
    return false;
  }
  const claim: DeliveryClaim = { key, token: randomUUID(), at: Date.now() };
  const order = preferredCells({ cells, states, key });
  for (const cellKey of order) {
    const outcome = await tryCell({ store, cellKey, claim });
    if (outcome === 'lost') {
      return false;
    }
    if (outcome === 'won') {
      return recordDone({ store, cells, cellKey, claim });
    }
  }
  return recordDone({ store, cells, cellKey: order[0], claim });
}

async function recordDone({ store, cells, cellKey, claim }: { store: Store; cells: string[]; cellKey: string; claim: DeliveryClaim }): Promise<boolean> {
  try {
    if ((await readCells({ store, cells })).some((state) => state.done?.key === claim.key)) {
      return false;
    }
    await store.put<DeliveryClaim>(doneKeyOf(cellKey), claim);
  } catch (error) {
    await releaseClaim({ store, cellKey, claimToken: claim.token });
    throw error;
  }
  return true;
}

async function tryCell({ store, cellKey, claim }: { store: Store; cellKey: string; claim: DeliveryClaim }): Promise<'won' | 'lost' | 'taken'> {
  try {
    await store.put<DeliveryClaim>(cellKey, claim);
    await dripApi.sleep(CLAIM_SETTLE_MS);
    const current = await store.get<DeliveryClaim>(cellKey);
    if (current === null || current === undefined) {
      return 'won';
    }
    if (current.key !== claim.key) {
      return 'taken';
    }
    return current.token === claim.token ? 'won' : 'lost';
  } catch (error) {
    await releaseClaim({ store, cellKey, claimToken: claim.token });
    throw error;
  }
}

async function readCells({ store, cells }: { store: Store; cells: string[] }): Promise<CellState[]> {
  return Promise.all(
    cells.map(async (cellKey) => {
      const [claim, done] = await Promise.all([store.get<DeliveryClaim>(cellKey), store.get<DeliveryClaim>(doneKeyOf(cellKey))]);
      return { claim: claim ?? undefined, done: done ?? undefined };
    }),
  );
}

function holds({ state, key, now }: { state: CellState; key: string; now: number }): boolean {
  if (state.done?.key === key) {
    return true;
  }
  return state.claim?.key === key && !isAbandoned({ claim: state.claim, now });
}

function preferredCells({ cells, states, key }: { cells: string[]; states: CellState[]; key: string }): string[] {
  const rank = (state: CellState): number => {
    if (state.claim?.key === key) {
      return -2;
    }
    if (state.claim === undefined && state.done === undefined) {
      return -1;
    }
    return Math.max(state.claim?.at ?? 0, state.done?.at ?? 0);
  };
  return cells.map((cellKey, index) => ({ cellKey, rank: rank(states[index]) })).sort((a, b) => a.rank - b.rank).map((entry) => entry.cellKey);
}

function isAbandoned({ claim, now }: { claim: DeliveryClaim; now: number }): boolean {
  return typeof claim.at === 'number' && now - claim.at > ABANDONED_CLAIM_MS;
}

async function releaseClaim({ store, cellKey, claimToken }: { store: Store; cellKey: string; claimToken: string }): Promise<void> {
  try {
    const current = await store.get<DeliveryClaim>(cellKey);
    if (current?.token === claimToken) {
      await store.delete(cellKey);
    }
  } catch {
    return;
  }
}

function probeCells({ storeKey, key }: { storeKey: string; key: string }): string[] {
  const cells = Array.from({ length: CLAIM_PROBES }, (_, probe) => parseInt(key.slice(probe * 6, probe * 6 + 6), 16) % CLAIM_CELLS);
  return [...new Set(cells)].map((cell) => cellKeyOf({ storeKey, cell }));
}

function cellKeyOf({ storeKey, cell }: { storeKey: string; cell: number }): string {
  return `${storeKey}_c_${cell}`;
}

function doneKeyOf(cellKey: string): string {
  return `${cellKey}_ok`;
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
  CLAIM_CELLS,
  ABANDONED_CLAIM_MS,
  probeCells,
  doneKeyOf,
};

type DeliveryClaim = { key?: string; token: string; at?: number };

type CellState = { claim?: DeliveryClaim; done?: DeliveryClaim };

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
