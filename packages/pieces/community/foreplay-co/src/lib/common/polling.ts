import { Property, Store } from '@activepieces/pieces-framework';
import { ForeplayAuthInput, foreplayClient, ForeplayQuery } from './client';
import { foreplayMappers } from './mappers';
import { foreplayProps } from './props';

const SEEN_KEY = 'foreplay_seen_ad_ids';
const MAX_SEEN = 1000;
const TEST_LIMIT = 5;
const MAX_POLL_PAGES = 5;
const LEGACY_LAST_POLL_KEY = 'lastPoll';
const BACKLOG_KEY = 'foreplay_backlog_cursor';

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
    description: `How many of the newest ads to check per page (1 to 50, default 10). Foreplay charges 1 credit per ad returned. A quiet poll costs one page; if a whole page is new, the trigger reads further pages until it reaches an ad it has already seen, up to ${MAX_POLL_PAGES} pages per poll (worst case ${MAX_POLL_PAGES} × this many credits), and carries on from where it stopped on the next poll so no ad is skipped.`,
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

async function scan({ fetchAds, start, pages, seenBefore, known, before, anchorId, boundaryId, shifting }: ScanParams): Promise<ScanResult> {
  const fresh: unknown[] = [];
  const scannedIds: string[] = [];
  let cursor = start;
  let anchorPending = anchorId !== null;
  for (let page = 1; page <= pages; page++) {
    const result = await fetchAds({ limit: undefined, cursor });
    const pageIds = idsOf(result.ads);
    scannedIds.push(...pageIds);
    let reachedBoundary = false;
    for (const ad of result.ads) {
      const id = idOf(ad);
      const ms = epochMsOf(ad);
      const pastBoundary = id !== null && (id === boundaryId || (!anchorPending && seenBefore.has(id)));
      if (pastBoundary || (!anchorPending && before !== null && ms !== null && ms <= before)) {
        reachedBoundary = true;
        break;
      }
      if (anchorPending) {
        if (id === anchorId) anchorPending = false;
        continue;
      }
      if (id === null || known.has(id) || (before !== null && ms === null)) continue;
      known.add(id);
      fresh.push(ad);
    }
    if (reachedBoundary || result.next === null || result.ads.length === 0) return { fresh, scannedIds, resume: null, pagesUsed: page };
    if (page === pages) return { fresh, scannedIds, resume: resumePoint({ next: result.next, current: cursor, lastId: pageIds[pageIds.length - 1] ?? null, anchorId, anchorPending, shifting }), pagesUsed: page };
    cursor = result.next;
  }
  return { fresh, scannedIds, resume: null, pagesUsed: pages };
}

function resumePoint({ next, current, lastId, anchorId, anchorPending, shifting }: { next: string; current: string | undefined; lastId: string | null; anchorId: string | null; anchorPending: boolean; shifting: boolean }): Resume {
  if (!shifting) return { cursor: next, anchorId: null };
  if (anchorPending) return { cursor: next, anchorId };
  if (lastId === null) return { cursor: next, anchorId: null };
  return { cursor: current ?? '0', anchorId: lastId };
}

function idsOf(ads: unknown[]): string[] {
  return ads.map(idOf).filter((id): id is string => id !== null);
}

async function seed({ store, fetchAds }: { store: Store; fetchAds: FetchAds }): Promise<void> {
  const { ads } = await fetchAds({ limit: undefined, cursor: undefined });
  await store.put(SEEN_KEY, idsOf(ads).slice(0, MAX_SEEN));
  await store.delete(LEGACY_LAST_POLL_KEY);
  await store.delete(BACKLOG_KEY);
}

function backlogOf(value: unknown): Backlog | null {
  const record = foreplayMappers.recordOf(value);
  const cursor = record['cursor'];
  const before = record['before'];
  const anchorId = record['anchorId'];
  const boundaryId = record['boundaryId'];
  if (typeof cursor !== 'string' || cursor === '') return null;
  return {
    cursor,
    before: typeof before === 'number' && Number.isFinite(before) ? before : null,
    anchorId: typeof anchorId === 'string' && anchorId !== '' ? anchorId : null,
    boundaryId: typeof boundaryId === 'string' && boundaryId !== '' ? boundaryId : null,
  };
}

async function pollNewAds({ store, fetchAds, shifting = false }: { store: Store; fetchAds: FetchAds; shifting?: boolean }): Promise<unknown[]> {
  let seen = await seenIds(store);
  let legacyBefore: number | null = null;
  if (seen === null) {
    const lastPoll = await store.get<unknown>(LEGACY_LAST_POLL_KEY);
    if (typeof lastPoll !== 'number' || !Number.isFinite(lastPoll)) {
      await seed({ store, fetchAds });
      return [];
    }
    seen = [];
    legacyBefore = lastPoll;
  }
  const seenBefore = new Set(seen);
  const known = new Set(seen);
  let budget = MAX_POLL_PAGES;
  let olderFresh: unknown[] = [];
  let newerFresh: unknown[] = [];
  let legacyBoundaryIds: string[] = [];
  let nextBacklog: Backlog | null = null;
  const backlog = backlogOf(await store.get<unknown>(BACKLOG_KEY));
  if (backlog !== null) {
    const result = await scan({ fetchAds, start: backlog.cursor, pages: budget, seenBefore, known, before: backlog.before, anchorId: backlog.anchorId, boundaryId: backlog.boundaryId, shifting });
    olderFresh = result.fresh;
    budget -= result.pagesUsed;
    if (result.resume !== null) nextBacklog = { ...result.resume, before: backlog.before, boundaryId: backlog.boundaryId };
  }
  if (nextBacklog === null && budget > 0) {
    const result = await scan({ fetchAds, start: undefined, pages: budget, seenBefore, known, before: legacyBefore, anchorId: null, boundaryId: null, shifting });
    newerFresh = result.fresh;
    if (legacyBefore !== null) legacyBoundaryIds = result.scannedIds;
    if (result.resume !== null) nextBacklog = { ...result.resume, before: legacyBefore, boundaryId: seen[0] ?? null };
  }
  if (nextBacklog === null) await store.delete(BACKLOG_KEY);
  else await store.put(BACKLOG_KEY, nextBacklog);
  const newerIds = idsOf(newerFresh);
  if (newerIds.length > 0 || legacyBefore !== null) await store.put(SEEN_KEY, [...new Set([...newerIds, ...legacyBoundaryIds, ...seen])].slice(0, MAX_SEEN));
  if (legacyBefore !== null) await store.delete(LEGACY_LAST_POLL_KEY);
  return [...olderFresh.reverse(), ...newerFresh.reverse()];
}

async function testAds({ fetchAds }: { fetchAds: FetchAds }): Promise<unknown[]> {
  const { ads } = await fetchAds({ limit: TEST_LIMIT, cursor: undefined });
  return ads;
}

async function clear(store: Store): Promise<void> {
  await store.delete(SEEN_KEY);
  await store.delete(LEGACY_LAST_POLL_KEY);
  await store.delete(BACKLOG_KEY);
}

async function fetchAdPage({ auth, path, query, pageSize }: { auth: ForeplayAuthInput; path: string; query: ForeplayQuery; pageSize: number }): Promise<AdPage> {
  const response = await foreplayClient.request({ auth, path, query });
  const ads = foreplayMappers.listOf(response.body);
  const cursor = foreplayMappers.metadataOf(response.body)['cursor'];
  const next = typeof cursor === 'string' && cursor !== '' ? cursor : typeof cursor === 'number' ? String(cursor) : null;
  return { ads, next: ads.length >= pageSize ? next : null };
}

type Resume = { cursor: string; anchorId: string | null };

type Backlog = Resume & { before: number | null; boundaryId: string | null };

type ScanParams = { fetchAds: FetchAds; start: string | undefined; pages: number; seenBefore: Set<string>; known: Set<string>; before: number | null; anchorId: string | null; boundaryId: string | null; shifting: boolean };

type ScanResult = { fresh: unknown[]; scannedIds: string[]; resume: Resume | null; pagesUsed: number };

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
