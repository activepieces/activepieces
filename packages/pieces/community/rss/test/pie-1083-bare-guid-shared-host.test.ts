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

function context({ store, isRepublish }: { store: MemoryStore; isRepublish?: boolean }) {
  return fakeFeeds.triggerContext({
    trigger,
    propsValue: { rss_feed_urls: [server.url('/blog-a'), server.url('/blog-b')] },
    store,
    isRepublish,
  });
}

function asPreUpgradeCursors({ store }: { store: MemoryStore }): void {
  [...store.data.entries()]
    .filter(([key]) => key.startsWith('rss_feed_'))
    .forEach(([key, raw]) => {
      const parsed: unknown = JSON.parse(raw);
      expect(parsed).toHaveProperty('seen');
      store.data.set(key, JSON.stringify({ ...toRecord({ value: parsed }), cross: undefined }));
    });
}

function toRecord({ value }: { value: unknown }): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? { ...value } : {};
}

function links({ items }: { items: unknown[] }): string[] {
  return items.map((item) => {
    const link: unknown = Reflect.get(toRecord({ value: item }), 'link');
    return typeof link === 'string' ? link : '';
  });
}

const at = (time: string) => `2026-10-20T${time}:00Z`;

describe('PIE-1083: two feeds on one host with bare guids', () => {
  it('fires a new post in feed B whose bare guid equals an old guid of feed A on the same host', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: '42', at: at('08:00'), link: 'https://platform.test/blog-a/42' });
    publish({ feed: b, guid: '41', at: at('08:30'), link: 'https://platform.test/blog-b/41' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);

    publish({ feed: b, guid: '42', at: at('09:00'), link: 'https://platform.test/blog-b/42' });
    const fired = await trigger.run(context({ store }));
    expect(links({ items: fired })).toEqual(['https://platform.test/blog-b/42']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('control: the same article (same bare guid and same link) in both feeds still fires once (PIE-931)', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: 'seed-a', at: at('08:00'), link: 'https://platform.test/blog-a/seed' });
    publish({ feed: b, guid: 'seed-b', at: at('08:00'), link: 'https://platform.test/blog-b/seed' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: '7', at: at('09:00'), link: 'https://platform.test/post/7' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['7']);
    publish({ feed: b, guid: '7', at: at('09:00'), link: 'https://platform.test/post/7' });
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('upgrade: cursors stored before the cross keys existed fire nothing old, and a new B post with A\'s guid fires once', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: '42', at: at('08:00'), link: 'https://platform.test/blog-a/42' });
    publish({ feed: b, guid: '41', at: at('08:30'), link: 'https://platform.test/blog-b/41' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    asPreUpgradeCursors({ store });
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: b, guid: '42', at: at('09:00'), link: 'https://platform.test/blog-b/42' });
    expect(links({ items: await trigger.run(context({ store })) })).toEqual(['https://platform.test/blog-b/42']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('upgrade bridge: an article A already fired, still in A\'s window, does not fire again when it appears in B', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: 'seed-a', at: at('08:00'), link: 'https://platform.test/blog-a/seed' });
    publish({ feed: b, guid: 'seed-b', at: at('08:00'), link: 'https://platform.test/blog-b/seed' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: '7', at: at('09:00'), link: 'https://platform.test/post/7' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['7']);
    asPreUpgradeCursors({ store });
    publish({ feed: b, guid: '7', at: at('09:00'), link: 'https://platform.test/post/7' });
    expect(await trigger.run(context({ store }))).toEqual([]);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('the stored cross keys keep suppressing an article after it left A\'s window', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: 'seed-a', at: at('08:00'), link: 'https://platform.test/blog-a/seed' });
    publish({ feed: b, guid: 'seed-b', at: at('08:00'), link: 'https://platform.test/blog-b/seed' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: '7', at: at('09:00'), link: 'https://platform.test/post/7' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['7']);
    a.entries.forEach((entry) => {
      entry.deleted = entry.guid === '7';
    });
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: b, guid: '7', at: at('09:00'), link: 'https://platform.test/post/7' });
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('two different posts with the same bare guid in A and B in one poll both fire', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: 'seed-a', at: at('08:00'), link: 'https://platform.test/blog-a/seed' });
    publish({ feed: b, guid: 'seed-b', at: at('08:00'), link: 'https://platform.test/blog-b/seed' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: '5', at: at('09:00'), link: 'https://platform.test/blog-a/5' });
    publish({ feed: b, guid: '5', at: at('09:10'), link: 'https://platform.test/blog-b/5' });
    expect(links({ items: await trigger.run(context({ store })) })).toEqual([
      'https://platform.test/blog-b/5',
      'https://platform.test/blog-a/5',
    ]);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('a bare guid with no link in two feeds fires in both (no cross-feed match without a link)', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: 'seed-a', at: at('08:00'), link: 'https://platform.test/blog-a/seed' });
    publish({ feed: b, guid: 'seed-b', at: at('08:00'), link: 'https://platform.test/blog-b/seed' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    publish({ feed: a, guid: '9', at: at('09:00'), link: '' });
    publish({ feed: b, guid: '9', at: at('09:10'), link: '' });
    expect(guids(await trigger.run(context({ store })))).toEqual(['9', '9']);
    expect(await trigger.run(context({ store }))).toEqual([]);
  });

  it('test() shows both different posts that share a bare guid on one host', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: '5', at: at('09:00'), link: 'https://platform.test/blog-a/5' });
    publish({ feed: b, guid: '5', at: at('09:10'), link: 'https://platform.test/blog-b/5' });
    expect(links({ items: await trigger.test(context({ store: memoryStore() })) })).toEqual([
      'https://platform.test/blog-b/5',
      'https://platform.test/blog-a/5',
    ]);
  });

  it('lifecycle: fires once, then nothing across repeat polls, a republish and an off/on', async () => {
    const a = server.feed('/blog-a');
    const b = server.feed('/blog-b');
    publish({ feed: a, guid: '42', at: at('08:00'), link: 'https://platform.test/blog-a/42' });
    publish({ feed: b, guid: '41', at: at('08:30'), link: 'https://platform.test/blog-b/41' });
    const store = memoryStore();
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    publish({ feed: b, guid: '42', at: at('09:00'), link: 'https://platform.test/blog-b/42' });
    expect(links({ items: await trigger.run(context({ store })) })).toEqual(['https://platform.test/blog-b/42']);
    expect(await trigger.run(context({ store }))).toEqual([]);
    await trigger.onDisable(context({ store, isRepublish: true }));
    await trigger.onEnable(context({ store, isRepublish: true }));
    expect(await trigger.run(context({ store }))).toEqual([]);
    await trigger.onDisable(context({ store }));
    await trigger.onEnable(context({ store }));
    expect(await trigger.run(context({ store }))).toEqual([]);
  });
});
