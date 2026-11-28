import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { rssFeedClient } from '../src/lib/common/feed-client';
import { fakeFeeds, MemoryStore, RouteFeedServer } from './helpers/fake-feeds';

const trigger = fakeFeeds.asPolling(rssNewItemTrigger);
let server: RouteFeedServer;

beforeAll(async () => {
  server = await fakeFeeds.startRouteServer();
});
afterAll(async () => {
  await server.stop();
});

function feed({ channelLink, items }: { channelLink: string | null; items: { guid: string; link: string; at: string }[] }): string {
  const body = items
    .map((i) => `<item><title>${i.guid}</title><link>${i.link}</link><guid isPermaLink="false">${i.guid}</guid><pubDate>${new Date(i.at).toUTCString()}</pubDate></item>`)
    .join('');
  const link = channelLink === null ? '' : `<link>${channelLink}</link>`;
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title>${link}<description>d</description>${body}</channel></rss>`;
}

function context({ store, path }: { store: MemoryStore; path: string }) {
  return fakeFeeds.triggerContext({ trigger, propsValue: { rss_feed_url: server.url(path) }, store });
}

describe('PIE-1084: relative item links when the feed has no channel link', () => {
  it('run() returns an absolute link resolved against the feed URL', async () => {
    const path = '/blog/feed.xml';
    server.set(path, { body: feed({ channelLink: null, items: [{ guid: 'seed', link: 'posts/0', at: '2026-10-20T08:00:00Z' }] }) });
    const store = fakeFeeds.memoryStore();
    await trigger.onEnable(context({ store, path }));
    server.set(path, {
      body: feed({
        channelLink: null,
        items: [
          { guid: 'new', link: 'posts/1', at: '2026-10-20T09:00:00Z' },
          { guid: 'seed', link: 'posts/0', at: '2026-10-20T08:00:00Z' },
        ],
      }),
    });
    const [item] = await trigger.run(context({ store, path }));
    expect(item).toHaveProperty('link', server.url('/blog/posts/1'));
  });

  it('test() returns the same absolute link, matching the Read Feed action', async () => {
    const path = '/blog2/feed.xml';
    server.set(path, { body: feed({ channelLink: null, items: [{ guid: 'only', link: 'posts/9', at: '2026-10-20T08:00:00Z' }] }) });
    const [sampleItem] = await trigger.test(context({ store: fakeFeeds.memoryStore(), path }));
    const action = await rssFeedClient.fetchFeed({ url: server.url(path) });
    expect(action.items[0].link).toBe(server.url('/blog2/posts/9'));
    expect(sampleItem).toHaveProperty('link', action.items[0].link);
  });

  it('control: with a channel link, relative links keep resolving against the channel link (no change)', async () => {
    const path = '/blog3/feed.xml';
    server.set(path, { body: feed({ channelLink: 'https://site.test/root/', items: [{ guid: 'c', link: 'posts/2', at: '2026-10-20T08:00:00Z' }] }) });
    const [sampleItem] = await trigger.test(context({ store: fakeFeeds.memoryStore(), path }));
    expect(sampleItem).toHaveProperty('link', 'https://site.test/root/posts/2');
  });

  it('key stability: an item stored before the fix (bare guid, relative link) does not fire again', async () => {
    const path = '/blog4/feed.xml';
    const seed = { guid: '42', link: 'posts/42', at: '2026-10-20T08:00:00Z' };
    server.set(path, { body: feed({ channelLink: null, items: [seed] }) });
    const store = fakeFeeds.memoryStore();
    await trigger.onEnable(context({ store, path }));
    expect(await trigger.run(context({ store, path }))).toEqual([]);
    server.set(path, {
      body: feed({ channelLink: null, items: [{ guid: '43', link: 'posts/43', at: '2026-10-20T09:00:00Z' }, seed] }),
    });
    const fired = await trigger.run(context({ store, path }));
    expect(fired.map((item) => Reflect.get(Object(item), 'link'))).toEqual([server.url('/blog4/posts/43')]);
    expect(await trigger.run(context({ store, path }))).toEqual([]);
  });

  it('key: a bare guid with a relative link is scoped by the origin of the feed URL, so query edits keep the key', async () => {
    const path = '/blog5/feed.xml';
    server.set(path, { body: feed({ channelLink: null, items: [{ guid: '42', link: 'posts/42', at: '2026-10-20T08:00:00Z' }] }) });
    const store = fakeFeeds.memoryStore();
    await trigger.onEnable(context({ store, path }));
    const cursor = [...store.data.entries()].find(([key]) => key.startsWith('rss_feed_'));
    expect(cursor).toBeDefined();
    const expected = createHash('sha256').update(`42|${new URL(server.url(path)).origin}`).digest('hex').slice(0, 16);
    const stored: unknown = JSON.parse(cursor?.[1] ?? '{}');
    expect(stored).toHaveProperty('seen', expect.arrayContaining([expected]));
  });
});
