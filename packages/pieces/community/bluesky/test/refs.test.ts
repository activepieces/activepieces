import { describe, expect, it } from 'vitest';
import { blueskyRefs } from '../src/lib/common/refs';
import { blueskyCompose } from '../src/lib/common/compose';
import { blueskyClient } from '../src/lib/common/client';
import { blueskyPolling, PollItem, PollStore } from '../src/lib/common/polling';
import { blueskyProps } from '../src/lib/common/props';

const PLC = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa';

describe('post and actor references', () => {
  it('accepts bsky.app links with a handle or a DID and at:// URIs with did:plc, did:web or a handle', () => {
    expect(blueskyRefs.parsePostInput('https://bsky.app/profile/Alice.BSKY.social/post/3kabc?x=1')).toEqual({ repo: 'alice.bsky.social', rkey: '3kabc' });
    expect(blueskyRefs.parsePostInput(`https://bsky.app/profile/${PLC}/post/3kabc`)).toEqual({ repo: PLC, rkey: '3kabc' });
    expect(blueskyRefs.parsePostInput('at://did:web:example.com/app.bsky.feed.post/3kabc')).toEqual({ repo: 'did:web:example.com', rkey: '3kabc' });
    expect(blueskyRefs.parsePostInput('bsky.app/profile/alice.bsky.social/post/3kabc')).toEqual({ repo: 'alice.bsky.social', rkey: '3kabc' });
  });

  it('rejects other hosts, other collections and malformed ids', () => {
    expect(() => blueskyRefs.parsePostInput('https://evil.example/profile/alice.bsky.social/post/3kabc')).toThrow(/not a post link/);
    expect(() => blueskyRefs.parsePostInput(`at://${PLC}/app.bsky.feed.like/3kabc`)).toThrow(/AT-URI/);
    expect(() => blueskyRefs.parsePostInput('https://bsky.app/profile/alice/post/3kabc')).toThrow(/handle/);
    expect(() => blueskyRefs.parsePostInput('')).toThrow(/empty/);
  });

  it('normalises actor input: @handle, bare names, DIDs and profile links', () => {
    expect(blueskyRefs.parseActorInput('@Alice.bsky.social')).toBe('alice.bsky.social');
    expect(blueskyRefs.parseActorInput('alice')).toBe('alice.bsky.social');
    expect(blueskyRefs.parseActorInput(PLC)).toBe(PLC);
    expect(blueskyRefs.parseActorInput('https://bsky.app/profile/bsky.app')).toBe('bsky.app');
    expect(() => blueskyRefs.parseActorInput('https://x.com/profile/bsky.app')).toThrow(/profile link/);
  });

  it('parses list links and builds web links', () => {
    expect(blueskyRefs.parseListInput('https://bsky.app/profile/alice.bsky.social/lists/3lst')).toEqual({ repo: 'alice.bsky.social', rkey: '3lst' });
    expect(blueskyRefs.postWebUrl({ uri: `at://${PLC}/app.bsky.feed.post/3kabc`, handle: 'alice.bsky.social' })).toBe('https://bsky.app/profile/alice.bsky.social/post/3kabc');
    expect(blueskyRefs.postWebUrl({ uri: `at://${PLC}/app.bsky.feed.post/3kabc`, handle: 'handle.invalid' })).toBe(`https://bsky.app/profile/${PLC}/post/3kabc`);
    expect(blueskyRefs.postWebUrl({ uri: `at://${PLC}/app.bsky.graph.list/3lst` })).toContain('/lists/3lst');
  });
});

describe('post composition rules', () => {
  it('counts graphemes, not UTF-8 bytes (200 Japanese characters fit in a post)', () => {
    const japanese = 'あ'.repeat(200);
    expect(blueskyCompose.graphemeLength(japanese)).toBe(200);
    expect(() => blueskyCompose.assertPostLength({ text: japanese, label: 'Text' })).not.toThrow();
    expect(() => blueskyCompose.assertPostLength({ text: '👍'.repeat(301), label: 'Text' })).toThrow(/301 characters/);
  });

  it('maps the old content-warning values to real Bluesky self-labels', () => {
    expect(blueskyCompose.mapContentWarnings(['adult', 'violence', 'sensitive', 'spam', 'nudity', 'adult'])).toEqual(['porn', 'graphic-media', 'sexual', 'nudity']);
    expect(blueskyCompose.selfLabels([])).toBeUndefined();
    expect(blueskyCompose.selfLabels(['porn', 'bogus'])).toEqual({ $type: 'com.atproto.label.defs#selfLabels', values: [{ val: 'porn' }] });
  });

  it('limits tags to 8 and languages to 3', () => {
    expect(blueskyCompose.normalizeTags(['#a, b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(() => blueskyCompose.normalizeTags(['1,2,3,4,5,6,7,8,9'])).toThrow(/at most 8/);
    expect(() => blueskyCompose.normalizeLangs(['en', 'de', 'fr', 'ja'])).toThrow(/at most 3/);
  });

  it('reads Open Graph tags in any attribute order', () => {
    const html = '<meta content="Card Title" property="og:title"><meta property=\'og:description\' content=\'Desc &amp; more\'><meta name="description" content="ignored">';
    const tags = blueskyCompose.metaTags(html);
    expect(tags['og:title']).toBe('Card Title');
    expect(tags['og:description']).toBe('Desc & more');
  });

  it('stays fast on a hostile page', () => {
    const started = Date.now();
    blueskyCompose.metaTags('<meta ' + 'a="b" '.repeat(50000));
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('sniffs image types from magic bytes', () => {
    expect(blueskyCompose.sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe('image/png');
    expect(blueskyCompose.sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(blueskyCompose.sniffImageType(new Uint8Array([1, 2, 3]))).toBeUndefined();
  });
});

describe('connection host', () => {
  it('normalises the PDS host once for validate and the client', () => {
    expect(blueskyClient.normalizePdsHost(undefined)).toBe('https://bsky.social');
    expect(blueskyClient.normalizePdsHost(' bsky.social/ ')).toBe('https://bsky.social');
    expect(blueskyClient.normalizePdsHost('https://pds.example.com:8443/xrpc')).toBe('https://pds.example.com:8443');
    expect(() => blueskyClient.normalizePdsHost('https://user:pw@pds.example.com')).toThrow(/username/);
  });

  it('keeps custom API calls on the PDS host', () => {
    expect(() => blueskyClient.assertSameOrigin({ url: '/app.bsky.actor.getProfile', pdsHost: 'https://bsky.social' })).not.toThrow();
    expect(() => blueskyClient.assertSameOrigin({ url: 'https://bsky.social/xrpc/x', pdsHost: 'https://bsky.social' })).not.toThrow();
    expect(() => blueskyClient.assertSameOrigin({ url: 'https://bsky.social.evil.io/xrpc/x', pdsHost: 'https://bsky.social' })).toThrow(/PDS host/);
    expect(() => blueskyClient.assertSameOrigin({ url: '//evil.io/xrpc/x', pdsHost: 'https://bsky.social' })).toThrow();
    expect(() => blueskyClient.assertSameOrigin({ url: 'https://user@bsky.social/xrpc/x', pdsHost: 'https://bsky.social' })).toThrow(/PDS host/);
  });
});

describe('paging inputs', () => {
  it('validates limit and cursor', () => {
    expect(blueskyProps.parseLimit(undefined)).toBe(25);
    expect(blueskyProps.parseLimit('50')).toBe(50);
    expect(() => blueskyProps.parseLimit(0)).toThrow(/between 1 and 100/);
    expect(() => blueskyProps.parseLimit(101)).toThrow(/between 1 and 100/);
    expect(blueskyProps.parseCursor('  ')).toBeUndefined();
  });
});

describe('polling helper', () => {
  function memoryStore(): PollStore & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
      data,
      get: async <V>(key: string): Promise<V | null> => {
        const raw = data.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      put: async <V>(key: string, value: V) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    };
  }
  const item = ({ key, time }: { key: string; time: number }): PollItem<string> => ({ key, time, data: key });
  const pageOf = ({ items, cursor }: { items: PollItem<string>[]; cursor?: string }) => ({ items, cursor, ...blueskyPolling.pageTimes(items.map((i) => i.time)) });

  it('seeds on enable, then emits only unseen items newest first and never twice', async () => {
    const store = memoryStore();
    let feed = [item({ key: 'b', time: 2000 }), item({ key: 'a', time: 1000 })];
    const fetchPage = async () => pageOf({ items: feed });
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage });
    expect(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage })).toEqual([]);
    feed = [item({ key: 'd', time: 4000 }), item({ key: 'c', time: 3000 }), ...feed];
    expect(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage })).toEqual(['d', 'c']);
    expect(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage })).toEqual([]);
  });

  it('pages back past one page when many items arrived, up to the page cap', async () => {
    const store = memoryStore();
    await store.put('k', { seen: ['old'], lastTime: 1000 });
    const pages: Record<string, ReturnType<typeof pageOf>> = {
      first: pageOf({ items: [item({ key: 'n4', time: 5000 }), item({ key: 'n3', time: 4000 })], cursor: 'p2' }),
      p2: pageOf({ items: [item({ key: 'n2', time: 3000 }), item({ key: 'n1', time: 2000 })], cursor: 'p3' }),
      p3: pageOf({ items: [item({ key: 'old', time: 1000 })], cursor: 'p4' }),
    };
    const fetched: string[] = [];
    const fetchPage = async ({ cursor }: { cursor: string | undefined }) => {
      fetched.push(cursor ?? 'first');
      return pages[cursor ?? 'first'];
    };
    expect(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage })).toEqual(['n4', 'n3', 'n2', 'n1']);
    expect(fetched).toEqual(['first', 'p2', 'p3']);
  });

  it('keeps the seen set bounded and keeps state on republish', async () => {
    const store = memoryStore();
    const many = Array.from({ length: 700 }, (_, i) => item({ key: `k${i}`, time: 10_000 - i }));
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: async () => pageOf({ items: many }) });
    const state = await store.get<{ seen: string[] }>('k');
    expect(state?.seen.length).toBe(blueskyPolling.SEEN_CAP);
    await blueskyPolling.onEnable({ store, storeKey: 'k', fetchPage: async () => pageOf({ items: [item({ key: 'new', time: 20_000 })] }), isRepublish: true });
    expect((await store.get<{ seen: string[] }>('k'))?.seen.length).toBe(blueskyPolling.SEEN_CAP);
  });

  it('reseeds instead of flooding when the stored state is from the old pollingHelper', async () => {
    const store = memoryStore();
    await store.put('k', { lastPoll: 123 });
    expect(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: async () => pageOf({ items: [item({ key: 'x', time: 5 })] }) })).toEqual([]);
    expect(await blueskyPolling.poll({ store, storeKey: 'k', fetchPage: async () => pageOf({ items: [item({ key: 'y', time: 6 }), item({ key: 'x', time: 5 })] }) })).toEqual(['y']);
  });
});
