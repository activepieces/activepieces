import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { fakeFeeds, FakeFeedServer, MemoryStore } from './helpers/fake-feeds';

const { publish, memoryStore, guids } = fakeFeeds;
const trigger = fakeFeeds.asPolling(rssNewItemTrigger);
let server: FakeFeedServer;

beforeAll(async () => {
  server = await fakeFeeds.start();
});
afterAll(async () => {
  await server.stop();
});
beforeEach(() => {
  server.reset();
});

function context({ store, isRepublish, path = '/feed' }: { store: MemoryStore; isRepublish?: boolean; path?: string }) {
  return fakeFeeds.triggerContext({ trigger, propsValue: { rss_feed_url: server.url(path) }, store, isRepublish });
}

const at = (time: string) => `2026-10-20T${time}:00Z`;

describe('New Item in Feed behaviour', () => {
  it('fires once per new item across polls, a republish and an off/on, never for items present at enable', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'old-1', at: at('08:00') });
    publish({ feed, guid: 'old-2', at: at('09:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 'new-1', at: at('10:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['new-1']);
    expect(await trigger.run(context({ store }))).toEqual([]);

    publish({ feed, guid: 'between', at: at('10:30') });
    await trigger.onDisable(context({ store, isRepublish: true }));
    await trigger.onEnable(context({ store, isRepublish: true }));
    expect(guids(await trigger.run(context({ store })))).toEqual(['between']);
    expect(await trigger.run(context({ store }))).toEqual([]);

    await trigger.onDisable(context({ store }));
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 'new-2', at: at('11:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['new-2']);
  });

  it('does not re-fire an old item whose publish date is bumped', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'old-1', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    feed.entries[0].publishedAt = at('12:00');
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('fires for items that share the timestamp of the last delivered one', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'seed', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed, guid: 'tie-a', at: at('09:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['tie-a']);
    publish({ feed, guid: 'tie-b', at: at('09:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['tie-b']);
  });

  it('an entry listed twice in one feed fires once', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'a', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed, guid: 'dup', at: at('09:00') });
    publish({ feed, guid: 'dup', at: at('09:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['dup']);
  });

  it('keeps working when the last-seen item is deleted', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'a', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed, guid: 'b', at: at('09:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['b']);
    feed.entries[0].deleted = true;
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 'c', at: at('10:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['c']);
  });

  it('handles feeds that list entries oldest first', async () => {
    const feed = server.feed('/feed');
    feed.order = 'oldest-first';
    publish({ feed, guid: 'p1', at: at('08:00') });
    publish({ feed, guid: 'p2', at: at('09:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed, guid: 'p3', at: at('10:00') });
    publish({ feed, guid: 'p4', at: at('11:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['p4', 'p3']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('a failing poll throws, keeps the cursor, and the feed recovers without replay', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'a', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    feed.mode = 'error';
    await expect(trigger.run(context({ store }))).rejects.toThrow(/HTTP 500/);
    publish({ feed, guid: 'b', at: at('09:00') });
    feed.mode = 'ok';
    expect(guids(await trigger.run(context({ store })))).toEqual(['b']);
  });

  it('a future-dated item fires once and does not stall later items', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'a', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed, guid: 'future', at: '2099-01-01T00:00:00Z' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['future']);
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 'b', at: new Date().toISOString() });
    expect(guids(await trigger.run(context({ store })))).toEqual(['b']);
  });

  it('a changed feed URL starts from that feed without firing its old items', async () => {
    const first = server.feed('/feed');
    publish({ feed: first, guid: 'a', at: at('08:00') });
    const second = server.feed('/other');
    publish({ feed: second, guid: 'x1', at: at('07:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    await trigger.onDisable(context({ store }));
    await trigger.onEnable(context({ store, path: '/other' }));
    expect(await trigger.run(context({ store, path: '/other' }))).toEqual([]);
    publish({ feed: second, guid: 'x2', at: at('09:00') });
    expect(guids(await trigger.run(context({ store, path: '/other' })))).toEqual(['x2']);
  });

  it('a feed of 1200 undated items fires nothing after enable, and a new item fires once', async () => {
    const feed = server.feed('/feed');
    Array.from({ length: 1200 }, (_, index) => index).forEach((index) => publish({ feed, guid: `u${index}`, at: null }));
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 'u-new', at: null });
    expect(guids(await trigger.run(context({ store })))).toEqual(['u-new']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('a feed of 1200 items sharing one date fires nothing after enable, and a new item fires once', async () => {
    const feed = server.feed('/feed');
    Array.from({ length: 1200 }, (_, index) => index).forEach((index) => publish({ feed, guid: `s${index}`, at: at('08:00') }));
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 's-new', at: at('08:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['s-new']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('keeps relative item links and feed meta exactly as the feed parser returned them before', async () => {
    const feed = server.feed('/blog/feed.xml');
    publish({ feed, guid: 'seed', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store, path: '/blog/feed.xml' }));
    publish({ feed, guid: 'rel', at: at('09:00'), link: 'posts/1' });
    const [item] = await trigger.run(context({ store, path: '/blog/feed.xml' }));
    expect(item).toMatchObject({ link: 'https://example.test/posts/1', meta: { xmlurl: null } });
  });

  it('upgrading from the old single cursor fires only what arrived after the last delivery', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'p1', at: at('08:00') });
    publish({ feed, guid: 'p2', at: at('09:00') });
    publish({ feed, guid: 'p3', at: at('10:00') });
    const store = memoryStore();
    await store.put('lastItem', 'p2');
    await store.put('_lastRssPublishDate', Date.parse(at('09:00')) / 1000);
    await trigger.onEnable(context({ store, isRepublish: true }));
    expect(guids(await trigger.run(context({ store })))).toEqual(['p3']);
    expect(await trigger.run(context({ store }))).toEqual([]);
    expect(store.data.has('lastItem')).toBe(false);
    expect(store.data.has('_lastRssPublishDate')).toBe(false);
  });

  it('upgrading with only the old item id uses that item as the mark', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'p1', at: at('08:00') });
    publish({ feed, guid: 'p2', at: at('09:00') });
    publish({ feed, guid: 'p3', at: at('10:00') });
    const store = memoryStore();
    await store.put('lastItem', 'p2');
    expect(guids(await trigger.run(context({ store })))).toEqual(['p3']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('upgrading with only the old item id on an oldest-first feed does not burst', async () => {
    const feed = server.feed('/feed');
    feed.order = 'oldest-first';
    ['p1', 'p2', 'p3', 'p4', 'p5'].forEach((guid, index) => publish({ feed, guid, at: at(`0${index + 1}:00`) }));
    const store = memoryStore();
    await store.put('lastItem', 'p1');
    await trigger.onEnable(context({ store, isRepublish: true }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed, guid: 'p6', at: at('06:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['p6']);
  });

  it('editing the link slug of undated bare-guid items does not re-fire them', async () => {
    const feed = server.feed('/feed');
    ['u1', 'u2', 'u3'].forEach((guid) => publish({ feed, guid, at: null, link: `https://site.test/${guid}` }));
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    feed.entries.forEach((entry) => {
      entry.link = `${entry.link}-edited`;
    });
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('a bare-guid feed that rotates a tracking parameter on every fetch fires nothing after enable', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'n1', at: at('08:00'), link: 'https://site.test/n1?t=0' });
    publish({ feed, guid: 'n2', at: at('09:00'), link: 'https://site.test/n2?t=0' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    for (const round of [1, 2, 3]) {
      feed.entries.forEach((entry) => {
        entry.link = entry.link.replace(/t=\d+/, `t=${round}`);
      });
      expect(await trigger.run(context({ store }))).toEqual([]);
    }
    publish({ feed, guid: 'n3', at: at('10:00'), link: 'https://site.test/n3?t=9' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['n3']);
  });

  it('test() returns the newest real items first, at most five', async () => {
    const feed = server.feed('/feed');
    feed.order = 'oldest-first';
    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((guid, index) => publish({ feed, guid, at: at(`0${index + 1}:00`) }));
    const sample = guids(await trigger.test(context({ store: memoryStore() })));
    expect(sample).toEqual(['f', 'e', 'd', 'c', 'b']);
  });

  it('every sampleData key exists in a real run item', async () => {
    const feed = server.feed('/feed');
    publish({ feed, guid: 'seed', at: at('08:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed, guid: 'real', at: at('09:00') });
    const [real] = await trigger.run(context({ store }));
    expect(Object.keys(trigger.sampleData ?? {}).filter((key) => !(typeof real === 'object' && real !== null && key in real))).toEqual([]);
  });
});
