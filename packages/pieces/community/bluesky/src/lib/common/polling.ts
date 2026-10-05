const WINDOW_MS = 15 * 60 * 1000;
const MAX_PAGES = 4;
const SEEN_CAP = 500;
const TEST_SAMPLE_SIZE = 5;

function isPollState(value: unknown): value is PollState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seen' in value &&
    Array.isArray(value.seen) &&
    value.seen.every((key: unknown) => typeof key === 'string') &&
    'lastTime' in value &&
    typeof value.lastTime === 'number'
  );
}

async function collect<T>({
  fetchPage,
  stopBefore,
  maxPages,
  seen,
}: {
  fetchPage: PageFetcher<T>;
  stopBefore: number;
  maxPages: number;
  seen: Set<string>;
}): Promise<{ items: PollItem<T>[]; newestTime: number | undefined }> {
  const pages: PollPage<T>[] = [];
  let cursor: string | undefined = undefined;
  for (let page = 0; page < maxPages; page++) {
    const result: PollPage<T> = await fetchPage({ cursor });
    pages.push(result);
    const reachedCheckpoint =
      (result.oldestTime !== undefined && result.oldestTime < stopBefore) ||
      result.items.some((item) => seen.has(item.key));
    if (reachedCheckpoint || !result.cursor || result.cursor === cursor) {
      break;
    }
    cursor = result.cursor;
  }
  const times = pages.flatMap((page) => (page.newestTime === undefined ? [] : [page.newestTime]));
  return {
    items: pages.flatMap((page) => page.items),
    newestTime: times.length === 0 ? undefined : times.reduce((max, time) => (time > max ? time : max), times[0]),
  };
}

function uniqueByKey<T>(items: PollItem<T>[]): PollItem<T>[] {
  const byKey = new Map<string, PollItem<T>>();
  for (const item of items) {
    if (!byKey.has(item.key)) {
      byKey.set(item.key, item);
    }
  }
  return [...byKey.values()];
}

async function seed<T>({ store, storeKey, fetchPage, seenCap = SEEN_CAP, seedPages = 1 }: SeedParams<T>): Promise<PollState> {
  const { items, newestTime } = await collect({ fetchPage, stopBefore: Number.NEGATIVE_INFINITY, maxPages: seedPages, seen: new Set() });
  const keys = uniqueByKey(items).map((item) => item.key);
  const state: PollState = {
    seen: keys.slice(0, seenCap),
    lastTime: newestTime ?? Date.now(),
  };
  await store.put(storeKey, state);
  return state;
}

async function onEnable<T>({ store, storeKey, fetchPage, isRepublish, seenCap, seedPages }: SeedParams<T> & { isRepublish?: boolean }): Promise<void> {
  if (isRepublish && isPollState(await store.get<unknown>(storeKey))) {
    return;
  }
  await seed({ store, storeKey, fetchPage, seenCap, seedPages });
}

async function onDisable({ store, storeKey }: { store: PollStore; storeKey: string }): Promise<void> {
  await store.delete(storeKey);
}

async function poll<T>({
  store,
  storeKey,
  fetchPage,
  maxPages = MAX_PAGES,
  seenCap = SEEN_CAP,
  windowMs = WINDOW_MS,
  seedPages,
}: SeedParams<T> & { maxPages?: number; windowMs?: number }): Promise<T[]> {
  const stored = await store.get<unknown>(storeKey);
  if (!isPollState(stored)) {
    await seed({ store, storeKey, fetchPage, seenCap, seedPages });
    return [];
  }
  const cutoff = stored.lastTime - windowMs;
  const seen = new Set(stored.seen);
  const { items, newestTime } = await collect({ fetchPage, stopBefore: cutoff, maxPages, seen });
  const fresh = uniqueByKey(items)
    .filter((item) => !seen.has(item.key) && item.time >= cutoff)
    .sort((a, b) => b.time - a.time);
  const nextState: PollState = {
    seen: [...fresh.map((item) => item.key), ...stored.seen].slice(0, seenCap),
    lastTime: newestTime !== undefined && newestTime > stored.lastTime ? newestTime : stored.lastTime,
  };
  await store.put(storeKey, nextState);
  return fresh.map((item) => item.data);
}

async function sample<T>({ fetchPage, size = TEST_SAMPLE_SIZE }: { fetchPage: PageFetcher<T>; size?: number }): Promise<T[]> {
  const first = await fetchPage({ cursor: undefined });
  return uniqueByKey(first.items)
    .sort((a, b) => b.time - a.time)
    .slice(0, size)
    .map((item) => item.data);
}

function timeOf(iso: string | undefined | null): number | undefined {
  if (!iso) {
    return undefined;
  }
  const time = Date.parse(iso);
  return Number.isNaN(time) ? undefined : time;
}

function pageTimes(times: (number | undefined)[]): { oldestTime: number | undefined; newestTime: number | undefined } {
  const known = times.flatMap((time) => (time === undefined ? [] : [time]));
  if (known.length === 0) {
    return { oldestTime: undefined, newestTime: undefined };
  }
  return {
    oldestTime: known.reduce((min, time) => (time < min ? time : min), known[0]),
    newestTime: known.reduce((max, time) => (time > max ? time : max), known[0]),
  };
}

export const blueskyPolling = {
  WINDOW_MS,
  MAX_PAGES,
  SEEN_CAP,
  isPollState,
  onEnable,
  onDisable,
  poll,
  sample,
  seed,
  timeOf,
  pageTimes,
};

export type PollItem<T> = { key: string; time: number; data: T };
export type PollPage<T> = { items: PollItem<T>[]; cursor?: string; oldestTime: number | undefined; newestTime: number | undefined };
export type PageFetcher<T> = (args: { cursor: string | undefined }) => Promise<PollPage<T>>;
export type PollState = { seen: string[]; lastTime: number };
export type PollStore = {
  get<V>(key: string): Promise<V | null>;
  put<V>(key: string, value: V): Promise<V>;
  delete(key: string): Promise<void>;
};
type SeedParams<T> = { store: PollStore; storeKey: string; fetchPage: PageFetcher<T>; seenCap?: number; seedPages?: number };
