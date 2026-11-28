import * as http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds } from './helpers/fake-feeds';

const trigger = fakeFeeds.asPolling(rssNewItemListTrigger);

const TRIGGER_TIMEOUT_MS = 60_000;

let feedServer: http.Server;
let feedBase: string;
const feeds = new Map<string, string>();

beforeAll(async () => {
  feedServer = http.createServer((req, res) => {
    const body = feeds.get(req.url ?? '');
    if (body === 'hang') {
      return;
    }
    if (body === undefined || body === 'error') {
      res.writeHead(503);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8' });
    res.end(body);
  });
  await new Promise<void>((r) => feedServer.listen(0, '127.0.0.1', () => r()));
  const address = feedServer.address();
  feedBase = `http://127.0.0.1:${typeof address === 'object' && address ? (address satisfies AddressInfo).port : 0}`;
});

afterAll(async () => {
  feedServer.closeAllConnections();
  await new Promise<void>((r) => feedServer.close(() => r()));
});

function rss({ site, guids }: { site: string; guids: string[] }): string {
  const items = guids
    .map(
      (g, i) =>
        `<item><title>${g}</title><link>https://${site}/${g}</link><guid>${g}</guid><pubDate>Mon, 19 Oct 2026 ${String(10 + guids.length - i).padStart(2, '0')}:00:00 GMT</pubDate></item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${site}</title><link>https://${site}</link><description>d</description>
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

const TIMED_OUT = 'killed at TRIGGER_TIMEOUT_SECONDS';

async function runWithinTriggerDeadline(ctx: ListContext): Promise<string[] | string> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<string>((r) => {
    timer = setTimeout(() => r(TIMED_OUT), TRIGGER_TIMEOUT_MS);
  });
  try {
    const out = await Promise.race([trigger.run(ctx), deadline]);
    return typeof out === 'string' ? out : fakeFeeds.guids(out);
  } finally {
    clearTimeout(timer);
  }
}

async function scenario({ name, otherFeedState }: { name: string; otherFeedState: 'error' | 'hang' }): Promise<string[] | string> {
  const healthy = `/${name}-healthy.xml`;
  const other = `/${name}-other.xml`;
  const ctx = fakeFeeds.triggerContext({
    trigger,
    propsValue: { rss_feed_urls: [feedBase + healthy, feedBase + other] },
    store: memoryStore(),
  });
  feeds.set(healthy, rss({ site: 'healthy.example.com', guids: ['h1'] }));
  feeds.set(other, rss({ site: 'other.example.com', guids: ['o1'] }));
  await trigger.onEnable(ctx);
  feeds.set(healthy, rss({ site: 'healthy.example.com', guids: ['h2', 'h1'] }));
  feeds.set(other, otherFeedState);
  return runWithinTriggerDeadline(ctx);
}

describe('PIE-936 New Items in Multiple Feeds with one unresponsive feed host', () => {
  it('control: a feed that answers HTTP 503 does not stop the healthy feed from delivering', async () => {
    expect(await scenario({ name: 'control', otherFeedState: 'error' })).toEqual(['h2']);
  }, 3 * TRIGGER_TIMEOUT_MS);

  it('a feed host that does not answer does not stop the healthy feed from delivering within the trigger deadline', async () => {
    expect(await scenario({ name: 'hang', otherFeedState: 'hang' })).toEqual(['h2']);
  }, 3 * TRIGGER_TIMEOUT_MS);
});

type ListContext = ReturnType<typeof fakeFeeds.triggerContext<typeof trigger.props>>;
