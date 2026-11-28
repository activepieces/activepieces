import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds, MemoryStore, RouteFeedServer } from './helpers/fake-feeds';

const single = fakeFeeds.asPolling(rssNewItemTrigger);
const multi = fakeFeeds.asPolling(rssNewItemListTrigger);
let server: RouteFeedServer;
let fetchCount = 0;

beforeAll(async () => {
  server = await fakeFeeds.startRouteServer();
});
afterAll(async () => {
  await server.stop();
});
afterEach(() => {
  vi.useRealTimers();
});

type Entry = { title: string; at?: string };

function rotating({ path, items }: { path: string; items: Entry[] }): void {
  fetchCount += 1;
  const body = items
    .map(
      (entry, index) =>
        `<item><title>${entry.title}</title>` +
        `<link>https://www.bing.com/news/apiclick.aspx?url=https%3a%2f%2fexample.com%2f${index}&amp;tid=${fetchCount}-${index}</link>` +
        (entry.at === undefined ? '' : `<pubDate>${new Date(entry.at).toUTCString()}</pubDate>`) +
        '</item>',
    )
    .join('');
  server.set(path, {
    body: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title><description>d</description>${body}</channel></rss>`,
  });
}

function contextFor({ kind, store, path }: { kind: string; store: MemoryStore; path: string }) {
  return kind === 'single'
    ? fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: server.url(path) }, store })
    : fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: [server.url(path)] }, store });
}

function titlesOf({ items }: { items: unknown[] }): string[] {
  return items.map((item) => String(Reflect.get(item as object, 'title')));
}

async function pollTitles({ kind, store, path, items, at }: { kind: string; store: MemoryStore; path: string; items: Entry[]; at: string }): Promise<string[]> {
  vi.setSystemTime(new Date(at));
  rotating({ path, items });
  const trigger = kind === 'single' ? single : multi;
  return titlesOf({ items: await trigger.run(contextFor({ kind, store, path })) });
}

describe.each([
  ['New Item In Feed', 'single'],
  ['New Items in Multiple Feeds', 'multi'],
])('%s: no-guid items whose links rotate on every fetch', (_name, kind) => {
  it('an item dated in the future fires once when it appears, and not again before or after its date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const path = `/rotating-future/${kind}/feed.xml`;
    const store = fakeFeeds.memoryStore();
    const old = { title: 'Old story', at: '2026-11-12T05:00:00Z' };
    vi.setSystemTime(new Date('2026-11-12T05:55:00Z'));
    rotating({ path, items: [old] });
    const trigger = kind === 'single' ? single : multi;
    await trigger.onEnable(contextFor({ kind, store, path }));

    const future = { title: 'Scheduled story', at: '2026-11-12T06:00:00Z' };
    const fired = [
      ...(await pollTitles({ kind, store, path, items: [future, old], at: '2026-11-12T05:57:00Z' })),
      ...(await pollTitles({ kind, store, path, items: [future, old], at: '2026-11-12T05:58:00Z' })),
      ...(await pollTitles({ kind, store, path, items: [future, old], at: '2026-11-12T05:59:00Z' })),
      ...(await pollTitles({ kind, store, path, items: [future, old], at: '2026-11-12T06:00:12Z' })),
      ...(await pollTitles({ kind, store, path, items: [future, old], at: '2026-11-12T06:01:00Z' })),
    ];
    expect(fired).toEqual(['Scheduled story']);

    const next = { title: 'Later story', at: '2026-11-12T06:01:30Z' };
    expect(await pollTitles({ kind, store, path, items: [next, future, old], at: '2026-11-12T06:02:00Z' })).toEqual(['Later story']);
    expect(await pollTitles({ kind, store, path, items: [next, future, old], at: '2026-11-12T06:03:00Z' })).toEqual([]);
  });

  it('an undated item fires once, not on every poll, and a new undated title still fires', async () => {
    const path = `/rotating-undated/${kind}/feed.xml`;
    const store = fakeFeeds.memoryStore();
    const trigger = kind === 'single' ? single : multi;
    rotating({ path, items: [{ title: 'Pinned notice' }] });
    await trigger.onEnable(contextFor({ kind, store, path }));
    for (let poll = 0; poll < 3; poll++) {
      rotating({ path, items: [{ title: 'Pinned notice' }] });
      expect(await trigger.run(contextFor({ kind, store, path }))).toEqual([]);
    }
    rotating({ path, items: [{ title: 'Fresh notice' }, { title: 'Pinned notice' }] });
    expect(titlesOf({ items: await trigger.run(contextFor({ kind, store, path })) })).toEqual(['Fresh notice']);
    for (let poll = 0; poll < 3; poll++) {
      rotating({ path, items: [{ title: 'Fresh notice' }, { title: 'Pinned notice' }] });
      expect(await trigger.run(contextFor({ kind, store, path }))).toEqual([]);
    }
  });
  it('undated items with stable links and a reused title each fire once', async () => {
    const path = `/stable-undated/${kind}/feed.xml`;
    const store = fakeFeeds.memoryStore();
    const trigger = kind === 'single' ? single : multi;
    const feed = (slugs: string[]): void => {
      const body = slugs.map((slug) => `<item><title>Daily</title><link>https://example.com/${slug}</link></item>`).join('');
      server.set(path, {
        body: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title><description>d</description>${body}</channel></rss>`,
      });
    };
    feed(['d0']);
    await trigger.onEnable(contextFor({ kind, store, path }));
    feed(['d2', 'd0']);
    expect((await trigger.run(contextFor({ kind, store, path }))).map((item) => Reflect.get(item as object, 'link'))).toEqual(['https://example.com/d2']);
    feed(['d4', 'd2', 'd0']);
    expect((await trigger.run(contextFor({ kind, store, path }))).map((item) => Reflect.get(item as object, 'link'))).toEqual(['https://example.com/d4']);
    feed(['d4', 'd2', 'd0']);
    expect(await trigger.run(contextFor({ kind, store, path }))).toEqual([]);
  });
});
