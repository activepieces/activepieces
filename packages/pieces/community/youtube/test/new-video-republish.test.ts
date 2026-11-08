/// <reference types="vitest/globals" />

import { Store } from '@activepieces/pieces-framework';

const feedVideos: string[] = [];
const sendRequestMock = vi.fn(async () => ({ status: 200, headers: {}, body: Buffer.from(atomFeed(feedVideos)) }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: () => sendRequestMock() } };
});

import { youtubeNewVideoTrigger } from '../src/lib/triggers/new-video.trigger';

describe('youtubeNewVideoTrigger republish', () => {
  beforeEach(() => {
    feedVideos.length = 0;
  });

  it('fires the first video of an empty channel even when it arrives just before a republish', async () => {
    const { store } = memoryStore({ channelId: 'UC123' });
    await youtubeNewVideoTrigger.onEnable(hookContext({ store }));

    feedVideos.push('yt:video:first');
    await youtubeNewVideoTrigger.onDisable(hookContext({ store, isRepublish: true }));
    await youtubeNewVideoTrigger.onEnable(hookContext({ store, isRepublish: true }));

    const emitted = await youtubeNewVideoTrigger.run(hookContext({ store }));
    expect(emitted).toHaveLength(1);
  });

  it('does not re-emit videos that were in the feed when the trigger was enabled', async () => {
    feedVideos.push('yt:video:old');
    const { store } = memoryStore({ channelId: 'UC123' });
    await youtubeNewVideoTrigger.onEnable(hookContext({ store }));

    expect(await youtubeNewVideoTrigger.run(hookContext({ store }))).toEqual([]);
  });
});

function atomFeed(videoIds: string[]): string {
  const entries = videoIds
    .map((id) => `<entry><id>${id}</id><title>${id}</title><link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/><published>2026-10-01T00:00:00+00:00</published></entry>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>channel</title><id>yt:channel:UC123</id>${entries}</feed>`;
}

function hookContext({ store, isRepublish }: { store: Store; isRepublish?: boolean }): Parameters<typeof youtubeNewVideoTrigger.run>[0] {
  return {
    store,
    isRepublish,
    auth: undefined,
    propsValue: { channel_identifier: 'https://www.youtube.com/channel/UC123' },
    files: {},
  } as unknown as Parameters<typeof youtubeNewVideoTrigger.run>[0];
}

function memoryStore(initial: Record<string, unknown>): { store: Store; data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(initial));
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.get(key) as T) ?? null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}
