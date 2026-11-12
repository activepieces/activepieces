import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, createMockPollingTriggerContext, TriggerStrategy } from '@activepieces/pieces-framework';
import * as http from 'http';
import { wordpress } from '../src';
import type { wordpressAuth } from '../src';
import { wordpressNewPost } from '../src/lib/trigger/new-post.trigger';

type Post = { id: number; gmtMs: number };

function wall(ms: number) {
  return new Date(ms).toISOString().slice(0, 19);
}

async function startFakeWordPress({ siteOffsetMinutes, posts }: { siteOffsetMinutes: number; posts: Post[] }) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/wp-json/wp/v2/posts') { res.statusCode = 404; res.end('{}'); return; }
    const parse = (v: string | null) => (v === null ? undefined : (/[zZ]|[+-]\d{2}:?\d{2}$/.test(v) ? Date.parse(v) : Date.parse(v + 'Z') - siteOffsetMinutes * 60000));
    const after = parse(url.searchParams.get('after'));
    const before = parse(url.searchParams.get('before'));
    const modifiedAfter = parse(url.searchParams.get('modified_after'));
    const perPage = Math.min(Number(url.searchParams.get('per_page') ?? 10), 100);
    const page = Number(url.searchParams.get('page') ?? 1);
    const orderby = url.searchParams.get('orderby') ?? 'date';
    const direction = url.searchParams.get('order') === 'asc' ? 1 : -1;
    const key = (p: Post) => (orderby === 'id' ? p.id : p.gmtMs);
    const matching = posts
      .filter(() => (url.searchParams.get('status') ?? 'publish').split(',').includes('publish'))
      .filter(((ids: Set<number> | null) => (p: { id: number }) => ids === null || ids.has(p.id))(url.searchParams.get('include') ? new Set(url.searchParams.get('include')!.split(',').map(Number)) : null))
      .filter((p) => (after === undefined || p.gmtMs > after) && (before === undefined || p.gmtMs < before))
      .filter((p) => modifiedAfter === undefined || p.gmtMs > modifiedAfter)
      .sort((a, b) => direction * (key(a) - key(b) || a.id - b.id));
    const totalPages = Math.ceil(matching.length / perPage);
    res.setHeader('content-type', 'application/json');
    if (page > 1 && page > totalPages) {
      res.statusCode = 400;
      res.end(JSON.stringify({ code: 'rest_post_invalid_page_number', message: 'The page number requested is larger than the number of pages available.', data: { status: 400 } }));
      return;
    }
    const body = matching.slice((page - 1) * perPage, page * perPage).map((p) => ({
      id: p.id,
      date: wall(p.gmtMs + siteOffsetMinutes * 60000),
      date_gmt: wall(p.gmtMs),
      modified: wall(p.gmtMs + siteOffsetMinutes * 60000),
      modified_gmt: wall(p.gmtMs),
      status: 'publish',
      type: 'post',
      title: { rendered: `Post ${p.id}` },
    }));
    res.setHeader('x-wp-total', String(matching.length));
    res.setHeader('x-wp-totalpages', String(totalPages));
    res.end(JSON.stringify(body));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('fake WordPress did not bind a port');
  }
  return { url: `http://127.0.0.1:${address.port}`, close: () => server.close() };
}

function memoryStore() {
  const m = new Map<string, string>();
  return {
    async put<T>(k: string, v: T) { m.set(k, JSON.stringify(v)); return v; },
    async get<T>(k: string): Promise<T | null> { const raw = m.get(k); return raw === undefined ? null : JSON.parse(raw); },
    async delete(k: string) { m.delete(k); },
  };
}

function idOf(event: unknown): number {
  if (typeof event !== 'object' || event === null || !('id' in event) || typeof event.id !== 'number') {
    throw new Error('event has no numeric id');
  }
  return event.id;
}

let close: (() => void) | undefined;
afterEach(() => { vi.useRealTimers(); close?.(); });

const at = (hhmm: string) => Date.parse(`2026-10-01T${hhmm}:00Z`);

async function runTimeline(siteOffsetMinutes: number) {
  const posts: Post[] = [];
  const wp = await startFakeWordPress({ siteOffsetMinutes, posts });
  close = wp.close;
  vi.useFakeTimers({ toFake: ['Date'] });
  const store = memoryStore();
  const auth: AppConnectionValueForAuthProperty<typeof wordpressAuth> = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { website_url: wp.url, username: 'u', password: 'p' },
  };
  const ctx = {
    ...createMockPollingTriggerContext<typeof wordpressNewPost.props>({ propsValue: { authors: undefined } }),
    auth,
    store,
    files: createMockActionContext({ propsValue: {} }).files,
  };
  vi.setSystemTime(at('09:00'));
  await newPostTrigger.onEnable(ctx);
  const publish: Record<string, Post> = { '09:30': { id: 1, gmtMs: at('09:30') }, '10:00': { id: 2, gmtMs: at('10:00') }, '15:00': { id: 3, gmtMs: at('15:00') } };
  const fired: number[] = [];
  for (const pollAt of ['09:35', '10:05', '12:05', '15:05', '18:05']) {
    for (const [t, p] of Object.entries(publish)) {
      if (at(t) <= at(pollAt) && !posts.includes(p)) posts.push(p);
    }
    vi.setSystemTime(at(pollAt));
    const out = await newPostTrigger.run(ctx);
    fired.push(...out.map(idOf));
  }
  return fired;
}

const newPostTrigger = pollingTrigger();

function pollingTrigger() {
  if (wordpressNewPost.type !== TriggerStrategy.POLLING) {
    throw new Error('expected a polling trigger');
  }
  return wordpressNewPost;
}

describe('PIE-995 WordPress New Post on non-UTC sites', () => {
  it('piece registers the trigger', () => {
    expect(wordpress.getTrigger('new_post')).toBe(wordpressNewPost);
  });

  it('control: site on UTC fires every post once', async () => {
    expect(await runTimeline(0)).toEqual([1, 2, 3]);
  });

  it('site east of UTC (UTC+3) fires every post once', async () => {
    expect(await runTimeline(180)).toEqual([1, 2, 3]);
  });

  it('site west of UTC (UTC-5) fires every post once', async () => {
    expect(await runTimeline(-300)).toEqual([1, 2, 3]);
  });
});
