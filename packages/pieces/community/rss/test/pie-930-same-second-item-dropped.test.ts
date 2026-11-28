import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { fakeFeeds, MemoryStore, RawFeedServer } from './helpers/fake-feeds';

const single = fakeFeeds.asPolling(rssNewItemTrigger);
const multi = fakeFeeds.asPolling(rssNewItemListTrigger);
const { guids, memoryStore } = fakeFeeds;
const feeds: Record<string, Feed> = {};
let server: RawFeedServer;

beforeAll(async () => {
  server = await fakeFeeds.startServer((req, res) => {
    const feed = feeds[req.url ?? ''];
    if (!feed) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    setTimeout(() => {
      res.setHeader('content-type', 'application/rss+xml');
      res.end(renderRss({ items: feed.items }));
    }, feed.delayMs);
  });
});
afterAll(async () => {
  await server.stop();
});

const triggers: Record<string, TriggerUnderTest> = {
  'New Item In Feed': {
    onEnable: ({ store, url }) => single.onEnable(singleCtx({ store, url })),
    run: ({ store, url }) => single.run(singleCtx({ store, url })),
  },
  'New Items in Multiple Feeds': {
    onEnable: ({ store, url }) => multi.onEnable(multiCtx({ store, urls: [url] })),
    run: ({ store, url }) => multi.run(multiCtx({ store, urls: [url] })),
  },
};

describe('C0103 RSS publish-date filter drops newly detected items', () => {
  for (const [name, trigger] of Object.entries(triggers)) {
    it(`${name}: delivers a second article that carries the same publish second`, async () => {
      const path = `/same-second-${name.length}`;
      feeds[path] = { delayMs: 0, items: [{ guid: 'x1', date: '2026-10-20T10:00:00Z' }] };
      const url = `${server.base}${path}`;
      const store = memoryStore();
      await trigger.onEnable({ store, url });

      feeds[path].items.unshift({ guid: 'x2', date: '2026-10-20T10:15:00Z' });
      const poll1 = guids(await trigger.run({ store, url }));

      feeds[path].items.unshift({ guid: 'x3', date: '2026-10-20T10:15:00Z' });
      const poll2 = guids(await trigger.run({ store, url }));
      const poll3 = guids(await trigger.run({ store, url }));

      expect(poll1).toEqual(['x2']);
      expect([...poll2, ...poll3]).toEqual(['x3']);
    });
  }

  it('New Item In Feed: does not re-deliver an old article that moved to the top of the feed', async () => {
    feeds['/moved'] = { delayMs: 0, items: [{ guid: 'y1', date: '2026-10-20T10:00:00Z' }] };
    const url = `${server.base}/moved`;
    const store = memoryStore();
    const trigger = triggers['New Item In Feed'];
    await trigger.onEnable({ store, url });
    feeds['/moved'].items.unshift({ guid: 'y2', date: '2026-10-20T10:15:00Z' });
    expect(guids(await trigger.run({ store, url }))).toEqual(['y2']);

    feeds['/moved'].items = [
      { guid: 'y1', date: '2026-10-20T10:00:00Z' },
      { guid: 'y2', date: '2026-10-20T10:15:00Z' },
    ];
    expect(guids(await trigger.run({ store, url }))).toEqual([]);
  });
});

function singleCtx({ store, url }: { store: MemoryStore; url: string }) {
  return fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: url }, store });
}

function multiCtx({ store, urls }: { store: MemoryStore; urls: string[] }) {
  return fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: urls }, store });
}

function renderRss({ items }: { items: FeedItem[] }): string {
  const body = items
    .map(
      (i) =>
        `<item><title>${i.guid}</title><link>http://example.test/${i.guid}</link>` +
        `<guid isPermaLink="false">${i.guid}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate></item>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>feed</title>` +
    `<link>http://example.test/</link><description>d</description>${body}</channel></rss>`;
}

type FeedItem = { guid: string; date: string };
type Feed = { items: FeedItem[]; delayMs: number };
type TriggerUnderTest = {
  onEnable: (params: { store: MemoryStore; url: string }) => Promise<unknown>;
  run: (params: { store: MemoryStore; url: string }) => Promise<unknown[]>;
};
