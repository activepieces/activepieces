import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, createMockPollingTriggerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import '../src';
import type { wordpressAuth } from '../src';
import { wordpressNewPost } from '../src/lib/trigger/new-post.trigger';

const SITE = 'https://site.test';
const MIN = 60_000;
const STORE_LATENCY_MS = 5;
const HOUR = 60 * MIN;

type VendorPost = {
  id: number;
  dateMs: number;
  modifiedMs: number;
  status: 'publish' | 'draft' | 'future' | 'trash';
  author: number;
};

const vendor: {
  posts: VendorPost[];
  offsetMinutes: number;
  nextId: number;
  requests: URL[];
  costMs: number;
  ignoreModifiedAfter: boolean;
  forbidUnpublished: boolean;
} = {
  posts: [],
  offsetMinutes: 0,
  nextId: 1,
  requests: [],
  costMs: 0,
  ignoreModifiedAfter: false,
  forbidUnpublished: false,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

function setClock(ms: number) {
  clock = ms;
  vi.setSystemTime(ms);
}

function advance(minutes: number) {
  setClock(clock + minutes * MIN);
  return clock;
}

function wall(ms: number) {
  return new Date(ms).toISOString().slice(0, 19);
}

function publish({ dateMs, author = 1, status = 'publish' }: { dateMs?: number; author?: number; status?: VendorPost['status'] } = {}): VendorPost {
  const post = { id: vendor.nextId++, dateMs: dateMs ?? clock, modifiedMs: dateMs ?? clock, status, author };
  vendor.posts.push(post);
  return post;
}

function edit(post: VendorPost) {
  post.modifiedMs = clock;
}

function toWire(post: VendorPost) {
  const offset = vendor.offsetMinutes * MIN;
  return {
    id: post.id,
    date: wall(post.dateMs + offset),
    date_gmt: wall(post.dateMs),
    guid: { rendered: `${SITE}/?p=${post.id}` },
    modified: wall(post.modifiedMs + offset),
    modified_gmt: wall(post.modifiedMs),
    slug: `post-${post.id}`,
    status: post.status,
    type: 'post',
    link: `${SITE}/post-${post.id}/`,
    title: { rendered: `Post ${post.id}` },
    content: { rendered: '<p>x</p>', protected: false },
    excerpt: { rendered: 'x', protected: false },
    author: post.author,
    featured_media: 0,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    meta: [],
    categories: [1],
    tags: [],
    _links: { self: [{ href: `${SITE}/wp-json/wp/v2/posts/${post.id}` }] },
  };
}

function legacyEpoch(post: VendorPost): number {
  return Date.parse(wall(post.dateMs + vendor.offsetMinutes * MIN));
}

function parseWpDate(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? Date.parse(value) : Date.parse(`${value}Z`) - vendor.offsetMinutes * MIN;
}

function json({ body, status = 200, headers = {} }: { body: unknown; status?: number; headers?: Record<string, string> }) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function listPosts(url: URL): Response {
  const q = url.searchParams;
  const after = parseWpDate(q.get('after'));
  const before = parseWpDate(q.get('before'));
  const modifiedAfter = vendor.ignoreModifiedAfter ? undefined : parseWpDate(q.get('modified_after'));
  const statuses = (q.get('status') ?? 'publish').split(',');
  if (vendor.forbidUnpublished && statuses.some((status) => status !== 'publish')) {
    return json({ body: { code: 'rest_invalid_param', message: 'Invalid parameter(s): status', data: { status: 400, params: { status: 'Status is forbidden.' } } }, status: 400 });
  }
  const author = q.get('author');
  const orderby = q.get('orderby') ?? 'date';
  const direction = q.get('order') === 'asc' ? 1 : -1;
  const perPage = Number(q.get('per_page') ?? 10);
  if (perPage > 100) {
    return json({ body: { code: 'rest_invalid_param', message: 'Invalid parameter(s): per_page', data: { status: 400 } }, status: 400 });
  }
  const page = Number(q.get('page') ?? 1);
  const key = (p: VendorPost) => (orderby === 'id' ? p.id : orderby === 'modified' ? p.modifiedMs : p.dateMs);
  const matching = vendor.posts
    .filter((p) => statuses.includes(p.status))
    .filter(((ids: Set<number> | null) => (p: { id: number }) => ids === null || ids.has(p.id))(q.get('include') ? new Set(q.get('include')!.split(',').map(Number)) : null))
    .filter((p) => (author ? String(p.author) === author : true))
    .filter((p) => (after === undefined || Math.floor(p.dateMs / 1000) * 1000 > after) && (before === undefined || p.dateMs < before))
    .filter((p) => modifiedAfter === undefined || Math.floor(p.modifiedMs / 1000) * 1000 > modifiedAfter)
    .sort((a, b) => direction * (key(a) - key(b) || a.id - b.id));
  const totalPages = Math.ceil(matching.length / perPage);
  if (page > 1 && page > totalPages) {
    return json({ body: { code: 'rest_post_invalid_page_number', message: 'The page number requested is larger than the number of pages available.', data: { status: 400 } }, status: 400 });
  }
  return json({
    body: matching.slice((page - 1) * perPage, page * perPage).map(toWire),
    headers: {
      'x-wp-total': String(matching.length),
      'x-wp-totalpages': String(totalPages),
    },
  });
}

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        setClock(clock + STORE_LATENCY_MS);
        const raw = data.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

type TestStore = ReturnType<typeof memoryStore>['store'];

const auth: AppConnectionValueForAuthProperty<typeof wordpressAuth> = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { website_url: SITE, username: 'editor', password: 'app pass' },
};

function hookContext({ store, isRepublish, authors }: { store: TestStore; isRepublish?: boolean; authors?: string }) {
  return {
    ...createMockPollingTriggerContext<typeof trigger.props>({ propsValue: { authors } }),
    auth,
    store,
    files: createMockActionContext({ propsValue: {} }).files,
    isRepublish,
  };
}

function field({ event, key }: { event: unknown; key: string }): unknown {
  if (typeof event !== 'object' || event === null || !(key in event)) {
    throw new Error(`event has no ${key}`);
  }
  return Object.entries(event).find(([name]) => name === key)?.[1];
}

function keysOf({ value }: { value: unknown }): string[] {
  return typeof value === 'object' && value !== null ? Object.keys(value) : [];
}

async function poll({ store, authors }: { store: TestStore; authors?: string }): Promise<number[]> {
  const out = await trigger.run(hookContext({ store, authors }));
  return out.map((event) => Number(field({ event, key: 'id' })));
}

async function enable({ store, authors }: { store: TestStore; authors?: string }) {
  await trigger.onEnable(hookContext({ store, authors }));
}

async function republish({ store, authors }: { store: TestStore; authors?: string }) {
  await trigger.onDisable(hookContext({ store, isRepublish: true, authors }));
  await trigger.onEnable(hookContext({ store, isRepublish: true, authors }));
}

function seedHistory() {
  const start = clock;
  setClock(start - 30 * 24 * HOUR);
  publish();
  setClock(start - 2 * 24 * HOUR);
  publish();
  setClock(start - 2 * HOUR);
  publish();
  setClock(start);
}

const trigger = pollingTrigger();

function pollingTrigger() {
  if (wordpressNewPost.type !== TriggerStrategy.POLLING) {
    throw new Error('expected a polling trigger');
  }
  return wordpressNewPost;
}

beforeEach(() => {
  vendor.posts = [];
  vendor.offsetMinutes = 0;
  vendor.nextId = 1;
  vendor.requests = [];
  vendor.costMs = 0;
  vendor.ignoreModifiedAfter = false;
  vendor.forbidUnpublished = false;
  vi.useFakeTimers({ toFake: ['Date'] });
  setClock(Date.parse('2026-11-01T10:00:00.000Z'));
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
    vendor.requests.push(url);
    if (vendor.costMs > 0) {
      setClock(clock + vendor.costMs);
    }
    if (url.origin === SITE && url.pathname === '/wp-json/wp/v2/posts') {
      return listPosts(url);
    }
    throw new Error(`unexpected request ${url.href}`);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('WordPress New Post behaviour', () => {
  for (const offsetMinutes of [0, 180, -300]) {
    it(`fires once per new post across polls and a republish (site offset ${offsetMinutes} min)`, async () => {
      vendor.offsetMinutes = offsetMinutes;
      seedHistory();
      const { store } = memoryStore();
      await enable({ store });
      advance(5);
      expect(await poll({ store })).toEqual([]);
      advance(1);
      const first = publish();
      advance(4);
      expect(await poll({ store })).toEqual([first.id]);
      advance(5);
      expect(await poll({ store })).toEqual([]);
      await republish({ store });
      advance(5);
      expect(await poll({ store })).toEqual([]);
      advance(1);
      const second = publish();
      advance(4);
      expect(await poll({ store })).toEqual([second.id]);
      advance(5);
      expect(await poll({ store })).toEqual([]);
    });
  }

  it('fires a post published between polls that straddle a republish exactly once', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const between = publish();
    await republish({ store });
    advance(3);
    expect(await poll({ store })).toEqual([between.id]);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires a newly published post with an earlier publish date once', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(5);
    const backdated = publish({ dateMs: clock - 3 * 24 * HOUR });
    advance(5);
    expect(await poll({ store })).toEqual([backdated.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires a post created in one request with yesterday as its date, where WordPress sets modified to that date too', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(5);
    const imported = publish({ dateMs: clock - 24 * HOUR });
    expect(imported.modifiedMs).toBe(imported.dateMs);
    advance(5);
    expect(await poll({ store })).toEqual([imported.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires 1200 posts imported with old dates over several polls, each exactly once', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const imported = Array.from({ length: 1200 }, (_, index) => publish({ dateMs: clock - 400 * 24 * HOUR + index * 1000 }).id);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 4; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired.length).toBe(imported.length);
    expect([...fired].sort((a, b) => a - b)).toEqual(imported);
  });

  it('fires a draft created before a later post and then published backdated through the editor', async () => {
    seedHistory();
    const draft = publish({ status: 'draft' });
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const later = publish();
    advance(3);
    expect(await poll({ store })).toEqual([later.id]);
    advance(2);
    draft.status = 'publish';
    draft.dateMs = clock - 5 * 24 * HOUR;
    edit(draft);
    advance(3);
    expect(await poll({ store })).toEqual([draft.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires a draft that existed before an older published post id at enable, when it is published backdated through the editor', async () => {
    const draft = publish({ status: 'draft' });
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(5);
    expect(await poll({ store })).toEqual([]);
    draft.status = 'publish';
    draft.dateMs = clock - 10 * 24 * HOUR;
    edit(draft);
    advance(3);
    expect(await poll({ store })).toEqual([draft.id]);
    advance(2);
    edit(draft);
    advance(3);
    expect(await poll({ store })).toEqual([]);
  });

  it('still enables and polls when the connected user cannot list drafts', async () => {
    seedHistory();
    publish({ status: 'draft' });
    vendor.forbidUnpublished = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { store } = memoryStore();
    await enable({ store });
    expect(warn).toHaveBeenCalled();
    advance(2);
    const fresh = publish();
    advance(3);
    expect(await poll({ store })).toEqual([fresh.id]);
  });

  it('fires every post of a 4000-post import with old dates once, even after the fired list is pruned', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const imported = Array.from({ length: 4000 }, (_, index) => publish({ dateMs: clock - 400 * 24 * HOUR + index * 1000 }).id);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 6; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired.length).toBe(imported.length);
    expect([...fired].sort((a, b) => a - b)).toEqual(imported);
  });

  it('keeps the store under the 512 KB limit during an import larger than the fired-post memory', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    Array.from({ length: 11_000 }, (_, index) => publish({ dateMs: clock - 400 * 24 * HOUR + index * 1000 }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 12; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
      const size = [...data.values()].reduce((acc, value) => acc + value.length, 0);
      expect(size).toBeLessThan(512 * 1024);
    }
    expect(fired.length).toBe(new Set(fired).size);
    expect(fired.length).toBeGreaterThanOrEqual(10_000);
  });

  it('does not fire an imported post twice when new posts shift the pages of a resumed id scan after pruning', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const imported = Array.from({ length: 3500 }, (_, index) => publish({ dateMs: clock - 400 * 24 * HOUR + index * 1000 }).id);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fresh: number[] = [];
    const fired: number[] = [];
    for (let i = 0; i < 6; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
      fresh.push(...Array.from({ length: 150 }, () => publish().id));
    }
    for (let i = 0; i < 4; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired.length).toBe(new Set(fired).size);
    expect([...fired].sort((a, b) => a - b)).toEqual([...imported, ...fresh].sort((a, b) => a - b));
  });

  it('skips the modified listing on WordPress before 5.7 instead of reading the whole site every poll', async () => {
    seedHistory();
    for (let i = 0; i < 300; i++) {
      edit(publish({ dateMs: clock - (400 - i) * HOUR }));
    }
    vendor.ignoreModifiedAfter = true;
    const { store } = memoryStore();
    await enable({ store });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    advance(5);
    const imported = publish({ dateMs: clock - 24 * HOUR });
    advance(5);
    vendor.requests = [];
    expect(await poll({ store })).toEqual([imported.id]);
    expect(vendor.requests.filter((url) => url.searchParams.get('orderby') === 'modified').length).toBeLessThanOrEqual(1);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire when an old post or an already fired post is edited', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const fresh = publish();
    advance(3);
    expect(await poll({ store })).toEqual([fresh.id]);
    advance(1);
    edit(vendor.posts[0]);
    edit(vendor.posts[2]);
    edit(fresh);
    advance(4);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires an old draft that is published now with the current date', async () => {
    const draft = publish({ status: 'draft' });
    advance(10);
    seedHistory();
    publish();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    draft.status = 'publish';
    draft.dateMs = clock;
    draft.modifiedMs = clock;
    advance(3);
    expect(await poll({ store })).toEqual([draft.id]);
  });

  it('fires a scheduled post that WP-cron publishes late, after newer posts moved the cursor', async () => {
    seedHistory();
    const scheduled = publish({ status: 'future', dateMs: clock + 10 * MIN });
    const { store } = memoryStore();
    await enable({ store });
    advance(15);
    const other = publish();
    advance(5);
    expect(await poll({ store })).toEqual([other.id]);
    advance(20);
    scheduled.status = 'publish';
    advance(5);
    expect(await poll({ store })).toEqual([scheduled.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires both posts that share the same second, across two polls', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const sameSecond = clock;
    const a = publish({ dateMs: sameSecond });
    expect(await poll({ store })).toEqual([a.id]);
    const b = publish({ dateMs: sameSecond });
    expect(await poll({ store })).toEqual([b.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('keeps working when the last fired post is trashed', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const a = publish();
    advance(3);
    expect(await poll({ store })).toEqual([a.id]);
    a.status = 'trash';
    advance(2);
    const b = publish();
    advance(3);
    expect(await poll({ store })).toEqual([b.id]);
  });

  it('pages back through a 130-post burst and emits every post once, oldest first', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 130 }, () => {
      clock += 1000;
      return publish().id;
    });
    advance(5);
    expect(await poll({ store })).toEqual(burst);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('caps a 1200-post burst and delivers the rest on the next poll without duplicates', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 1200 }, () => {
      clock += 1000;
      return publish().id;
    });
    advance(5);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const first = await poll({ store });
    expect(first.length).toBeGreaterThan(900);
    expect(first.length).toBeLessThan(burst.length);
    expect(warn).toHaveBeenCalled();
    advance(5);
    const second = await poll({ store });
    expect([...first, ...second]).toEqual(burst);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('fits a slow site inside the 45 s poll budget and delivers the rest on later polls', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 700 }, () => {
      clock += 1000;
      return publish().id;
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.costMs = 14_000;
    const fired: number[] = [];
    for (let i = 0; i < 12; i++) {
      advance(5);
      const start = clock;
      fired.push(...(await poll({ store })));
      expect(clock - start).toBeLessThanOrEqual(45_000);
    }
    expect(fired).toEqual(burst);
  });

  it('keeps the store bounded and never re-fires pruned posts when they are edited', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 2300 }, () => {
      clock += 1000;
      return publish();
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 4; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired).toEqual(burst.map((post) => post.id));
    edit(burst[0]);
    edit(burst[1500]);
    advance(1);
    expect(await poll({ store })).toEqual([]);
    const size = [...data.values()].reduce((acc, value) => acc + value.length, 0);
    expect(size).toBeLessThan(512 * 1024);
  });

  it('re-baselines when the author filter changes on republish', async () => {
    seedHistory();
    publish({ author: 2, dateMs: clock - HOUR });
    const { store } = memoryStore();
    await enable({ store, authors: '1' });
    advance(5);
    expect(await poll({ store, authors: '1' })).toEqual([]);
    await republish({ store, authors: '2' });
    advance(5);
    expect(await poll({ store, authors: '2' })).toEqual([]);
    const byTwo = publish({ author: 2 });
    publish({ author: 1 });
    advance(5);
    expect(await poll({ store, authors: '2' })).toEqual([byTwo.id]);
    expect(vendor.requests.filter((url) => url.searchParams.get('author') === '2').length).toBeGreaterThan(0);
  });

  it('a fresh enable on a site with history fires nothing for existing posts', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    for (let i = 0; i < 3; i++) {
      advance(5);
      expect(await poll({ store })).toEqual([]);
    }
  });

  for (const offsetMinutes of [0, 180, -300]) {
  it(`upgrades a flow from the old lastPoll store without re-firing and still fires the pending post (site offset ${offsetMinutes} min)`, async () => {
    vendor.offsetMinutes = offsetMinutes;
    seedHistory();
    advance(10);
    const firedByOldVersion = publish();
    advance(5);
    const legacyLastPoll = legacyEpoch(firedByOldVersion);
    advance(2);
    const pending = publish();
    advance(1);
    const { store, data } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    await republish({ store });
    expect(data.has('lastPoll')).toBe(false);
    advance(2);
    expect(await poll({ store })).toEqual([pending.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });
  }

  it('upgrades a UTC-5 site whose old cursor lagged behind without re-firing posts the old version already sent', async () => {
    vendor.offsetMinutes = -300;
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(2);
    const { store } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    await republish({ store });
    advance(5);
    expect(await poll({ store })).toEqual([]);
    const next = publish();
    advance(5);
    expect(await poll({ store })).toEqual([next.id]);
  });

  it('keeps a slow site inside the 45 s budget on the migrating run and fires the pending post once later', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(3);
    const pending = publish();
    advance(2);
    const { store } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    vendor.costMs = 9_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 4; i++) {
      advance(5);
      const start = clock;
      fired.push(...(await poll({ store })));
      expect(clock - start).toBeLessThanOrEqual(45_000);
    }
    expect(fired).toEqual([pending.id]);
  });

  it('falls back to a fresh baseline when the budget cuts the lazy migration, so the trigger keeps firing', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(3);
    const gap = publish();
    advance(2);
    const { store, data } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    vendor.costMs = 16_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired = [...(await poll({ store }))];
    expect(fired).toEqual([]);
    expect(data.has('lastPoll')).toBe(false);
    expect(data.has('wordpress_new_post_cursor')).toBe(true);
    vendor.costMs = 0;
    advance(5);
    fired.push(...(await poll({ store })));
    advance(1);
    const fresh = publish();
    advance(5);
    fired.push(...(await poll({ store })));
    advance(5);
    fired.push(...(await poll({ store })));
    expect(fired).toEqual([fresh.id]);
    expect(fired).not.toContain(gap.id);
  });

  it('moves past more than one poll of posts that share a single publish second', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const sameSecond = Math.floor(clock / 1000) * 1000;
    const batch = Array.from({ length: 1150 }, () => publish({ dateMs: sameSecond }).id);
    advance(1);
    const later = publish();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 5; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired.length).toBe(batch.length + 1);
    expect([...fired].sort((a, b) => a - b)).toEqual([...batch, later.id]);
  });

  it('migrates lazily in run() when the old lastPoll is still the only state', async () => {
    seedHistory();
    const legacyLastPoll = legacyEpoch(vendor.posts[2]);
    advance(3);
    const pending = publish();
    advance(2);
    const { store } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    expect(await poll({ store })).toEqual([pending.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('test() returns the newest published posts, oldest to newest with the newest last', async () => {
    seedHistory();
    publish({ status: 'draft' });
    advance(1);
    const newest = publish();
    const { store } = memoryStore();
    const sample = await trigger.test(hookContext({ store }));
    expect(field({ event: sample[sample.length - 1], key: 'id' })).toBe(newest.id);
    expect(sample.length).toBeLessThanOrEqual(5);
    expect(sample.every((event) => field({ event, key: 'status' }) === 'publish')).toBe(true);
  });

  it('every sampleData key exists in a real run item', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    publish();
    advance(4);
    const [real] = await trigger.run(hookContext({ store }));
    for (const key of keysOf({ value: trigger.sampleData })) {
      expect(real).toHaveProperty(key);
    }
  });
});
