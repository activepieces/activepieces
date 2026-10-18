import { Property, Store } from '@activepieces/pieces-framework';
import { ForeplayAuthInput, foreplayClient } from './client';
import { foreplayMappers } from './mappers';
import { foreplayProps } from './props';

const SEEN_KEY = 'foreplay_seen_ad_ids';
const MAX_SEEN = 1000;
const TEST_LIMIT = 5;

function idOf(raw: unknown): string | null {
  const record = foreplayMappers.recordOf(raw);
  return foreplayMappers.str(record['id']) ?? foreplayMappers.str(record['ad_id']);
}

function legacyPollingIntervalProp() {
  return Property.Number({
    displayName: 'Polling Interval (minutes)',
    description: 'No longer used; Activepieces sets the polling schedule.',
    required: false,
    defaultValue: 5,
  });
}

function pageSizeProp() {
  return Property.Number({
    displayName: 'Ads Checked per Poll',
    description: 'How many of the newest ads to check each time (1 to 50, default 10). Foreplay charges 1 credit per ad returned, so every poll can cost up to this many credits.',
    required: false,
    defaultValue: 10,
  });
}

function pageSizeOf(value: unknown): number {
  return foreplayProps.parseInteger({ value, label: 'Ads Checked per Poll', min: 1, max: 50 }) ?? 10;
}

async function seenIds(store: Store): Promise<string[] | null> {
  const value = await store.get<unknown>(SEEN_KEY);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : null;
}

async function seed({ store, fetchAds }: { store: Store; fetchAds: FetchAds }): Promise<void> {
  const ads = await fetchAds({ limit: undefined });
  const ids = ads.map(idOf).filter((id): id is string => id !== null);
  await store.put(SEEN_KEY, ids.slice(0, MAX_SEEN));
}

async function pollNewAds({ store, fetchAds }: { store: Store; fetchAds: FetchAds }): Promise<unknown[]> {
  const seen = await seenIds(store);
  if (seen === null) {
    await seed({ store, fetchAds });
    return [];
  }
  const ads = await fetchAds({ limit: undefined });
  const known = new Set(seen);
  const fresh: unknown[] = [];
  const freshIds: string[] = [];
  for (const ad of ads) {
    const id = idOf(ad);
    if (id === null || known.has(id)) continue;
    known.add(id);
    fresh.push(ad);
    freshIds.push(id);
  }
  if (freshIds.length > 0) await store.put(SEEN_KEY, [...freshIds, ...seen].slice(0, MAX_SEEN));
  return fresh.reverse();
}

async function testAds({ fetchAds }: { fetchAds: FetchAds }): Promise<unknown[]> {
  return fetchAds({ limit: TEST_LIMIT });
}

async function clear(store: Store): Promise<void> {
  await store.delete(SEEN_KEY);
}

async function fetchAdList({ auth, path, query }: { auth: ForeplayAuthInput; path: string; query: Record<string, string | number | boolean | string[] | null | undefined> }): Promise<unknown[]> {
  const response = await foreplayClient.request({ auth, path, query });
  return foreplayMappers.listOf(response.body);
}

type FetchAds = (params: { limit: number | undefined }) => Promise<unknown[]>;

const foreplayPolling = {
  pageSizeProp,
  legacyPollingIntervalProp,
  pageSizeOf,
  seed,
  pollNewAds,
  testAds,
  clear,
  fetchAdList,
};

export { foreplayPolling };
export type { FetchAds };
