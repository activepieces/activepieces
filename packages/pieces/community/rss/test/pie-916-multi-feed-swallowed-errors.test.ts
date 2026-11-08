import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds, MemoryStore, RawFeedServer } from './helpers/fake-feeds';

const trigger = fakeFeeds.asPolling(rssNewItemListTrigger);
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
      if (feed.status && feed.status !== 200) {
        res.statusCode = feed.status;
        res.end('upstream error');
        return;
      }
      res.setHeader('content-type', 'application/rss+xml');
      res.end(renderRss({ items: feed.items }));
    }, feed.delayMs);
  });
});
afterAll(async () => {
  await server.stop();
});

describe('C0135 multi-feed RSS: per-feed errors are swallowed', () => {
  it('does not re-deliver old items when the feed holding the cursor is briefly down', async () => {
    feeds['/a'] = {
      delayMs: 0,
      items: [
        { guid: 'a2', date: '2026-10-20T09:00:00Z' },
        { guid: 'a1', date: '2026-10-20T08:00:00Z' },
      ],
    };
    feeds['/b'] = {
      delayMs: 400,
      items: [
        { guid: 'b2', date: '2026-10-20T07:00:00Z' },
        { guid: 'b1', date: '2026-10-20T06:00:00Z' },
      ],
    };
    const store = memoryStore();
    const urls = [`${server.base}/a`, `${server.base}/b`];
    await trigger.onEnable(ctx({ store, urls }));

    feeds['/a'].status = 500;
    const duringOutage = guids(await trigger.run(ctx({ store, urls })).catch(() => []));
    feeds['/a'].status = 200;
    const afterRecovery = guids(await trigger.run(ctx({ store, urls })).catch(() => []));

    expect([...duringOutage, ...afterRecovery]).toEqual([]);
  });

  it('does not report a poll as successful when every configured feed fails', async () => {
    feeds['/a-ok'] = { delayMs: 0, items: [{ guid: 'x1', date: '2026-10-20T09:00:00Z' }] };
    const store = memoryStore();
    await trigger.onEnable(ctx({ store, urls: [`${server.base}/a-ok`] }));

    feeds['/a-ok'].status = 500;
    await expect(trigger.run(ctx({ store, urls: [`${server.base}/a-ok`] }))).rejects.toThrow();
  });
});

function ctx({ store, urls }: { store: MemoryStore; urls: string[] }) {
  return fakeFeeds.triggerContext({ trigger, propsValue: { rss_feed_urls: urls }, store });
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
type Feed = { items: FeedItem[]; delayMs: number; status?: number };
