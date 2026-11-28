import * as http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds } from './helpers/fake-feeds';

const trigger = fakeFeeds.asPolling(rssNewItemListTrigger);

let feedServer: http.Server;
let feedBase: string;
const feeds = new Map<string, { body: string; delayMs: number }>();

beforeAll(async () => {
  feedServer = http.createServer((req, res) => {
    const feed = feeds.get(req.url ?? '');
    if (feed === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }
    setTimeout(() => {
      res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8' });
      res.end(feed.body);
    }, feed.delayMs);
  });
  await new Promise<void>((r) => feedServer.listen(0, '127.0.0.1', () => r()));
  const address = feedServer.address();
  feedBase = `http://127.0.0.1:${typeof address === 'object' && address ? (address satisfies AddressInfo).port : 0}`;
});

afterAll(async () => {
  feedServer.closeAllConnections();
  await new Promise<void>((r) => feedServer.close(() => r()));
});

const DATES: Record<string, string> = {
  a1: 'Mon, 19 Oct 2026 10:00:00 GMT',
  b1: 'Mon, 19 Oct 2026 10:30:00 GMT',
  a2: 'Mon, 19 Oct 2026 11:00:00 GMT',
  x: 'Mon, 19 Oct 2026 12:00:00 GMT',
};

function rss({ title, guids }: { title: string; guids: string[] }): string {
  const items = guids
    .map(
      (g) =>
        `<item><title>${g}</title><link>https://news.example.com/${g}</link><guid isPermaLink="false">${g}</guid><pubDate>${DATES[g]}</pubDate></item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${title}</title><link>https://news.example.com</link><description>d</description>
${items}
</channel></rss>`;
}

function memoryStore() {
  const data = new Map<string, string>();
  return {
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

const { guids } = fakeFeeds;
const SLOW = 400;

async function sharedArticle({ name, mainSlowOnSecondPoll }: { name: string; mainSlowOnSecondPoll: boolean }): Promise<string[]> {
  const main = `/${name}/main.xml`;
  const cat = `/${name}/category.xml`;
  const ctx = fakeFeeds.triggerContext({ trigger, propsValue: { rss_feed_urls: [feedBase + main, feedBase + cat] }, store: memoryStore() });
  feeds.set(main, { body: rss({ title: 'Main', guids: ['a1'] }), delayMs: 0 });
  feeds.set(cat, { body: rss({ title: 'Category', guids: ['b1'] }), delayMs: SLOW });
  await trigger.onEnable(ctx);

  const emitted: string[] = [];
  feeds.set(main, { body: rss({ title: 'Main', guids: ['a2', 'a1'] }), delayMs: 0 });
  emitted.push(...guids(await trigger.run(ctx)));

  feeds.set(main, { body: rss({ title: 'Main', guids: ['x', 'a2', 'a1'] }), delayMs: mainSlowOnSecondPoll ? SLOW : 0 });
  feeds.set(cat, { body: rss({ title: 'Category', guids: ['x', 'b1'] }), delayMs: mainSlowOnSecondPoll ? 0 : SLOW });
  emitted.push(...guids(await trigger.run(ctx)));
  emitted.push(...guids(await trigger.run(ctx)));
  return emitted;
}

describe('PIE-931 New Items in Multiple Feeds with one article in two feeds', () => {
  it('control: the same URL listed twice delivers a new entry once', async () => {
    const path = '/dup/feed.xml';
    const ctx = fakeFeeds.triggerContext({ trigger, propsValue: { rss_feed_urls: [feedBase + path, feedBase + path] }, store: memoryStore() });
    feeds.set(path, { body: rss({ title: 'Main', guids: ['a1'] }), delayMs: 0 });
    await trigger.onEnable(ctx);
    feeds.set(path, { body: rss({ title: 'Main', guids: ['a2', 'a1'] }), delayMs: 0 });
    const emitted = guids(await trigger.run(ctx));
    emitted.push(...guids(await trigger.run(ctx)));
    expect(emitted).toEqual(['a2']);
  });

  it('control: shared article delivered once when the main feed answers first', async () => {
    expect(await sharedArticle({ name: 'main-first', mainSlowOnSecondPoll: false })).toEqual(['a2', 'x']);
  });

  it('shared article delivered once when the category feed answers first', async () => {
    expect(await sharedArticle({ name: 'category-first', mainSlowOnSecondPoll: true })).toEqual(['a2', 'x']);
  });
});
