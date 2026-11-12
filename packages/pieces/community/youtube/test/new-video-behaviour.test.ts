import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { youtubeNewVideoTrigger } from '../src/lib/triggers/new-video.trigger';

const CHANNEL_A = 'UCaaaaaaaaaaaaaaaaaaaaaa';
const CHANNEL_B = 'UCbbbbbbbbbbbbbbbbbbbbbb';
const HANDLES: Record<string, string> = { '@chanA': CHANNEL_A, '@chanB': CHANNEL_B };

type Video = { id: string; publishedAt: number };

const vendor: { channels: Map<string, Video[]>; omitted: Set<string>; feedRequests: string[] } = {
  channels: new Map(),
  omitted: new Set(),
  feedRequests: [],
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

function upload({ channel, id }: { channel: string; id: string }) {
  clock += 60_000;
  const videos = vendor.channels.get(channel) ?? [];
  videos.push({ id, publishedAt: clock });
  vendor.channels.set(channel, videos);
}

function removeVideo({ channel, id }: { channel: string; id: string }) {
  const videos = vendor.channels.get(channel) ?? [];
  vendor.channels.set(
    channel,
    videos.filter((video) => video.id !== id),
  );
}

function seedChannel({ channel, prefix, count }: { channel: string; prefix: string; count: number }) {
  for (let index = 0; index < count; index++) {
    upload({ channel, id: `${prefix}${index}` });
  }
}

function feedXml(channel: string): string {
  const entries = [...(vendor.channels.get(channel) ?? [])]
    .filter((video) => !vendor.omitted.has(video.id))
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 15)
    .map((video) => {
      const published = new Date(video.publishedAt).toISOString();
      return `<entry><id>yt:video:${video.id}</id><yt:videoId>${video.id}</yt:videoId><yt:channelId>${channel}</yt:channelId><title>${video.id}</title><link rel="alternate" href="https://www.youtube.com/watch?v=${video.id}"/><author><name>Chan</name><uri>https://www.youtube.com/channel/${channel}</uri></author><published>${published}</published><updated>${published}</updated><media:group><media:title>${video.id}</media:title><media:content url="https://www.youtube.com/v/${video.id}?version=3" type="application/x-shockwave-flash" width="640" height="390"/><media:thumbnail url="https://i4.ytimg.com/vi/${video.id}/hqdefault.jpg" width="480" height="360"/><media:description></media:description><media:community><media:starRating count="0" average="0.00" min="1" max="5"/><media:statistics views="1"/></media:community></media:group></entry>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom"><link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=${channel}"/><id>yt:channel:${channel}</id><yt:channelId>${channel}</yt:channelId><title>Chan</title><author><name>Chan</name><uri>https://www.youtube.com/channel/${channel}</uri></author><published>2020-01-01T00:00:00+00:00</published>${entries}</feed>`;
}

function fakeYouTube(input: string | URL | Request): Response {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.pathname === '/feeds/videos.xml') {
    const channel = url.searchParams.get('channel_id') ?? '';
    vendor.feedRequests.push(channel);
    if (!vendor.channels.has(channel)) {
      return new Response('', { status: 404 });
    }
    return new Response(feedXml(channel), { status: 200, headers: { 'content-type': 'text/xml' } });
  }
  const handleChannel = HANDLES[decodeURIComponent(url.pathname.slice(1))];
  if (handleChannel) {
    return new Response(
      `<html><head><link rel="canonical" href="https://www.youtube.com/channel/${handleChannel}"></head></html>`,
      { status: 200, headers: { 'content-type': 'text/html' } },
    );
  }
  return new Response('not found', { status: 404 });
}

function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, cloneJson(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? cloneJson(data.get(key)) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}

function cloneJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

const trigger = pollingTrigger();

function pollingTrigger() {
  if (youtubeNewVideoTrigger.type !== TriggerStrategy.POLLING) {
    throw new Error('expected a polling trigger');
  }
  return youtubeNewVideoTrigger;
}

function hookContext({ store, channel = CHANNEL_A, isRepublish }: { store: Store; channel?: string; isRepublish?: boolean }) {
  return {
    ...createMockPollingTriggerContext<typeof trigger.props>({ propsValue: { channel_identifier: channel } }),
    auth: undefined,
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

const ids = (events: unknown[]) => events.map((event) => String(field({ event, key: 'guid' })).replace('yt:video:', ''));

function seenIds({ data }: { data: Map<string, unknown> }): string[] {
  const value = data.get('_seenVideoIds');
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) {
    throw new Error('no seen ids');
  }
  return value;
}

function sampleDataKeys(): string[] {
  const sample: unknown = trigger.sampleData;
  if (typeof sample !== 'object' || sample === null) {
    throw new Error('no sample data');
  }
  return Object.keys(sample);
}

async function republish({ store, from = CHANNEL_A, to = from }: { store: Store; from?: string; to?: string }) {
  const isRepublish = from === to;
  await trigger.onDisable(hookContext({ store, channel: from, isRepublish }));
  await trigger.onEnable(hookContext({ store, channel: to, isRepublish }));
}

beforeEach(() => {
  vendor.channels = new Map();
  vendor.omitted.clear();
  vendor.feedRequests = [];
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => fakeYouTube(input)));
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('YouTube New Video behaviour', () => {
  it('fires once per upload across polls, deletes and a republish', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'old', count: 20 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    expect(await trigger.run(hookContext({ store }))).toEqual([]);

    upload({ channel: CHANNEL_A, id: 'new1' });
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new1']);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);

    removeVideo({ channel: CHANNEL_A, id: 'new1' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);

    await republish({ store });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);

    upload({ channel: CHANNEL_A, id: 'new2' });
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new2']);
  });

  it('does not re-fire a video that the feed briefly leaves out', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'v', count: 5 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    vendor.omitted.add('v2');
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    vendor.omitted.clear();
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('remembers videos that left the 15-entry feed long ago, up to the cap', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'old', count: 15 });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    for (let index = 0; index < 40; index++) {
      upload({ channel: CHANNEL_A, id: `burst${index}` });
      expect(ids(await trigger.run(hookContext({ store })))).toEqual([`burst${index}`]);
    }
    for (let index = 39; index >= 15; index--) {
      removeVideo({ channel: CHANNEL_A, id: `burst${index}` });
    }
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(seenIds({ data }).length).toBeLessThanOrEqual(300);
  });

  it('keeps the seen list bounded', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'v', count: 15 });
    const { store, data } = memoryStore({ channelId: CHANNEL_A, _seenVideoIds: Array.from({ length: 400 }, (_, index) => `yt:video:ancient${index}`) });
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    await trigger.run(hookContext({ store }));
    const seen = seenIds({ data });
    expect(seen).toHaveLength(300);
    expect(seen.slice(0, 15)).toEqual(Array.from({ length: 15 }, (_, index) => `yt:video:v${14 - index}`));
  });

  it('follows a channel edit A to B without flooding B back catalogue', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 5 });
    seedChannel({ channel: CHANNEL_B, prefix: 'b', count: 15 });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    await republish({ store, from: CHANNEL_A, to: CHANNEL_B });
    expect(await trigger.run(hookContext({ store, channel: CHANNEL_B }))).toEqual([]);
    expect(vendor.feedRequests.at(-1)).toBe(CHANNEL_B);

    upload({ channel: CHANNEL_A, id: 'aNew' });
    upload({ channel: CHANNEL_B, id: 'bNew' });
    expect(ids(await trigger.run(hookContext({ store, channel: CHANNEL_B })))).toEqual(['bNew']);
    expect(await trigger.run(hookContext({ store, channel: CHANNEL_B }))).toEqual([]);
    expect(data.get('_channel')).toEqual({ identifier: CHANNEL_B, channelId: CHANNEL_B });
  });

  it('re-baselines when run sees a new channel setting without onEnable', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 5 });
    seedChannel({ channel: CHANNEL_B, prefix: 'b', count: 15 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    expect(await trigger.run(hookContext({ store, channel: CHANNEL_B }))).toEqual([]);
    upload({ channel: CHANNEL_B, id: 'bNew' });
    expect(ids(await trigger.run(hookContext({ store, channel: CHANNEL_B })))).toEqual(['bNew']);
  });

  it('keeps the seen list when run sees a new setting that resolves to the same channel', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 5 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    upload({ channel: CHANNEL_A, id: 'aNew' });
    expect(ids(await trigger.run(hookContext({ store, channel: '@chanA' })))).toEqual(['aNew']);
    expect(await trigger.run(hookContext({ store, channel: `https://www.youtube.com/channel/${CHANNEL_A}` }))).toEqual([]);
  });

  it('starts a fresh baseline when the channel setting is edited to another form of the same channel', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 5 });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    await republish({ store, from: CHANNEL_A, to: '@chanA' });
    expect(data.get('_channel')).toEqual({ identifier: '@chanA', channelId: CHANNEL_A });
    expect(await trigger.run(hookContext({ store, channel: '@chanA' }))).toEqual([]);
    upload({ channel: CHANNEL_A, id: 'aNew' });
    expect(ids(await trigger.run(hookContext({ store, channel: '@chanA' })))).toEqual(['aNew']);
    expect(await trigger.run(hookContext({ store, channel: '@chanA' }))).toEqual([]);
  });

  it('test() uses the current channel setting and returns the newest videos oldest to newest, newest last', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 3 });
    seedChannel({ channel: CHANNEL_B, prefix: 'b', count: 8 });
    const { store } = memoryStore();
    expect(ids(await trigger.test(hookContext({ store, channel: CHANNEL_A })))).toEqual(['a0', 'a1', 'a2']);
    expect(ids(await trigger.test(hookContext({ store, channel: '@chanB' })))).toEqual(['b3', 'b4', 'b5', 'b6', 'b7']);
  });

  it('does not re-fire after upgrading from the old stored state', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 15 });
    const { store, data } = memoryStore({
      channelId: CHANNEL_A,
      _seenVideoIds: Array.from({ length: 15 }, (_, index) => `yt:video:a${index}`),
    });
    const legacyIdentifier = `https://www.youtube.com/channel/${CHANNEL_A}`;
    expect(await trigger.run(hookContext({ store, channel: legacyIdentifier }))).toEqual([]);
    upload({ channel: CHANNEL_A, id: 'aNew' });
    expect(ids(await trigger.run(hookContext({ store, channel: legacyIdentifier })))).toEqual(['aNew']);
    expect(data.has('channelId')).toBe(false);
    expect(data.get('_channel')).toEqual({ identifier: legacyIdentifier, channelId: CHANNEL_A });
  });

  it('does not re-fire on a republish right after the upgrade', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 15 });
    const { store } = memoryStore({
      channelId: CHANNEL_A,
      _seenVideoIds: Array.from({ length: 15 }, (_, index) => `yt:video:a${index}`),
    });
    await republish({ store, from: '@chanA' });
    expect(await trigger.run(hookContext({ store, channel: '@chanA' }))).toEqual([]);
  });

  it('clears every key on a real disable and none on a republish', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 2 });
    const { store, data } = memoryStore({ channelId: CHANNEL_A });
    await trigger.onEnable(hookContext({ store }));
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    expect([...data.keys()].sort()).toEqual(['_channel', '_seenVideoIds']);
    await trigger.onDisable(hookContext({ store }));
    expect(data.size).toBe(0);
  });

  it('every sampleData key exists in a real run item', async () => {
    seedChannel({ channel: CHANNEL_A, prefix: 'a', count: 2 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    upload({ channel: CHANNEL_A, id: 'real' });
    const [real] = await trigger.run(hookContext({ store }));
    for (const key of sampleDataKeys()) {
      expect(real).toHaveProperty([key]);
    }
  });
});
