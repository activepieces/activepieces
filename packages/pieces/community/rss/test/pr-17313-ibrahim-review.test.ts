import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds, MemoryStore, RouteFeedServer } from './helpers/fake-feeds';

const single = fakeFeeds.asPolling(rssNewItemTrigger);
const multi = fakeFeeds.asPolling(rssNewItemListTrigger);
let server: RouteFeedServer;

beforeAll(async () => {
  server = await fakeFeeds.startRouteServer();
});
afterAll(async () => {
  await server.stop();
});

type Entry = { title: string; link?: string; at?: string };

function rss({ items }: { items: Entry[] }): string {
  const body = items
    .map(
      (entry) =>
        `<item><title>${entry.title}</title>` +
        (entry.link === undefined ? '' : `<link>${entry.link.replace(/&/g, '&amp;')}</link>`) +
        (entry.at === undefined ? '' : `<pubDate>${new Date(entry.at).toUTCString()}</pubDate>`) +
        '</item>',
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>t</title><description>d</description>${body}</channel></rss>`;
}

function setFeed({ path, items }: { path: string; items: Entry[] }): void {
  server.set(path, { body: rss({ items }) });
}

function singleContext({ store, path, isRepublish }: { store: MemoryStore; path: string; isRepublish?: boolean }) {
  return fakeFeeds.triggerContext({ trigger: single, propsValue: { rss_feed_url: server.url(path) }, store, isRepublish });
}

function multiContext({ store, paths }: { store: MemoryStore; paths: string[] }) {
  return fakeFeeds.triggerContext({ trigger: multi, propsValue: { rss_feed_urls: paths.map((p) => server.url(p)) }, store });
}

function titlesOf({ items }: { items: unknown[] }): string[] {
  return items.map((item) => String(Reflect.get(item as object, 'title')));
}

let fetchCount = 0;
function bingLike({ path, items }: { path: string; items: { title: string; at: string }[] }): void {
  fetchCount += 1;
  setFeed({
    path,
    items: items.map((entry, index) => ({
      ...entry,
      link: `https://www.bing.com/news/apiclick.aspx?url=https%3a%2f%2fexample.com%2f${index}&tid=${fetchCount}-${index}`,
    })),
  });
}

describe('Review item 1: a no-guid feed whose links rotate on every fetch (Bing News)', () => {
  const newest = { title: 'Automation news', at: '2026-11-09T08:00:00Z' };
  const older = { title: 'Older news', at: '2026-11-09T07:00:00Z' };

  it.each([
    ['New Item In Feed', 'single'],
    ['New Items in Multiple Feeds', 'multi'],
  ])('%s: the newest article fires once, not on every poll', async (_name, kind) => {
    const path = `/review1/${kind}/feed.xml`;
    const store = fakeFeeds.memoryStore();
    const run = () =>
      kind === 'single' ? single.run(singleContext({ store, path })) : multi.run(multiContext({ store, paths: [path] }));
    bingLike({ path, items: [newest, older] });
    await (kind === 'single' ? single.onEnable(singleContext({ store, path })) : multi.onEnable(multiContext({ store, paths: [path] })));
    for (let poll = 0; poll < 3; poll++) {
      bingLike({ path, items: [newest, older] });
      expect(await run()).toEqual([]);
    }
    const next = { title: 'Brand new article', at: '2026-11-09T09:00:00Z' };
    bingLike({ path, items: [next, newest, older] });
    expect(titlesOf({ items: await run() })).toEqual(['Brand new article']);
    for (let poll = 0; poll < 3; poll++) {
      bingLike({ path, items: [next, newest, older] });
      expect(await run()).toEqual([]);
    }
  });

  it('PIE-930 stays fixed: a different title in the same second as the cursor still fires', async () => {
    const path = '/review1/same-second/feed.xml';
    const store = fakeFeeds.memoryStore();
    bingLike({ path, items: [newest] });
    await single.onEnable(singleContext({ store, path }));
    bingLike({ path, items: [{ title: 'Second story', at: newest.at }, newest] });
    expect(titlesOf({ items: await single.run(singleContext({ store, path })) })).toEqual(['Second story']);
    bingLike({ path, items: [{ title: 'Second story', at: newest.at }, newest] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
  });
});

describe('Review item 2: onDisable keeps the cursors (older servers call it on every republish)', () => {
  it('a post published between the last poll and a republish without isRepublish still fires', async () => {
    const path = '/review2/feed.xml';
    const store = fakeFeeds.memoryStore();
    setFeed({ path, items: [{ title: 'A', link: 'https://x.test/a', at: '2026-11-09T08:00:00Z' }] });
    await single.onEnable(singleContext({ store, path }));
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({
      path,
      items: [
        { title: 'B', link: 'https://x.test/b', at: '2026-11-09T09:00:00Z' },
        { title: 'A', link: 'https://x.test/a', at: '2026-11-09T08:00:00Z' },
      ],
    });
    await single.onDisable(singleContext({ store, path }));
    await single.onEnable(singleContext({ store, path, isRepublish: true }));
    expect(titlesOf({ items: await single.run(singleContext({ store, path })) })).toEqual(['B']);
  });

  it('turning the flow off and on still starts from the current items', async () => {
    const path = '/review2/offon.xml';
    const store = fakeFeeds.memoryStore();
    setFeed({ path, items: [{ title: 'A', link: 'https://x.test/a', at: '2026-11-09T08:00:00Z' }] });
    await single.onEnable(singleContext({ store, path }));
    setFeed({
      path,
      items: [
        { title: 'B', link: 'https://x.test/b', at: '2026-11-09T09:00:00Z' },
        { title: 'A', link: 'https://x.test/a', at: '2026-11-09T08:00:00Z' },
      ],
    });
    await single.onDisable(singleContext({ store, path }));
    await single.onEnable(singleContext({ store, path, isRepublish: false }));
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
  });
});

describe('Review item 3: one valid but empty response keeps the cursor', () => {
  it('1,500 undated items do not fire again after one empty fetch', async () => {
    const path = '/review3/feed.xml';
    const store = fakeFeeds.memoryStore();
    const items = Array.from({ length: 1500 }, (_, i) => ({ title: `item ${i}`, link: `https://x.test/${i}` }));
    setFeed({ path, items });
    await single.onEnable(singleContext({ store, path }));
    setFeed({ path, items: [] });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
    setFeed({ path, items });
    expect(await single.run(singleContext({ store, path }))).toEqual([]);
  });
});
