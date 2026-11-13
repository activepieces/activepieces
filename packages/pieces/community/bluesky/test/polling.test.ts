import { describe, expect, it } from 'vitest';
import { blueskyPolling, PageFetcher, PollStore } from '../src/lib/common/polling';

const PAGE_SIZE = 100;

function memoryStore(): PollStore & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async <V>(key: string): Promise<V | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(JSON.stringify(raw));
    },
    put: async <V>(key: string, value: V): Promise<V> => {
      data.set(key, JSON.parse(JSON.stringify(value)));
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function feedOf({ count, startTime, prefix }: { count: number; startTime: number; prefix: string }): FeedEntry[] {
  return Array.from({ length: count }, (_, index) => ({ key: `${prefix}${index}`, time: startTime + index * 1000 })).reverse();
}

function pagedFeed({ entries, timed }: { entries: () => FeedEntry[]; timed: boolean }): { fetchPage: PageFetcher<string>; pagesRead: () => number } {
  let pagesRead = 0;
  const fetchPage: PageFetcher<string> = async ({ cursor }) => {
    pagesRead++;
    const all = entries();
    const offset = cursor === undefined ? 0 : all.findIndex((entry) => entry.key === cursor) + 1;
    const slice = all.slice(offset, offset + PAGE_SIZE);
    const times = blueskyPolling.pageTimes(slice.map((entry) => (timed ? entry.time : undefined)));
    return {
      items: slice.map((entry) => ({ key: entry.key, time: timed ? entry.time : Date.now(), data: entry.key })),
      cursor: offset + PAGE_SIZE < all.length ? slice[slice.length - 1].key : undefined,
      ...times,
    };
  };
  return { fetchPage, pagesRead: () => pagesRead };
}

describe('polling catch-up', () => {
  it('emits every item when more pages than the per-poll budget arrive between polls', async () => {
    const now = Date.now();
    const old = feedOf({ count: 50, startTime: now - 3_600_000, prefix: 'old' });
    let entries = old;
    const store = memoryStore();
    const feed = pagedFeed({ entries: () => entries, timed: true });
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    const burst = feedOf({ count: 1500, startTime: now - 1_800_000, prefix: 'new' });
    entries = [...burst, ...old];

    const first = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    expect(first).toHaveLength(blueskyPolling.MAX_PAGES * PAGE_SIZE);
    const second = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    const third = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage });

    const emitted = [...first, ...second, ...third];
    expect(new Set(emitted).size).toBe(emitted.length);
    expect(new Set(emitted)).toEqual(new Set(burst.map((entry) => entry.key)));
    expect(third).toEqual([]);
  });

  it('keeps the key of every emitted event even when one poll emits more than the seen cap', async () => {
    const now = Date.now();
    const old = feedOf({ count: 20, startTime: now - 3_600_000, prefix: 'old' });
    let entries = old;
    const store = memoryStore();
    const feed = pagedFeed({ entries: () => entries, timed: true });
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    const burst = feedOf({ count: 1800, startTime: now - 1_800_000, prefix: 'b' });
    entries = [...burst, ...old];
    const first = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    const afterHead = await store.get<{ seen: string[] }>('k');
    expect(afterHead?.seen).toEqual(expect.arrayContaining(first));
    const second = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    const afterDrain = await store.get<{ seen: string[] }>('k');
    expect(second).toHaveLength(800);
    expect(afterDrain?.seen).toEqual(expect.arrayContaining(second));
    expect(afterDrain?.seen.slice(0, blueskyPolling.SEEN_CAP)).toEqual(afterHead?.seen.slice(0, blueskyPolling.SEEN_CAP));
  });

  it('keeps reading new items at the head after finishing the backlog', async () => {
    const now = Date.now();
    const old = feedOf({ count: 10, startTime: now - 3_600_000, prefix: 'old' });
    let entries = old;
    const store = memoryStore();
    const feed = pagedFeed({ entries: () => entries, timed: true });
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    const burst = feedOf({ count: 450, startTime: now - 1_800_000, prefix: 'burst' });
    entries = [...burst, ...old];
    const first = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage, maxPages: 4 });
    const later = feedOf({ count: 30, startTime: now - 60_000, prefix: 'later' });
    entries = [...later, ...burst, ...old];
    const second = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage, maxPages: 4 });
    const third = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage, maxPages: 4 });
    const fourth = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage, maxPages: 4 });

    expect(first).toHaveLength(400);
    expect(second).toHaveLength(50);
    expect(third.sort()).toEqual(later.map((entry) => entry.key).sort());
    expect(fourth).toEqual([]);
  });

  it('catches up an untimed list (followers) even when the seen list was trimmed', async () => {
    const old = feedOf({ count: 20, startTime: 0, prefix: 'old' });
    let entries = old;
    const store = memoryStore();
    const feed = pagedFeed({ entries: () => entries, timed: false });
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: feed.fetchPage, seenCap: 150 });
    const burst = feedOf({ count: 650, startTime: 0, prefix: 'f' });
    entries = [...burst, ...old];
    const emitted: string[] = [];
    for (let round = 0; round < 4; round++) {
      emitted.push(...(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage, seenCap: 150, maxPages: 3 })));
    }
    expect(emitted.sort()).toEqual(burst.map((entry) => entry.key).sort());
  });

  it('does not keep a resume cursor when catching up is turned off', async () => {
    const now = Date.now();
    let entries = feedOf({ count: 5, startTime: now - 3_600_000, prefix: 'old' });
    const store = memoryStore();
    const feed = pagedFeed({ entries: () => entries, timed: true });
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    entries = [...feedOf({ count: 300, startTime: now - 600_000, prefix: 'top' }), ...entries];
    await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage, maxPages: 1, resumable: false });
    const state = store.data.get('k');
    expect(state).toBeDefined();
    expect(typeof state === 'object' && state !== null && 'resume' in state).toBe(false);
  });

  it('ignores a malformed resume entry and polls from the head', async () => {
    const now = Date.now();
    const store = memoryStore();
    const entries = feedOf({ count: 3, startTime: now - 60_000, prefix: 'n' });
    await store.put('k', { seen: [], lastTime: now - 120_000, resume: { cursor: 5, stopBefore: 0 } });
    const feed = pagedFeed({ entries: () => entries, timed: true });
    const events = await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: feed.fetchPage });
    expect(events).toHaveLength(3);
  });
});

type FeedEntry = { key: string; time: number };
