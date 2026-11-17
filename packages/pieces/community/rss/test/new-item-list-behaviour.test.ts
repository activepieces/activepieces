import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds, FakeFeedServer, MemoryStore } from './helpers/fake-feeds';

const { publish, memoryStore, guids } = fakeFeeds;
const trigger = fakeFeeds.asPolling(rssNewItemListTrigger);
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

function context({ store, isRepublish, paths = ['/a', '/b'] }: { store: MemoryStore; isRepublish?: boolean; paths?: string[] }) {
  return fakeFeeds.triggerContext({
    trigger,
    propsValue: { rss_feed_urls: paths.map((path) => server.url(path)) },
    store,
    isRepublish,
  });
}

const at = (time: string) => `2026-10-20T${time}:00Z`;

function seedTwoFeeds() {
  const a = server.feed('/a');
  const b = server.feed('/b');
  publish({ feed: a, guid: 'a1', at: at('08:00') });
  publish({ feed: a, guid: 'a2', at: at('10:00') });
  publish({ feed: b, guid: 'b1', at: at('07:00') });
  publish({ feed: b, guid: 'b2', at: at('09:00') });
  return { a, b };
}

describe('New Items in Multiple Feeds behaviour', () => {
  it('fires once per new item in any feed across polls, a republish and an off/on', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: b, guid: 'b3', at: at('09:30') });
    publish({ feed: a, guid: 'a3', at: at('11:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['a3', 'b3']);
    expect(await trigger.run(context({ store }))).toEqual([]);

    publish({ feed: b, guid: 'between', at: at('11:30') });
    await trigger.onDisable(context({ store, isRepublish: true }));
    await trigger.onEnable(context({ store, isRepublish: true }));
    expect(guids(await trigger.run(context({ store })))).toEqual(['between']);
    expect(await trigger.run(context({ store }))).toEqual([]);

    await trigger.onDisable(context({ store }));
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('a new item older than another feed\'s newest still fires (cursor per feed)', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: 'a3', at: at('12:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['a3']);
    publish({ feed: b, guid: 'b3', at: at('09:30') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['b3']);
  });

  it('fires for items that share a timestamp across polls and across feeds', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: 'tie-a', at: at('12:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['tie-a']);
    publish({ feed: a, guid: 'tie-a2', at: at('12:00') });
    publish({ feed: b, guid: 'tie-b', at: at('12:00') });
    expect(guids(await trigger.run(context({ store }))).sort()).toEqual(['tie-a2', 'tie-b']);
  });

  it('one failing feed does not block the others and does not replay when it recovers', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    a.mode = 'error';
    publish({ feed: b, guid: 'b3', at: at('11:00') });
    publish({ feed: a, guid: 'a3', at: at('11:30') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['b3']);
    a.mode = 'ok';
    expect(guids(await trigger.run(context({ store })))).toEqual(['a3']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('throws when every feed fails, and recovers without replay', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    a.mode = 'error';
    b.mode = 'error';
    await expect(trigger.run(context({ store }))).rejects.toThrow(/None of the feeds could be loaded/);
    a.mode = 'ok';
    b.mode = 'ok';
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('a feed that is down at enable starts from the enable time instead of replaying', async () => {
    const { a } = seedTwoFeeds();
    a.mode = 'error';
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    a.mode = 'ok';
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: a, guid: 'a3', at: new Date().toISOString() });
    expect(guids(await trigger.run(context({ store })))).toEqual(['a3']);
  });

  it('a feed down at enable does not replay its undated items when it recovers', async () => {
    const { a } = seedTwoFeeds();
    const c = server.feed('/c');
    ['u0', 'u1', 'u2'].forEach((guid) => publish({ feed: c, guid, at: null }));
    publish({ feed: c, guid: 'c-old', at: at('06:00') });
    c.mode = 'error';
    const store = memoryStore();
    await trigger.onEnable(context({ store, paths: ['/a', '/c'] }));
    c.mode = 'ok';
    publish({ feed: c, guid: 'c-new', at: new Date().toISOString() });
    expect(guids(await trigger.run(context({ store, paths: ['/a', '/c'] })))).toEqual(['c-new']);
    expect(await trigger.run(context({ store, paths: ['/a', '/c'] }))).toEqual([]);
    publish({ feed: c, guid: 'u-new', at: null });
    publish({ feed: a, guid: 'a-new', at: at('12:00') });
    expect(guids(await trigger.run(context({ store, paths: ['/a', '/c'] })))).toEqual(['a-new', 'u-new']);
  });

  it('enable fails when no feed can be loaded', async () => {
    const { a, b } = seedTwoFeeds();
    a.mode = 'error';
    b.mode = 'error';
    await expect(trigger.onEnable(context({ store: memoryStore() }))).rejects.toThrow();
  });

  it('an article in two feeds fires once, even when one feed shows it a poll later', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    a.mode = 'error';
    publish({ feed: b, guid: 'shared', at: at('12:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['shared']);
    a.mode = 'ok';
    publish({ feed: a, guid: 'shared', at: at('12:00') });
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: a, guid: 'both', at: at('13:00') });
    publish({ feed: b, guid: 'both', at: at('13:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['both']);
  });

  it('the same bare guid in two unrelated feeds is two different articles', async () => {
    const a = server.feed('/a');
    const b = server.feed('/b');
    publish({ feed: a, guid: '42', at: at('08:00'), link: 'https://site-a.test/p/42' });
    publish({ feed: b, guid: '41', at: at('08:00'), link: 'https://site-b.test/p/41' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: b, guid: '42', at: at('09:00'), link: 'https://site-b.test/p/42' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['42']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('upgrading with only the old item id taken from one feed does not fire the other feed\'s existing items', async () => {
    const a = server.feed('/a');
    const b = server.feed('/b');
    publish({ feed: a, guid: 'a1', at: at('01:00') });
    publish({ feed: a, guid: 'a2', at: at('02:00') });
    publish({ feed: b, guid: 'b1', at: at('05:00') });
    publish({ feed: b, guid: 'b2', at: at('06:00') });
    const store = memoryStore();
    await store.put('lastItem', 'a2');
    await trigger.onEnable(context({ store, isRepublish: true }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: a, guid: 'a3', at: at('07:00') });
    publish({ feed: b, guid: 'b3', at: at('07:30') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['b3', 'a3']);
  });

  it('a feed added by a prop change does not fire its old items', async () => {
    seedTwoFeeds();
    const c = server.feed('/c');
    publish({ feed: c, guid: 'c1', at: at('06:00') });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    await trigger.onDisable(context({ store }));
    await trigger.onEnable(context({ store, paths: ['/a', '/b', '/c'] }));
    expect(await trigger.run(context({ store, paths: ['/a', '/b', '/c'] }))).toEqual([]);
    publish({ feed: c, guid: 'c2', at: at('07:00') });
    expect(guids(await trigger.run(context({ store, paths: ['/a', '/b', '/c'] })))).toEqual(['c2']);
  });

  it('upgrading from the old single cursor: no burst of old items and no gap', async () => {
    const { a, b } = seedTwoFeeds();
    const store = memoryStore();
    await store.put('lastItem', 'a2');
    await store.put('_lastRssPublishDate', Date.parse(at('10:00')) / 1000);
    publish({ feed: b, guid: 'b3', at: at('10:30') });
    await trigger.onEnable(context({ store, isRepublish: true }));
    publish({ feed: a, guid: 'a3', at: at('11:00') });
    expect(guids(await trigger.run(context({ store })))).toEqual(['a3', 'b3']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('keeps every store key and value inside the store limits', async () => {
    const { a } = seedTwoFeeds();
    Array.from({ length: 1500 }, (_, index) => index).forEach((index) =>
      publish({ feed: a, guid: `https://example.test/a-very-long-article-permalink-${index}`, at: at('05:00') }),
    );
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    await trigger.run(context({ store }));
    for (const [key, value] of store.data) {
      expect(key.length).toBeLessThanOrEqual(64);
      expect(value.length).toBeLessThan(64 * 1024);
    }
  });

  it('test() returns the newest items across feeds, without duplicates', async () => {
    const { a, b } = seedTwoFeeds();
    publish({ feed: a, guid: 'shared', at: at('12:00') });
    publish({ feed: b, guid: 'shared', at: at('12:00') });
    expect(guids(await trigger.test(context({ store: memoryStore() })))).toEqual(['shared', 'a2', 'b2', 'a1', 'b1']);
  });

  it('every sampleData key exists in a real run item', async () => {
    const { a } = seedTwoFeeds();
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: 'real', at: at('12:00') });
    const [real] = await trigger.run(context({ store }));
    expect(Object.keys(trigger.sampleData ?? {}).filter((key) => !(typeof real === 'object' && real !== null && key in real))).toEqual([]);
  });
});
