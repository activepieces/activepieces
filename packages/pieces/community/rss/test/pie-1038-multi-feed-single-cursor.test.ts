import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds } from './helpers/fake-feeds';

const trigger = fakeFeeds.asPolling(rssNewItemListTrigger);

type Entry = { title: string; guid: string; pubDate: string };
type FeedState = { entries: Entry[]; delayMs: number };

const feeds: Record<'a' | 'b', FeedState> = { a: { entries: [], delayMs: 0 }, b: { entries: [], delayMs: 0 } };
const storeData = new Map<string, string>();
let feedServer: Server;
let feedBase: string;

function feedXml({ host, name, entries }: { host: string; name: string; entries: Entry[] }): string {
  const items = entries
    .map(
      (e) => `<item>
  <title>${e.title}</title>
  <link>https://${host}/${e.guid}</link>
  <guid>https://${host}/${e.guid}</guid>
  <pubDate>${e.pubDate}</pubDate>
  <description>${e.title}</description>
</item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${name}</title><link>https://${host}/</link><description>${name}</description>
${items}
</channel></rss>`;
}

const store = {
  put: async <T>(key: string, value: T): Promise<T> => {
    storeData.set(key, JSON.stringify(value));
    return value;
  },
  get: async <T>(key: string): Promise<T | null> => {
    const raw = storeData.get(key);
    return raw === undefined ? null : JSON.parse(raw);
  },
  delete: async (key: string): Promise<void> => {
    storeData.delete(key);
  },
};

beforeAll(async () => {
  feedServer = createServer((req, res) => {
    const name = req.url === '/a.xml' ? 'a' : 'b';
    const feed = feeds[name];
    setTimeout(() => {
      res.setHeader('content-type', 'application/rss+xml; charset=utf-8');
      res.end(
        name === 'a'
          ? feedXml({ host: 'blog.example.com', name: 'Company Blog', entries: feed.entries })
          : feedXml({ host: 'status.example.com', name: 'Status Page', entries: feed.entries }),
      );
    }, feed.delayMs);
  });
  await new Promise<void>((r) => feedServer.listen(0, '127.0.0.1', () => r()));
  const address = feedServer.address();
  feedBase = `http://127.0.0.1:${typeof address === 'object' && address ? (address satisfies AddressInfo).port : 0}`;
});

afterAll(async () => {
  await new Promise<void>((r) => feedServer.close(() => r()));
});

beforeEach(() => {
  storeData.clear();
  feeds.a = {
    entries: [
      { title: 'Blog post 2', guid: 'post-2', pubDate: 'Thu, 01 Oct 2026 12:00:00 GMT' },
      { title: 'Blog post 1', guid: 'post-1', pubDate: 'Wed, 30 Sep 2026 12:00:00 GMT' },
    ],
    delayMs: 0,
  };
  feeds.b = {
    entries: [
      { title: 'Incident 2', guid: 'incident-2', pubDate: 'Tue, 29 Sep 2026 08:00:00 GMT' },
      { title: 'Incident 1', guid: 'incident-1', pubDate: 'Mon, 28 Sep 2026 08:00:00 GMT' },
    ],
    delayMs: 150,
  };
});

function context() {
  return fakeFeeds.triggerContext({
    trigger,
    propsValue: { rss_feed_urls: [`${feedBase}/a.xml`, `${feedBase}/b.xml`] },
    store,
  });
}

async function poll(): Promise<string[]> {
  return fakeFeeds.titles(await trigger.run(context()));
}

describe('PIE-1038 RSS "New Items in Multiple Feeds" with one shared checkpoint', () => {
  it('a new entry in the second feed starts a run', async () => {
    await trigger.onEnable(context());
    feeds.b.entries.unshift({ title: 'Incident 3', guid: 'incident-3', pubDate: 'Fri, 02 Oct 2026 08:00:00 GMT' });
    expect(await poll()).toEqual(['Incident 3']);
  });

  it('a poll where the second feed answers first does not re-run old entries', async () => {
    await trigger.onEnable(context());
    feeds.a.delayMs = 150;
    feeds.b.delayMs = 0;
    expect(await poll()).toEqual([]);
  });

  it('control: a new entry in the first feed starts a run', async () => {
    await trigger.onEnable(context());
    feeds.a.entries.unshift({ title: 'Blog post 3', guid: 'post-3', pubDate: 'Fri, 02 Oct 2026 12:00:00 GMT' });
    expect(await poll()).toEqual(['Blog post 3']);
  });
});
