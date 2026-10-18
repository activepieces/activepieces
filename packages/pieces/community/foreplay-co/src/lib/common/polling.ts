import { Property, Store } from '@activepieces/pieces-framework';
import { ForeplayAuthInput, foreplayClient, ForeplayQuery } from './client';
import { foreplayMappers } from './mappers';
import { foreplayProps } from './props';

const SEEN_KEY = 'foreplay_seen_ad_ids';
const MAX_SEEN = 1000;
const TEST_LIMIT = 5;
const MAX_POLL_PAGES = 5;
const LEGACY_LAST_POLL_KEY = 'lastPoll';

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
    description: `How many of the newest ads to check per page (1 to 50, default 10). Foreplay charges 1 credit per ad returned. A quiet poll costs one page; if a whole page is new, the trigger reads further pages until it reaches an ad it has already seen, up to ${MAX_POLL_PAGES} pages per poll.`,
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

function epochMsOf(raw: unknown): number | null {
  const value = foreplayMappers.recordOf(raw)['created_at'];
  if (typeof value === 'number' && Number.isFinite(value)) return value < 100_000_000_000 ? value * 1000 : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

async function fetchUntil({ fetchAds, stop }: { fetchAds: FetchAds; stop: (ad: unknown) => boolean }): Promise<unknown[]> {
  const ads: unknown[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_POLL_PAGES; page++) {
    const result = await fetchAds({ limit: undefined, cursor });
    ads.push(...result.ads);
    if (result.next === null || result.ads.length === 0 || result.ads.some(stop)) break;
    cursor = result.next;
  }
  return ads;
}

function idsOf(ads: unknown[]): string[] {
  return ads.map(idOf).filter((id): id is string => id !== null);
}

async function seed({ store, fetchAds }: { store: Store; fetchAds: FetchAds }): Promise<void> {
  const { ads } = await fetchAds({ limit: undefined, cursor: undefined });
  await store.put(SEEN_KEY, idsOf(ads).slice(0, MAX_SEEN));
  await store.delete(LEGACY_LAST_POLL_KEY);
}

async function catchUpFromLegacyCheckpoint({ store, fetchAds, lastPoll }: { store: Store; fetchAds: FetchAds; lastPoll: number }): Promise<unknown[]> {
  const isOld = (ad: unknown) => {
    const ms = epochMsOf(ad);
    return ms !== null && ms <= lastPoll;
  };
  const ads = await fetchUntil({ fetchAds, stop: isOld });
  const fresh = ads.filter((ad) => {
    const ms = epochMsOf(ad);
    return ms !== null && ms > lastPoll;
  });
  await store.put(SEEN_KEY, [...new Set(idsOf(ads))].slice(0, MAX_SEEN));
  await store.delete(LEGACY_LAST_POLL_KEY);
  return fresh.reverse();
}

async function pollNewAds({ store, fetchAds }: { store: Store; fetchAds: FetchAds }): Promise<unknown[]> {
  const seen = await seenIds(store);
  if (seen === null) {
    const lastPoll = await store.get<unknown>(LEGACY_LAST_POLL_KEY);
    if (typeof lastPoll === 'number' && Number.isFinite(lastPoll)) return catchUpFromLegacyCheckpoint({ store, fetchAds, lastPoll });
    await seed({ store, fetchAds });
    return [];
  }
  const seenBefore = new Set(seen);
  const known = new Set(seen);
  const ads = await fetchUntil({ fetchAds, stop: (ad) => {
    const id = idOf(ad);
    return id !== null && seenBefore.has(id);
  } });
  const fresh: unknown[] = [];
  const freshIds: string[] = [];
  for (const ad of ads) {
    const id = idOf(ad);
    if (id !== null && seenBefore.has(id)) break;
    if (id === null || known.has(id)) continue;
    known.add(id);
    fresh.push(ad);
    freshIds.push(id);
  }
  if (freshIds.length > 0) await store.put(SEEN_KEY, [...freshIds, ...seen].slice(0, MAX_SEEN));
  return fresh.reverse();
}

async function testAds({ fetchAds }: { fetchAds: FetchAds }): Promise<unknown[]> {
  const { ads } = await fetchAds({ limit: TEST_LIMIT, cursor: undefined });
  return ads;
}

async function clear(store: Store): Promise<void> {
  await store.delete(SEEN_KEY);
  await store.delete(LEGACY_LAST_POLL_KEY);
}

async function fetchAdPage({ auth, path, query, pageSize }: { auth: ForeplayAuthInput; path: string; query: ForeplayQuery; pageSize: number }): Promise<AdPage> {
  const response = await foreplayClient.request({ auth, path, query });
  const ads = foreplayMappers.listOf(response.body);
  const cursor = foreplayMappers.metadataOf(response.body)['cursor'];
  const next = typeof cursor === 'string' && cursor !== '' ? cursor : typeof cursor === 'number' ? String(cursor) : null;
  return { ads, next: ads.length >= pageSize ? next : null };
}

type AdPage = { ads: unknown[]; next: string | null };

type FetchAds = (params: { limit: number | undefined; cursor: string | undefined }) => Promise<AdPage>;

const foreplayPolling = {
  pageSizeProp,
  legacyPollingIntervalProp,
  pageSizeOf,
  seed,
  pollNewAds,
  testAds,
  clear,
  fetchAdPage,
  MAX_POLL_PAGES,
};

export { foreplayPolling };
export type { FetchAds, AdPage };
