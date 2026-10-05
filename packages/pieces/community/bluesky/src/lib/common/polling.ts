const WINDOW_MS = 15 * 60 * 1000;
const MAX_PAGES = 10;
const SEEN_CAP = 500;
const RESUME_STOP_KEYS = 100;
const TEST_SAMPLE_SIZE = 5;

function isPollState(value: unknown): value is PollState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seen' in value &&
    isStringArray(value.seen) &&
    'lastTime' in value &&
    typeof value.lastTime === 'number'
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((key: unknown) => typeof key === 'string');
}

function resumeOf(state: PollState): PollResume | undefined {
  const resume: unknown = state.resume;
  if (
    typeof resume === 'object' &&
    resume !== null &&
    'cursor' in resume &&
    typeof resume.cursor === 'string' &&
    'stopBefore' in resume &&
    typeof resume.stopBefore === 'number' &&
    'stopKeys' in resume &&
    isStringArray(resume.stopKeys)
  ) {
    return { cursor: resume.cursor, stopBefore: resume.stopBefore, stopKeys: resume.stopKeys };
  }
  return undefined;
}

async function collect<T>({
  fetchPage,
  startCursor,
  stopBefore,
  maxPages,
  seen,
}: {
  fetchPage: PageFetcher<T>;
  startCursor?: string;
  stopBefore: number;
  maxPages: number;
  seen: Set<string>;
}): Promise<{ items: PollItem<T>[]; newestTime: number | undefined; unfinishedCursor: string | undefined }> {
  const pages: PollPage<T>[] = [];
  let cursor: string | undefined = startCursor;
  let unfinishedCursor: string | undefined = undefined;
  for (let page = 0; page < maxPages; page++) {
    const result: PollPage<T> = await fetchPage({ cursor });
    pages.push(result);
    const reachedCheckpoint =
      (result.oldestTime !== undefined && result.oldestTime < stopBefore) ||
      result.items.some((item) => seen.has(item.key));
    if (reachedCheckpoint || !result.cursor || result.cursor === cursor) {
      unfinishedCursor = undefined;
      break;
    }
    cursor = result.cursor;
    unfinishedCursor = result.cursor;
  }
  const times = pages.flatMap((page) => (page.newestTime === undefined ? [] : [page.newestTime]));
  return {
    items: pages.flatMap((page) => page.items),
    newestTime: times.length === 0 ? undefined : times.reduce((max, time) => (time > max ? time : max), times[0]),
    unfinishedCursor,
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
  resumable = true,
}: SeedParams<T> & { maxPages?: number; windowMs?: number; resumable?: boolean }): Promise<T[]> {
  const stored = await store.get<unknown>(storeKey);
  if (!isPollState(stored)) {
    await seed({ store, storeKey, fetchPage, seenCap, seedPages });
    return [];
  }
  const resume = resumable ? resumeOf(stored) : undefined;
  if (resume !== undefined) {
    return drain({ store, storeKey, fetchPage, maxPages, seenCap, stored, resume });
  }
  const cutoff = stored.lastTime - windowMs;
  const seen = new Set(stored.seen);
  const { items, newestTime, unfinishedCursor } = await collect({ fetchPage, stopBefore: cutoff, maxPages, seen });
  const fresh = freshItems({ items, seen, stopBefore: cutoff });
  const nextResume: PollResume | undefined =
    resumable && unfinishedCursor !== undefined
      ? { cursor: unfinishedCursor, stopBefore: cutoff, stopKeys: stored.seen.slice(0, RESUME_STOP_KEYS) }
      : undefined;
  const nextState: PollState = {
    seen: keepSeen({ emitted: fresh.map((item) => item.key), previous: stored.seen, seenCap }),
    lastTime: newestTime !== undefined && newestTime > stored.lastTime ? newestTime : stored.lastTime,
    ...(nextResume ? { resume: nextResume } : {}),
  };
  await store.put(storeKey, nextState);
  return fresh.map((item) => item.data);
}

async function drain<T>({
  store,
  storeKey,
  fetchPage,
  maxPages,
  seenCap,
  stored,
  resume,
}: {
  store: PollStore;
  storeKey: string;
  fetchPage: PageFetcher<T>;
  maxPages: number;
  seenCap: number;
  stored: PollState;
  resume: PollResume;
}): Promise<T[]> {
  const stopKeys = new Set(resume.stopKeys);
  const { items, unfinishedCursor } = await collect({
    fetchPage,
    startCursor: resume.cursor,
    stopBefore: resume.stopBefore,
    maxPages,
    seen: stopKeys,
  });
  const fresh = freshItems({ items, seen: new Set([...stored.seen, ...resume.stopKeys]), stopBefore: resume.stopBefore });
  const nextState: PollState = {
    seen: [...stored.seen.slice(0, seenCap), ...fresh.map((item) => item.key)],
    lastTime: stored.lastTime,
    ...(unfinishedCursor !== undefined ? { resume: { ...resume, cursor: unfinishedCursor } } : {}),
  };
  await store.put(storeKey, nextState);
  return fresh.map((item) => item.data);
}

function keepSeen({ emitted, previous, seenCap }: { emitted: string[]; previous: string[]; seenCap: number }): string[] {
  return [...emitted, ...previous].slice(0, Math.max(seenCap, emitted.length));
}

function freshItems<T>({ items, seen, stopBefore }: { items: PollItem<T>[]; seen: Set<string>; stopBefore: number }): PollItem<T>[] {
  return uniqueByKey(items)
    .filter((item) => !seen.has(item.key) && item.time >= stopBefore)
    .sort((a, b) => b.time - a.time);
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
export type PollState = { seen: string[]; lastTime: number; resume?: PollResume };
export type PollResume = { cursor: string; stopBefore: number; stopKeys: string[] };
export type PollStore = {
  get<V>(key: string): Promise<V | null>;
  put<V>(key: string, value: V): Promise<V>;
  delete(key: string): Promise<void>;
};
type SeedParams<T> = { store: PollStore; storeKey: string; fetchPage: PageFetcher<T>; seenCap?: number; seedPages?: number };
