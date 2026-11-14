import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds, MemoryStore, RouteFeedServer } from './helpers/fake-feeds';

const single = fakeFeeds.asPolling(rssNewItemTrigger);
const multi = fakeFeeds.asPolling(rssNewItemListTrigger);
let server: RouteFeedServer;

beforeAll(async () => {
  server = await fakeFeeds.startRouteServer();
});
afterAll(async () => {
  await server.stop();
});

function rss({ items }: { items: FeedEntry[] }): string {
  const body = items
    .map(
      (entry) =>
        `<item><title>${entry.title ?? 'item'}</title>` +
        (entry.link === undefined ? '' : `<link>${entry.link}</link>`) +
        (entry.guid === undefined ? '' : `<guid isPermaLink="false">${entry.guid}</guid>`) +
        (entry.at === undefined ? '' : `<pubDate>${new Date(entry.at).toUTCString()}</pubDate>`) +
        '</item>',
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title><description>d</description>${body}</channel></rss>`;
}

function setFeed({ path, items }: { path: string; items: FeedEntry[] }): void {
  server.set(path, { body: rss({ items }) });
}

function multiContext({ store, paths }: { store: MemoryStore; paths: string[] }) {
  return fakeFeeds.triggerContext({
    trigger: multi,
    propsValue: { rss_feed_urls: paths.map((path) => server.url(path)) },
    store,
  });
}

function singleContext({ store, path }: { store: MemoryStore; path: string }) {
  return fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: server.url(path) }, store });
}

function links({ items }: { items: unknown[] }): string[] {
  return items.map((item) => {
    const link: unknown = typeof item === 'object' && item !== null ? Reflect.get(item, 'link') : undefined;
    return typeof link === 'string' ? link : '';
  });
}

function hash({ identity }: { identity: string }): string {
  return createHash('sha256').update(identity).digest('hex').slice(0, 16);
}

function cursorKeyFor({ path }: { path: string }): string {
  return `rss_feed_${createHash('sha256').update(server.url(path)).digest('hex').slice(0, 32)}`;
}

describe('Greptile P1 #1: relative links on items with an empty guid collide across unrelated feeds', () => {
  it('two unrelated feeds that both list posts/1 in one poll both fire, with their own absolute links', async () => {
    const a = '/g1/site-a/feed.xml';
    const b = '/g1/site-b/feed.xml';
    setFeed({ path: a, items: [{ guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    setFeed({ path: b, items: [{ guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    const store = fakeFeeds.memoryStore();
    await multi.onEnable(multiContext({ store, paths: [a, b] }));
    setFeed({ path: a, items: [{ guid: '', link: 'posts/1', at: '2026-10-20T09:00:00Z' }, { guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    setFeed({ path: b, items: [{ guid: '', link: 'posts/1', at: '2026-10-20T09:10:00Z' }, { guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    expect(links({ items: await multi.run(multiContext({ store, paths: [a, b] })) })).toEqual([
      server.url('/g1/site-b/posts/1'),
      server.url('/g1/site-a/posts/1'),
    ]);
    expect(await multi.run(multiContext({ store, paths: [a, b] }))).toEqual([]);
  });

  it('a later posts/1 in feed B still fires after feed A delivered its own posts/1', async () => {
    const a = '/g2/site-a/feed.xml';
    const b = '/g2/site-b/feed.xml';
    setFeed({ path: a, items: [{ guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    setFeed({ path: b, items: [{ guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    const store = fakeFeeds.memoryStore();
    await multi.onEnable(multiContext({ store, paths: [a, b] }));
    setFeed({ path: a, items: [{ guid: '', link: 'posts/1', at: '2026-10-20T09:00:00Z' }, { guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    expect(links({ items: await multi.run(multiContext({ store, paths: [a, b] })) })).toEqual([server.url('/g2/site-a/posts/1')]);
    setFeed({ path: b, items: [{ guid: '', link: 'posts/1', at: '2026-10-20T09:30:00Z' }, { guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    expect(links({ items: await multi.run(multiContext({ store, paths: [a, b] })) })).toEqual([server.url('/g2/site-b/posts/1')]);
  });

  it('the same article (same resolved URL, relative in one feed and absolute in the other) fires once', async () => {
    const a = '/g3/blog/a.xml';
    const b = '/g3/blog/b.xml';
    setFeed({ path: a, items: [{ guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    setFeed({ path: b, items: [{ guid: '', link: 'https://other.test/seed', at: '2026-10-20T08:00:00Z' }] });
    const store = fakeFeeds.memoryStore();
    await multi.onEnable(multiContext({ store, paths: [a, b] }));
    setFeed({ path: a, items: [{ guid: '', link: 'posts/7', at: '2026-10-20T09:00:00Z' }, { guid: '', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] });
    expect(links({ items: await multi.run(multiContext({ store, paths: [a, b] })) })).toEqual([server.url('/g3/blog/posts/7')]);
    setFeed({
      path: b,
      items: [{ guid: '', link: server.url('/g3/blog/posts/7'), at: '2026-10-20T09:00:00Z' }, { guid: '', link: 'https://other.test/seed', at: '2026-10-20T08:00:00Z' }],
    });
    expect(await multi.run(multiContext({ store, paths: [a, b] }))).toEqual([]);
  });

  it('key stability: the per-feed key of an item without a guid is still the hash of its raw link', async () => {
    const path = '/g4/feed.xml';
    setFeed({ path, items: [{ guid: '', link: 'posts/1', at: '2026-10-20T08:00:00Z' }] });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    const cursor = fakeFeeds.storeValue({ store, key: cursorKeyFor({ path }) }) as { seen: string[] };
    expect(cursor.seen[0]).toBe(hash({ identity: 'posts/1' }));
  });
});

describe('Greptile P1 #2: a query change on a relative link re-fires a bare-guid item', () => {
  it('an undated bare-guid item whose relative link changes only its query does not fire again', async () => {
    const path = '/q1/feed.xml';
    setFeed({ path, items: [{ guid: '42', link: 'posts/42?t=1' }] });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({ path, items: [{ guid: '42', link: 'posts/42?t=2' }] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({ path, items: [{ guid: '43', link: 'posts/43' }, { guid: '42', link: 'posts/42?t=3' }] });
    expect(links({ items: await single.run(singleContext({ store, path })) })).toEqual([server.url('/q1/posts/43')]);
  });

  it('a dated bare-guid item at the cursor time whose relative link changes does not fire again', async () => {
    const path = '/q2/feed.xml';
    setFeed({ path, items: [{ guid: '42', link: 'posts/42?t=1', at: '2026-10-20T08:00:00Z' }] });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    setFeed({ path, items: [{ guid: '42', link: 'posts/42?t=2', at: '2026-10-20T08:00:00Z' }] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
  });

  it('round-1 store: an item stored under the raw relative-link key does not fire after the key change', async () => {
    const path = '/q3/feed.xml';
    setFeed({ path, items: [{ guid: '42', link: 'posts/42' }, { guid: '41', link: 'posts/41' }] });
    const store = fakeFeeds.memoryStore();
    await store.put(cursorKeyFor({ path }), {
      publishedAt: null,
      seen: [hash({ identity: '42|posts/42' }), hash({ identity: '41|posts/41' })],
    });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({ path, items: [{ guid: '41', link: 'posts/41' }, { guid: '42', link: 'posts/42' }] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
  });

  it('round-1 store, multi-feed: an old bare-guid item with a relative link fires nowhere after the upgrade', async () => {
    const a = '/q4/a.xml';
    const b = '/q4/b.xml';
    setFeed({ path: a, items: [{ guid: '42', link: 'posts/42' }] });
    setFeed({ path: b, items: [{ guid: '9', link: 'https://other.test/9' }] });
    const store = fakeFeeds.memoryStore();
    await store.put(cursorKeyFor({ path: a }), { publishedAt: null, seen: [hash({ identity: '42|posts/42' })] });
    await store.put(cursorKeyFor({ path: b }), { publishedAt: null, seen: [hash({ identity: '9|https://other.test' })] });
    expect(await multi.run(multiContext({ store, paths: [a, b] }))).toEqual([]);
    setFeed({ path: b, items: [{ guid: '42', link: server.url('/q4/posts/42') }, { guid: '9', link: 'https://other.test/9' }] });
    expect(await multi.run(multiContext({ store, paths: [a, b] }))).toEqual([]);
  });

  it('round-1 store, multi-feed: the same article listed by feed B in the first poll after the upgrade does not fire', async () => {
    const a = '/q5/a.xml';
    const b = '/q5/b.xml';
    setFeed({ path: a, items: [{ guid: '42', link: 'posts/42' }] });
    setFeed({ path: b, items: [{ guid: '42', link: server.url('/q5/posts/42') }, { guid: '9', link: 'https://other.test/9' }] });
    const store = fakeFeeds.memoryStore();
    await store.put(cursorKeyFor({ path: a }), { publishedAt: null, seen: [hash({ identity: '42|posts/42' })] });
    await store.put(cursorKeyFor({ path: b }), { publishedAt: null, seen: [hash({ identity: '9|https://other.test' })] });
    expect(await multi.run(multiContext({ store, paths: [a, b] }))).toEqual([]);
    expect(await multi.run(multiContext({ store, paths: [a, b] }))).toEqual([]);
  });
});

describe('Greptile P1 #3: a feed over the key cap replays a forgotten old item', () => {
  const OLD = 20_000;
  const oldItems = Array.from({ length: OLD }, (_, index) => ({ guid: `old-${index}` }));

  it('an old item forgotten at the cap does not fire when the feed moves it to the top', async () => {
    const path = '/cap/feed.xml';
    setFeed({ path, items: oldItems });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    setFeed({ path, items: [{ guid: 'new-1' }, ...oldItems] });
    expect(fakeFeeds.guids(await single.run(singleContext({ store, path })))).toEqual(['new-1']);
    const last = oldItems[OLD - 1];
    setFeed({ path, items: [last, { guid: 'new-1' }, ...oldItems.slice(0, OLD - 1)] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    const raw = store.data.get(cursorKeyFor({ path })) ?? '';
    expect(raw.length).toBeLessThan(512 * 1024);
  }, 60_000);

  it('over the cap: a dated item newer than the cursor still fires, an unseen undated one does not (trade-off)', async () => {
    const path = '/cap2/feed.xml';
    const base = [{ guid: 'dated-0', at: '2026-10-20T08:00:00Z' }, ...oldItems.slice(0, OLD - 1)];
    setFeed({ path, items: base });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    setFeed({ path, items: [{ guid: 'undated-new' }, ...base] });
    expect(fakeFeeds.guids(await single.run(singleContext({ store, path })))).toEqual(['undated-new']);
    setFeed({ path, items: [{ guid: 'dated-1', at: '2026-10-20T09:00:00Z' }, { guid: 'undated-2' }, { guid: 'undated-new' }, ...base] });
    expect(fakeFeeds.guids(await single.run(singleContext({ store, path })))).toEqual(['dated-1']);
  }, 60_000);

  it('over the cap: an item dated exactly at the cursor time that was forgotten does not fire', async () => {
    const path = '/cap4/feed.xml';
    const sameSecond = Array.from({ length: OLD + 1 }, (_, index) => ({ guid: `tie-${index}`, at: '2026-10-20T08:00:00Z' }));
    setFeed({ path, items: sameSecond });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({ path, items: [sameSecond[OLD], ...sameSecond.slice(0, OLD)] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
  }, 60_000);

  it('control: a feed back under the cap fires new undated items again', async () => {
    const path = '/cap3/feed.xml';
    setFeed({ path, items: oldItems });
    const store = fakeFeeds.memoryStore();
    await single.onEnable(singleContext({ store, path }));
    setFeed({ path, items: [{ guid: 'new-1' }, ...oldItems] });
    expect(fakeFeeds.guids(await single.run(singleContext({ store, path })))).toEqual(['new-1']);
    const trimmed = [{ guid: 'new-1' }, ...oldItems.slice(0, 100)];
    setFeed({ path, items: trimmed });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({ path, items: [{ guid: 'new-2' }, ...trimmed] });
    expect(fakeFeeds.guids(await single.run(singleContext({ store, path })))).toEqual(['new-2']);
  }, 60_000);
});

type FeedEntry = { guid?: string; link?: string; at?: string; title?: string };
