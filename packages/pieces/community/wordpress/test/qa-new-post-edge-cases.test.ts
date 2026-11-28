import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, createMockPollingTriggerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import '../src';
import type { wordpressAuth } from '../src';
import { wordpressNewPost } from '../src/lib/trigger/new-post.trigger';

const SITE = 'https://site.test';
const MIN = 60_000;
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
  stripHeaders: boolean;
  storeLatencyMs: number;
  latencyFn: undefined | ((url: URL) => number);
  msPerRequest: number;
  fault: undefined | ((url: URL) => Response | undefined);
} = {
  posts: [],
  offsetMinutes: 0,
  nextId: 1,
  requests: [],
  stripHeaders: false,
  storeLatencyMs: 0,
  latencyFn: undefined,
  msPerRequest: 0,
  fault: undefined,
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
  const modifiedAfter = parseWpDate(q.get('modified_after'));
  const statuses = (q.get('status') ?? 'publish').split(',');
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
    headers: vendor.stripHeaders ? {} : { 'x-wp-total': String(matching.length), 'x-wp-totalpages': String(totalPages) },
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
        if (vendor.storeLatencyMs > 0) {
          setClock(clock + vendor.storeLatencyMs);
        }
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

function schemaFieldKeys({ schema }: { schema: unknown }): string[] {
  if (typeof schema !== 'object' || schema === null || !('fields' in schema) || !Array.isArray(schema.fields)) {
    return [];
  }
  return schema.fields.map((entry: unknown) => String(field({ event: entry, key: 'key' })));
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
  vendor.stripHeaders = false;
  vendor.msPerRequest = 0;
  vendor.storeLatencyMs = 0;
  vendor.latencyFn = undefined;
  vendor.fault = undefined;
  vi.useFakeTimers({ toFake: ['Date'] });
  setClock(Date.parse('2026-11-01T10:00:00.000Z'));
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
    vendor.requests.push(url);
    if (vendor.msPerRequest > 0) {
      setClock(clock + vendor.msPerRequest);
    }
    if (vendor.latencyFn) {
      setClock(clock + vendor.latencyFn(url));
    }
    const injected = vendor.fault?.(url);
    if (injected) {
      return injected;
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
  vi.restoreAllMocks();
});

function wpError({ status, code }: { status: number; code: string }) {
  return json({ body: { code, message: `${code} from vendor`, data: { status } }, status });
}

function snapshot(data: Map<string, string>) {
  return JSON.stringify([...data.entries()].sort());
}

describe('QA: WordPress New Post edge cases', () => {
  it('a post present in both the date and the modified listing of the same poll fires once', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    const post = publish();
    advance(1);
    vendor.requests = [];
    expect(await poll({ store })).toEqual([post.id]);
    const listings = vendor.requests.filter((url) => url.searchParams.get('page') === '1');
    expect(listings.some((url) => url.searchParams.has('after'))).toBe(true);
    expect(listings.some((url) => url.searchParams.has('modified_after'))).toBe(true);
    advance(1);
    expect(await poll({ store })).toEqual([]);
  });

  it('a post fired from the modified listing does not fire again from the date look-back on the next polls', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    const backdated = publish({ dateMs: clock - 10 * MIN });
    advance(1);
    expect(await poll({ store })).toEqual([backdated.id]);
    for (let i = 0; i < 5; i++) {
      advance(5);
      edit(backdated);
      expect(await poll({ store })).toEqual([]);
    }
  });

  it('an edit of an old post inside the 1 h date look-back never fires', async () => {
    seedHistory();
    const recentOld = publish({ dateMs: clock - 20 * MIN });
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    edit(recentOld);
    edit(vendor.posts[0]);
    advance(1);
    expect(await poll({ store })).toEqual([]);
    advance(1);
    edit(recentOld);
    expect(await poll({ store })).toEqual([]);
  });

  it('lists only published posts for events; the one status request reads draft ids at enable', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    publish({ status: 'draft' });
    publish({ status: 'future', dateMs: clock + HOUR });
    const live = publish();
    advance(1);
    expect(await poll({ store })).toEqual([live.id]);
    await trigger.test(hookContext({ store }));
    const withStatus = vendor.requests.filter((url) => url.searchParams.has('status'));
    expect(withStatus.every((url) => url.searchParams.get('status') === 'draft,pending,future' && url.searchParams.get('_fields') === 'id')).toBe(true);
  });

  for (const [label, status, code] of [
    ['401', 401, 'rest_not_logged_in'],
    ['429', 429, 'too_many_requests'],
    ['500', 500, 'internal_server_error'],
  ] as const) {
    it(`a vendor ${label} on page 2 of the date listing throws and leaves the cursor untouched`, async () => {
      seedHistory();
      const { store, data } = memoryStore();
      await enable({ store });
      const burst = Array.from({ length: 150 }, () => {
        clock += 1000;
        return publish().id;
      });
      advance(5);
      const before = snapshot(data);
      vendor.fault = (url) => (url.searchParams.has('after') && url.searchParams.get('page') === '2' ? wpError({ status, code }) : undefined);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await expect(poll({ store })).rejects.toThrow();
      expect(snapshot(data)).toBe(before);
      vendor.fault = undefined;
      advance(5);
      expect(await poll({ store })).toEqual(burst);
    });
  }

  it('a vendor 503 in the modified listing (after the date listing succeeded) throws and leaves the cursor untouched', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    advance(1);
    const post = publish();
    advance(1);
    const before = snapshot(data);
    vendor.fault = (url) => (url.searchParams.has('modified_after') ? wpError({ status: 503, code: 'service_unavailable' }) : undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(poll({ store })).rejects.toThrow(/503|service_unavailable|WordPress/);
    expect(snapshot(data)).toBe(before);
    vendor.fault = undefined;
    expect(await poll({ store })).toEqual([post.id]);
  });

  it('a non-JSON 200 (security plugin / HTML page) throws instead of returning no posts', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    advance(1);
    publish();
    const before = snapshot(data);
    vendor.fault = () => new Response('<html>blocked</html>', { status: 200, headers: { 'content-type': 'text/html' } });
    await expect(poll({ store })).rejects.toThrow();
    expect(snapshot(data)).toBe(before);
  });

  it('hitting the poll deadline mid-paging keeps the cursor and the next poll continues without loss or duplicates', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 600 }, () => {
      clock += 1000;
      return publish().id;
    });
    advance(5);
    vendor.msPerRequest = 12_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    const first = await poll({ store });
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThan(burst.length);
    expect(first).toEqual(burst.slice(0, first.length));
    const state = JSON.parse(data.get('wordpress_new_post_cursor') ?? '{}');
    expect(state.byDate.complete).toBe(false);
    fired.push(...first);
    for (let i = 0; i < 6 && fired.length < burst.length; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired).toEqual(burst);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('pruned (evicted) fired ids never re-fire, even when edited or trashed and restored', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 2100 }, () => {
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
    const state = JSON.parse(data.get('wordpress_new_post_cursor') ?? '{}');
    expect(state.seen.length).toBe(2000);
    const evicted = burst.slice(0, 100);
    expect(state.seen.some(([id]: [number]) => id === evicted[0].id)).toBe(false);
    for (const post of evicted) {
      post.status = 'trash';
    }
    advance(1);
    expect(await poll({ store })).toEqual([]);
    for (const post of evicted) {
      post.status = 'publish';
      edit(post);
    }
    advance(1);
    expect(await poll({ store })).toEqual([]);
  });

  it('pages without X-WP-TotalPages headers (host strips them) and still emits a 130-post burst once', async () => {
    seedHistory();
    vendor.stripHeaders = true;
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

  it('QA-FIX: without X-WP-TotalPages, a window of exactly 100 posts does not throw on the empty page 2', async () => {
    seedHistory();
    vendor.stripHeaders = true;
    const { store } = memoryStore();
    await enable({ store });
    const burst = Array.from({ length: 99 }, () => {
      clock += 1000;
      return publish().id;
    });
    advance(1);
    vendor.requests = [];
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await poll({ store })).toEqual(burst);
    expect(vendor.requests.some((url) => url.searchParams.get('page') === '2')).toBe(true);
  });

  for (const offsetMinutes of [840, -720, 330]) {
    it(`upgrade from 0.9.1 lastPoll on an extreme-offset site (${offsetMinutes} min) does not re-fire sent posts`, async () => {
      vendor.offsetMinutes = offsetMinutes;
      seedHistory();
      advance(10);
      const sentA = publish();
      advance(3);
      const sentB = publish();
      const legacyLastPoll = Math.max(legacyEpoch(sentA), legacyEpoch(sentB));
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
  }

  it('upgrade: the old lastPoll also survives a republish with an author set', async () => {
    seedHistory();
    advance(10);
    const sent = publish({ author: 1 });
    const legacyLastPoll = legacyEpoch(sent);
    advance(2);
    const pending = publish({ author: 1 });
    publish({ author: 2 });
    advance(1);
    const { store } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    await republish({ store, authors: '1' });
    advance(2);
    expect(await poll({ store, authors: '1' })).toEqual([pending.id]);
  });

  it('QA-FIX: a vendor error on the first poll after a lazy lastPoll migration does not lose the pending post', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(3);
    const pending = publish();
    advance(2);
    const { store } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    let failed = false;
    vendor.fault = (url) => {
      if (!failed && url.searchParams.has('modified_after')) {
        failed = true;
        return wpError({ status: 502, code: 'bad_gateway' });
      }
      return undefined;
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(poll({ store })).rejects.toThrow();
    advance(5);
    expect(await poll({ store })).toEqual([pending.id]);
  });

  it('QA-FIX: a status=publish post with a future date at enable does not stall the date listing for scheduled posts', async () => {
    seedHistory();
    const scheduled = publish({ status: 'future', dateMs: clock + 10 * MIN });
    publish({ dateMs: clock + 30 * 24 * HOUR });
    const { store } = memoryStore();
    await enable({ store });
    advance(15);
    const other = publish();
    advance(5);
    expect(await poll({ store })).toEqual([other.id]);
    advance(5);
    scheduled.status = 'publish';
    advance(5);
    expect(await poll({ store })).toEqual([scheduled.id]);
  });

  it('test() and run() return the same item shape and every outputSchema key exists in a run item', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    publish();
    advance(4);
    const [real] = await trigger.run(hookContext({ store }));
    const [sample] = await trigger.test(hookContext({ store }));
    expect(keysOf({ value: sample }).sort()).toEqual(keysOf({ value: real }).sort());
    const schemaKeys = schemaFieldKeys({ schema: trigger.outputSchema });
    expect(schemaKeys.length).toBeGreaterThan(0);
    for (const key of schemaKeys) {
      const top = key.split('.')[0];
      expect(real).toHaveProperty(top);
    }
  });

  it('test() works with the author blank and with an author set', async () => {
    seedHistory();
    publish({ author: 2 });
    const { store } = memoryStore();
    const blank = await trigger.test(hookContext({ store }));
    expect(blank.length).toBe(4);
    const byTwo = await trigger.test(hookContext({ store, authors: '2' }));
    expect(byTwo.map((event) => field({ event, key: 'author' }))).toEqual([2]);
  });

  it('upgrade with state from 0.9.1 and no republish: first run() fires nothing already sent', async () => {
    seedHistory();
    const legacyLastPoll = legacyEpoch(vendor.posts[2]);
    advance(5);
    const { store, data } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    expect(await poll({ store })).toEqual([]);
    expect(data.has('lastPoll')).toBe(false);
    expect(data.has('wordpress_new_post_cursor')).toBe(true);
  });
});

describe('QA round 2: budget, pre-marking and migration ordering', () => {
  it('keeps the modified listing on after a DST fall-back returns a post from the repeated hour first', async () => {
    seedHistory();
    const { store } = memoryStore();
    const draft = publish({ status: 'draft', dateMs: clock - 10 * 24 * HOUR });
    const firstEdited = publish({ dateMs: clock - 20 * 24 * HOUR });
    const laterEdited = publish({ dateMs: clock - 21 * 24 * HOUR });
    await enable({ store });
    advance(10);
    edit(firstEdited);
    advance(50);
    edit(laterEdited);
    advance(1);
    expect(await poll({ store })).toEqual([]);
    advance(5);
    // America/New_York fall-back: the site maps modified_after to local time, which in the repeated hour reads 1 h early.
    vendor.fault = (url) => {
      const after = url.searchParams.get('modified_after');
      if (url.searchParams.get('orderby') !== 'modified' || after === null) return undefined;
      const shifted = new URL(url);
      shifted.searchParams.set('modified_after', new Date(Date.parse(after) - HOUR).toISOString());
      return listPosts(shifted);
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await poll({ store })).toEqual([]);
    expect(warn.mock.calls.some(([message]) => String(message).includes('before 5.7'))).toBe(false);
    for (let i = 0; i < 3; i++) {
      advance(5);
      expect(await poll({ store })).toEqual([]);
    }
    advance(5);
    draft.status = 'publish';
    edit(draft);
    advance(1);
    expect(await poll({ store })).toEqual([draft.id]);
    expect(warn.mock.calls.some(([message]) => String(message).includes('before 5.7'))).toBe(false);
  });

  it('reads only ids in the id listing and fetches full posts only for new ids', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    vendor.requests.length = 0;
    expect(await poll({ store })).toEqual([]);
    const idListing = vendor.requests.filter((url) => url.searchParams.get('orderby') === 'id');
    expect(idListing.length).toBeGreaterThan(0);
    expect(idListing.every((url) => url.searchParams.get('_fields') === 'id' && !url.searchParams.has('include'))).toBe(true);
    advance(1);
    const backdated = publish({ dateMs: clock - 30 * 24 * HOUR });
    advance(1);
    vendor.requests.length = 0;
    expect(await poll({ store })).toEqual([backdated.id]);
    const byInclude = vendor.requests.filter((url) => url.searchParams.has('include'));
    expect(byInclude.map((url) => url.searchParams.get('include'))).toEqual([String(backdated.id)]);
    expect(byInclude[0].searchParams.has('_fields')).toBe(false);
  });

  for (const status of [500, 503]) {
    it(`enables with a warning when the drafts read fails with ${status}`, async () => {
      seedHistory();
      const { store } = memoryStore();
      vendor.fault = (url) => (url.searchParams.has('status') ? wpError({ status, code: 'internal_server_error' }) : undefined);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      await enable({ store });
      expect(warn.mock.calls.some(([message]) => String(message).includes('could not list drafts'))).toBe(true);
      vendor.fault = undefined;
      advance(1);
      const live = publish();
      advance(1);
      expect(await poll({ store })).toEqual([live.id]);
    });
  }

  async function timedPoll(store: TestStore): Promise<{ ids: number[]; elapsedMs: number }> {
    const start = clock;
    const ids = await poll({ store });
    return { ids, elapsedMs: clock - start };
  }

  it('a status=publish post already future-dated at enable never fires, even after its date passes and it is edited', async () => {
    seedHistory();
    const skewed = publish({ dateMs: clock + 20 * MIN });
    const { store } = memoryStore();
    await enable({ store });
    const fired: number[] = [];
    for (let i = 0; i < 8; i++) {
      advance(5);
      if (i === 5) {
        edit(skewed);
      }
      fired.push(...(await poll({ store })));
    }
    expect(fired).toEqual([]);
  });

  it('a scheduled (status future) post that exists at enable fires exactly once when it goes live', async () => {
    seedHistory();
    const scheduled = publish({ status: 'future', dateMs: clock + 12 * MIN });
    publish({ dateMs: clock + 3 * HOUR });
    const { store } = memoryStore();
    await enable({ store });
    const fired: number[] = [];
    for (let i = 0; i < 8; i++) {
      advance(5);
      if (i === 2) {
        scheduled.status = 'publish';
      }
      fired.push(...(await poll({ store })));
    }
    expect(fired).toEqual([scheduled.id]);
  });

  it('a future-dated post published after enable (server clock ahead) fires once and not again when its date passes', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    const ahead = publish({ dateMs: clock + 10 * MIN });
    const fired: number[] = [];
    for (let i = 0; i < 6; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(fired).toEqual([ahead.id]);
  });

  it('busy slow site (14 s/request): every poll stays within the 45 s budget, the date listing always reads, and nothing starves', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const expected: number[] = [];
    for (let i = 0; i < 400; i++) {
      clock += 1000;
      expected.push(publish().id);
    }
    vi.setSystemTime(clock);
    vendor.msPerRequest = 14_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 20; i++) {
      advance(5);
      for (let j = 0; j < 60; j++) {
        clock += 1000;
        expected.push(publish().id);
      }
      vi.setSystemTime(clock);
      vendor.requests = [];
      const { ids, elapsedMs } = await timedPoll(store);
      expect(elapsedMs).toBeLessThanOrEqual(45_000);
      expect(vendor.requests.some((url) => url.searchParams.has('after'))).toBe(true);
      expect(vendor.requests.some((url) => url.searchParams.has('modified_after'))).toBe(true);
      fired.push(...ids);
    }
    vendor.msPerRequest = 0;
    for (let i = 0; i < 10; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(new Set(fired).size).toBe(fired.length);
    expect([...fired].sort((a, b) => a - b)).toEqual(expected);
  });

  it('host at exactly the 15 s request timeout still gives the modified listing a turn within 45 s', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    for (let i = 0; i < 500; i++) {
      clock += 1000;
      publish();
    }
    vi.setSystemTime(clock);
    advance(5);
    const backdated = publish({ dateMs: clock - 5 * 24 * HOUR });
    vendor.msPerRequest = 15_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.requests = [];
    const { ids, elapsedMs } = await timedPoll(store);
    expect(elapsedMs).toBeLessThanOrEqual(45_000);
    expect(vendor.requests.some((url) => url.searchParams.has('modified_after'))).toBe(true);
    const fired = [...ids];
    for (let i = 0; i < 10; i++) {
      advance(5);
      const next = await timedPoll(store);
      expect(next.elapsedMs).toBeLessThanOrEqual(45_000);
      fired.push(...next.ids);
    }
    expect(fired.filter((id) => id === backdated.id)).toEqual([backdated.id]);
    expect(new Set(fired).size).toBe(501);
  });

  it('a skipped modified turn keeps its cursor: a backdated post published in that poll fires on the next one', async () => {
    seedHistory();
    const { store, data } = memoryStore();
    await enable({ store });
    advance(5);
    const backdated = publish({ dateMs: clock - 3 * 24 * HOUR });
    const before = JSON.parse(data.get('wordpress_new_post_cursor') ?? '{}').byModified;
    vendor.msPerRequest = 31_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vendor.requests = [];
    expect(await poll({ store })).toEqual([]);
    expect(vendor.requests.some((url) => url.searchParams.has('modified_after'))).toBe(false);
    expect(JSON.parse(data.get('wordpress_new_post_cursor') ?? '{}').byModified).toEqual(before);
    vendor.msPerRequest = 0;
    advance(30);
    expect(await poll({ store })).toEqual([backdated.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('F2 ordering: a failure in the date listing after a lazy migration keeps the migrated state, and recovery fires the pending post once', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(3);
    const pending = publish();
    advance(2);
    const { store, data } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    let calls = 0;
    vendor.fault = (url) => {
      if (url.searchParams.get('orderby') === 'date' && url.searchParams.get('order') === 'asc') {
        calls++;
        if (calls === 2) {
          return wpError({ status: 500, code: 'internal_server_error' });
        }
      }
      return undefined;
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(poll({ store })).rejects.toThrow();
    expect(data.has('wordpress_new_post_cursor')).toBe(true);
    vendor.fault = undefined;
    advance(5);
    expect(await poll({ store })).toEqual([pending.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });

  it('F2 ordering: a failure inside the migration reads stores nothing and keeps lastPoll, so the next run migrates again', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(3);
    const pending = publish();
    advance(2);
    const { store, data } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    vendor.fault = (url) => (url.searchParams.get('per_page') === '1' && url.searchParams.get('orderby') === 'modified' ? wpError({ status: 500, code: 'internal_server_error' }) : undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(poll({ store })).rejects.toThrow();
    expect(data.has('wordpress_new_post_cursor')).toBe(false);
    expect(data.has('lastPoll')).toBe(true);
    vendor.fault = undefined;
    advance(5);
    expect(await poll({ store })).toEqual([pending.id]);
    expect(data.has('lastPoll')).toBe(false);
  });
});

describe('QA round 3: id listing, hold-back and the real-engine clock', () => {
  function dateListingRequests() {
    return vendor.requests.filter((url) => url.searchParams.get('orderby') === 'date' && url.searchParams.get('order') === 'asc').length;
  }

  it('QA-FIX: with a 5 ms engine store read before the poll, the date listing still reads at least one page', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    vendor.storeLatencyMs = 5;
    advance(5);
    vendor.requests = [];
    await poll({ store });
    expect(dateListingRequests()).toBeGreaterThan(0);
  });

  it('QA-FIX: with real request latency the date listing reads more than one page of a 300-post window', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    for (let i = 0; i < 300; i++) {
      clock += 1000;
      publish();
    }
    vi.setSystemTime(clock);
    advance(1);
    vendor.msPerRequest = 200;
    vendor.requests = [];
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await poll({ store });
    expect(dateListingRequests()).toBeGreaterThan(1);
  });

  it('QA-FIX: an editor-scheduled post (modified = when it was scheduled) that WP-cron publishes fires once with a 5 ms store read', async () => {
    seedHistory();
    const scheduled = publish({ status: 'future', dateMs: clock + 20 * MIN });
    scheduled.modifiedMs = clock - 2 * 24 * HOUR;
    const { store } = memoryStore();
    await enable({ store });
    vendor.storeLatencyMs = 5;
    const fired: number[] = [];
    for (let i = 0; i < 10; i++) {
      advance(5);
      if (i === 3) {
        publish();
      }
      if (i === 5) {
        scheduled.status = 'publish';
      }
      fired.push(...(await poll({ store })));
    }
    expect(fired.filter((id) => id === scheduled.id)).toEqual([scheduled.id]);
  });

  it('QA-FIX: a flow upgraded from lastPoll keeps firing new posts with a 5 ms store read (hold-back must not freeze)', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(2);
    const { store } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    await republish({ store });
    vendor.storeLatencyMs = 5;
    const fresh: number[] = [];
    const fired: number[] = [];
    for (let i = 0; i < 6; i++) {
      advance(5);
      fresh.push(publish().id);
      advance(1);
      fired.push(...(await poll({ store })));
    }
    expect(fired).toEqual(fresh);
  });

  it('QA-FIX: 150 posts sharing one publish second inside the date window do not hold back later posts forever (200 ms/request)', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(2);
    const sameSecond = Math.floor(clock / 1000) * 1000;
    const batch = Array.from({ length: 150 }, () => publish({ dateMs: sameSecond }).id);
    advance(1);
    const later = publish();
    vendor.msPerRequest = 200;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 10; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect([...fired].sort((a, b) => a - b)).toEqual([...batch, later.id]);
  });

  it('one-request backdated post seen by the id listing and the date look-back fires once', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    const inWindow = publish({ dateMs: clock - 20 * MIN });
    const old = publish({ dateMs: clock - 9 * 24 * HOUR });
    advance(1);
    expect((await poll({ store })).sort((a, b) => a - b)).toEqual([inWindow.id, old.id]);
    for (let i = 0; i < 4; i++) {
      advance(5);
      expect(await poll({ store })).toEqual([]);
    }
  });

  it('id cursor resumes under the page cap while new posts keep arriving: every old-dated import fires once', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const imported = Array.from({ length: 2500 }, (_, i) => publish({ dateMs: Date.parse('2020-01-01T00:00:00Z') + i * 60_000 }).id);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fresh: number[] = [];
    const fired: number[] = [];
    for (let i = 0; i < 8; i++) {
      advance(5);
      fresh.push(publish().id, publish({ dateMs: clock - 5 * 24 * HOUR }).id);
      fired.push(...(await poll({ store })));
    }
    expect(new Set(fired).size).toBe(fired.length);
    expect([...fired].sort((a, b) => a - b)).toEqual([...imported, ...fresh].sort((a, b) => a - b));
  });

  it('id cursor stopped by the budget mid-listing resumes without skipping (14 s/request)', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const imported = Array.from({ length: 450 }, () => publish({ dateMs: clock - 30 * 24 * HOUR }).id);
    vendor.msPerRequest = 14_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 12; i++) {
      advance(5);
      const start = clock;
      fired.push(...(await poll({ store })));
      expect(clock - start).toBeLessThanOrEqual(45_000);
    }
    expect([...fired].sort((a, b) => a - b)).toEqual(imported);
  });

  it('trashed or never-published new ids do not fire; a draft published later (below the id cursor) fires once via the modified listing', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    advance(1);
    const trashed = publish();
    trashed.status = 'trash';
    const draft = publish({ status: 'draft', dateMs: clock - 4 * 24 * HOUR });
    const after = publish();
    advance(1);
    expect(await poll({ store })).toEqual([after.id]);
    advance(5);
    draft.status = 'publish';
    edit(draft);
    advance(1);
    expect(await poll({ store })).toEqual([draft.id]);
    advance(5);
    expect(await poll({ store })).toEqual([]);
  });
});

describe('QA round 4: real-engine timing, page-offset resume, migration on slow sites', () => {
  function seeded(seed: number) {
    let x = seed;
    return () => {
      x = (x * 1103515245 + 12345) % 2147483648;
      return x / 2147483648;
    };
  }

  async function timed({ store, authors }: { store: TestStore; authors?: string }) {
    const start = clock;
    const ids = await poll({ store, authors });
    return { ids, elapsedMs: clock - start };
  }

  it('100 ms store reads and 0.3–6 s requests: fresh, one-request backdated, editor-scheduled, old draft and upgrade-free paths each fire exactly once', async () => {
    seedHistory();
    const draft = publish({ status: 'draft', dateMs: clock - 10 * 24 * HOUR });
    const scheduled = publish({ status: 'future', dateMs: clock + 40 * MIN });
    scheduled.modifiedMs = clock - 24 * HOUR;
    const { store } = memoryStore();
    await enable({ store });
    const rand = seeded(7);
    vendor.storeLatencyMs = 100;
    vendor.latencyFn = () => 300 + Math.floor(rand() * 5700);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const expected: number[] = [];
    const fired: number[] = [];
    let maxElapsed = 0;
    for (let i = 0; i < 16; i++) {
      advance(5);
      expected.push(publish().id);
      if (i === 2) {
        expected.push(publish({ dateMs: clock - 3 * 24 * HOUR }).id);
      }
      if (i === 4) {
        draft.status = 'publish';
        draft.dateMs = clock;
        edit(draft);
        expected.push(draft.id);
      }
      if (i === 6) {
        edit(vendor.posts[0]);
        edit(vendor.posts[2]);
      }
      if (i === 9) {
        scheduled.status = 'publish';
        expected.push(scheduled.id);
      }
      const { ids, elapsedMs } = await timed({ store });
      maxElapsed = Math.max(maxElapsed, elapsedMs);
      fired.push(...ids);
    }
    vendor.latencyFn = undefined;
    for (let i = 0; i < 3; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(maxElapsed).toBeLessThanOrEqual(45_000);
    expect(new Set(fired).size).toBe(fired.length);
    expect([...fired].sort((a, b) => a - b)).toEqual([...expected].sort((a, b) => a - b));
  });

  it('lazy upgrade with 100 ms store reads and 1–3 s requests: pending fires once, already-sent never, later posts fire', async () => {
    seedHistory();
    advance(10);
    const sent = publish();
    const legacyLastPoll = legacyEpoch(sent);
    advance(3);
    const pending = publish();
    advance(2);
    const { store, data } = memoryStore();
    await store.put('lastPoll', legacyLastPoll);
    const rand = seeded(11);
    vendor.storeLatencyMs = 100;
    vendor.latencyFn = () => 1000 + Math.floor(rand() * 2000);
    const fired: number[] = [];
    const expected = [pending.id];
    for (let i = 0; i < 6; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
      expected.push(publish().id);
    }
    advance(5);
    fired.push(...(await poll({ store })));
    expect(data.has('lastPoll')).toBe(false);
    expect([...fired].sort((a, b) => a - b)).toEqual(expected);
  });

  it('random 0.1–15 s requests with 100 ms store reads: no run exceeds 60 s (fake measures request time only)', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    for (let i = 0; i < 1500; i++) {
      clock += 1000;
      publish();
    }
    vi.setSystemTime(clock);
    const rand = seeded(3);
    vendor.storeLatencyMs = 100;
    vendor.latencyFn = () => 100 + Math.floor(rand() * 14_900);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let maxElapsed = 0;
    for (let i = 0; i < 40; i++) {
      advance(5);
      const { elapsedMs } = await timed({ store });
      maxElapsed = Math.max(maxElapsed, elapsedMs);
    }
    expect(maxElapsed).toBeLessThanOrEqual(60_000);
  });

  it('worst case: fast requests then one 15 s request started at the last allowed moment stays within 60 s', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    for (let i = 0; i < 3000; i++) {
      clock += 1000;
      publish({ dateMs: clock - 400 * 24 * HOUR });
    }
    vi.setSystemTime(clock);
    advance(5);
    let n = 0;
    const startedAt = { value: 0 };
    vendor.latencyFn = () => {
      n++;
      return clock - startedAt.value > 40_000 ? 15_000 : 1_900;
    };
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    startedAt.value = clock;
    const { elapsedMs } = await timed({ store });
    expect(n).toBeGreaterThan(3);
    expect(elapsedMs).toBeLessThanOrEqual(60_000);
  });

  it.fails('KNOWN LIMIT (page-offset resume): trashing already-fired imports mid id-scan skips the same number of unread imports', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const imported = Array.from({ length: 600 }, (_, i) => publish({ dateMs: Date.parse('2019-01-01T00:00:00Z') + i * 60_000 }));
    vendor.msPerRequest = 8_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    const trashed = new Set<number>();
    for (let i = 0; i < 12; i++) {
      advance(5);
      const ids = await poll({ store });
      fired.push(...ids);
      for (const id of ids.slice(-30)) {
        const post = imported.find((p) => p.id === id);
        if (post) {
          post.status = 'trash';
          trashed.add(id);
        }
      }
    }
    vendor.msPerRequest = 0;
    for (let i = 0; i < 3; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(new Set(fired).size).toBe(fired.length);
    expect([...fired].sort((a, b) => a - b)).toEqual(imported.map((p) => p.id));
  });

  it('page-offset resume of the date listing while new posts publish between polls: no skip, no duplicate', async () => {
    seedHistory();
    const { store } = memoryStore();
    await enable({ store });
    const expected: number[] = [];
    for (let i = 0; i < 900; i++) {
      clock += 1000;
      expected.push(publish().id);
    }
    vi.setSystemTime(clock);
    vendor.msPerRequest = 8_000;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fired: number[] = [];
    for (let i = 0; i < 12; i++) {
      advance(5);
      for (let j = 0; j < 40; j++) {
        clock += 1000;
        expected.push(publish().id);
      }
      expected.push(publish({ dateMs: clock - 30 * MIN }).id);
      vi.setSystemTime(clock);
      fired.push(...(await poll({ store })));
    }
    vendor.msPerRequest = 0;
    for (let i = 0; i < 4; i++) {
      advance(5);
      fired.push(...(await poll({ store })));
    }
    expect(new Set(fired).size).toBe(fired.length);
    expect([...fired].sort((a, b) => a - b)).toEqual([...expected].sort((a, b) => a - b));
  });

  for (const [label, perRequest, windowPosts] of [
    ['10 s/request, small window', 10_000, 20],
    ['6 s/request, 350 posts in the 14 h window', 6_000, 350],
  ] as const) {
    it(`QA-FIX: lazy upgrade on a slow site (${label}) is not deferred forever (baseline modelled as concurrent)`, async () => {
      seedHistory();
      for (let i = 0; i < windowPosts; i++) {
        clock += 60_000;
        publish();
      }
      vi.setSystemTime(clock);
      const legacyLastPoll = legacyEpoch(vendor.posts[vendor.posts.length - 1]);
      advance(5);
      const { store, data } = memoryStore();
      await store.put('lastPoll', legacyLastPoll);
      vendor.storeLatencyMs = 100;
      vendor.latencyFn = (url) => (url.searchParams.get('per_page') === '1' && url.searchParams.get('orderby') !== 'id' ? 0 : perRequest);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fired: number[] = [];
      let fresh = 0;
      for (let i = 0; i < 8; i++) {
        advance(5);
        if (i === 4) {
          fresh = publish().id;
        }
        fired.push(...(await poll({ store })));
      }
      expect(data.has('wordpress_new_post_cursor')).toBe(true);
      expect(fired).toContain(fresh);
    });
  }
});
