import { Store } from '@activepieces/pieces-framework';
import { ApolloRecord } from './client';

async function initialise({ fetchPage, store, storeKey, timestampOf, keyOf }: PollerConfig): Promise<void> {
  const newest = await fetchPage({ page: 1, perPage: PAGE_SIZE });
  await store.put(storeKey, checkpointFrom({ items: newest, timestampOf, keyOf, previous: { checkpointMs: 0, seenKeys: [] } }));
}

async function poll({ fetchPage, store, storeKey, timestampOf, keyOf }: PollerConfig): Promise<ApolloRecord[]> {
  const state = await store.get<PollState>(storeKey);
  if (!isPollState(state)) {
    await initialise({ fetchPage, store, storeKey, timestampOf, keyOf });
    return [];
  }
  const seen = new Set(state.seenKeys);
  const collected = new Map<string, ApolloRecord>();
  let reachedCheckpoint = false;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = await fetchPage({ page, perPage: PAGE_SIZE });
    for (const item of items) {
      const timestamp = timestampOf(item);
      const key = keyOf(item);
      if (timestamp === undefined || key === undefined) {
        continue;
      }
      if (timestamp < state.checkpointMs) {
        reachedCheckpoint = true;
        continue;
      }
      if (timestamp === state.checkpointMs && seen.has(key)) {
        continue;
      }
      collected.set(key, item);
    }
    if (reachedCheckpoint || items.length < PAGE_SIZE) {
      reachedCheckpoint = true;
      break;
    }
  }
  if (!reachedCheckpoint) {
    throw new Error(`More than ${MAX_PAGES * PAGE_SIZE} Apollo records changed since the last check. The trigger stopped without moving its checkpoint so none are skipped; disable and re-enable it to start from now.`);
  }
  const fresh = [...collected.values()].sort((a, b) => (timestampOf(a) ?? 0) - (timestampOf(b) ?? 0));
  await store.put(storeKey, checkpointFrom({ items: fresh, timestampOf, keyOf, previous: state }));
  return fresh;
}

async function sample({ fetchPage }: { fetchPage: PollerConfig['fetchPage'] }): Promise<ApolloRecord[]> {
  return (await fetchPage({ page: 1, perPage: SAMPLE_SIZE })).slice(0, SAMPLE_SIZE);
}

function timestampField(field: string): (item: ApolloRecord) => number | undefined {
  return (item) => {
    const value = item[field];
    const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN;
    return Number.isNaN(parsed) ? undefined : parsed;
  };
}

function checkpointFrom({ items, timestampOf, keyOf, previous }: { items: ApolloRecord[]; timestampOf: PollerConfig['timestampOf']; keyOf: PollerConfig['keyOf']; previous: PollState }): PollState {
  const newest = items.reduce((max, item) => Math.max(max, timestampOf(item) ?? 0), previous.checkpointMs);
  const keysAtNewest = items.filter((item) => timestampOf(item) === newest).map((item) => keyOf(item)).filter((key): key is string => key !== undefined);
  const carried = newest === previous.checkpointMs ? previous.seenKeys : [];
  return { checkpointMs: newest, seenKeys: [...new Set([...carried, ...keysAtNewest])] };
}

function isPollState(value: unknown): value is PollState {
  return value !== null && typeof value === 'object' && typeof Reflect.get(value, 'checkpointMs') === 'number' && Array.isArray(Reflect.get(value, 'seenKeys'));
}

const PAGE_SIZE = 100;

const MAX_PAGES = 50;

const SAMPLE_SIZE = 5;

export const apolloPolling = { initialise, poll, sample, timestampField, isPollState, PAGE_SIZE, MAX_PAGES };

export type PollState = {
  checkpointMs: number;
  seenKeys: string[];
};

export type PollerConfig = {
  fetchPage: (params: { page: number; perPage: number }) => Promise<ApolloRecord[]>;
  store: Store;
  storeKey: string;
  timestampOf: (item: ApolloRecord) => number | undefined;
  keyOf: (item: ApolloRecord) => string | undefined;
};
