import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { banUser } from '../src/lib/actions/ban-user';
import { updateChatSettings } from '../src/lib/actions/update-chat-settings';
import { getChannelSchedule } from '../src/lib/actions/get-channel-schedule';
import { checkUserSubscription } from '../src/lib/actions/check-user-subscription';
import { getChatters } from '../src/lib/actions/get-chatters';
import { getGames } from '../src/lib/actions/get-games';
import { getPolls } from '../src/lib/actions/get-polls';
import { sendShoutout } from '../src/lib/actions/send-shoutout';
import { getStreamMarkers } from '../src/lib/actions/get-stream-markers';
import { streamStarted } from '../src/lib/triggers/stream-started';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { twitchCommon } from '../src/lib/common';
describe('twitchCommon.normalizeLogin', () => {
  it.each([
    ['loltyler1', 'loltyler1'],
    ['  LolTyler1 ', 'loltyler1'],
    ['@faker', 'faker'],
    ['https://twitch.tv/faker', 'faker'],
    ['https://www.twitch.tv/faker/', 'faker'],
    ['twitch.tv/faker?sr=a', 'faker'],
    ['https://www.twitch.tv/faker/videos', 'faker'],
    ['', ''],
    ['   ', ''],
    ['https://twitch.tv/', ''],
    ['bad login!', ''],
  ])('%s -> %s', (input, expected) => {
    expect(twitchCommon.normalizeLogin(input)).toBe(expected);
  });
});

describe('twitchCommon.normalizeLogins', () => {
  it('drops blanks, invalid entries and duplicates', () => {
    expect(
      twitchCommon.normalizeLogins(['Faker', 'https://twitch.tv/faker/', '', 'https://twitch.tv/', 42, 'shroud'])
    ).toEqual(['faker', 'shroud']);
  });
});

describe('twitchCommon.chunk', () => {
  it('splits 250 logins into 100/100/50', () => {
    const items = Array.from({ length: 250 }, (_, i) => `user${i}`);
    const chunks = twitchCommon.chunk({ items, size: 100 });
    expect(chunks.map((c) => c.length)).toEqual([100, 100, 50]);
    expect(chunks.flat()).toEqual(items);
  });
  it('returns no chunks for an empty list', () => {
    expect(twitchCommon.chunk({ items: [], size: 100 })).toEqual([]);
  });
});

describe('twitchCommon.omitKeys', () => {
  it('strips deprecated fields and keeps the rest', () => {
    expect(
      twitchCommon.omitKeys({ item: { id: '1', tag_ids: [], tags: ['English'] }, keys: ['tag_ids'] })
    ).toEqual({ id: '1', tags: ['English'] });
  });
});

describe('round 3 helpers', () => {
  it('triState maps yes/no/empty', () => {
    expect(twitchCommon.triState('yes')).toBe(true);
    expect(twitchCommon.triState('no')).toBe(false);
    expect(twitchCommon.triState(undefined)).toBeUndefined();
    expect(twitchCommon.triState('')).toBeUndefined();
  });
  it('assertInteger checks ranges and passes undefined through', () => {
    expect(twitchCommon.assertInteger({ value: undefined, min: 1, max: 5, label: 'X' })).toBeUndefined();
    expect(twitchCommon.assertInteger({ value: 5, min: 1, max: 5, label: 'X' })).toBe(5);
    expect(() => twitchCommon.assertInteger({ value: 6, min: 1, max: 5, label: 'X' })).toThrow('between 1 and 5');
    expect(() => twitchCommon.assertInteger({ value: 1.5, min: 1, max: 5, label: 'X' })).toThrow();
  });
  it('compact drops only undefined', () => {
    expect(twitchCommon.compact({ a: undefined, b: false, c: 0, d: '' })).toEqual({ b: false, c: 0, d: '' });
  });
  it('idList dedupes, trims and enforces the max', () => {
    expect(twitchCommon.idList({ values: [' 1', '1', 2, ''], max: 5, label: 'IDs' })).toEqual(['1', '2']);
    expect(() => twitchCommon.idList({ values: ['1', '2'], max: 1, label: 'IDs' })).toThrow('at most 1');
  });
  it('requiredText and optionalText trim', () => {
    expect(twitchCommon.optionalText('  ')).toBeUndefined();
    expect(twitchCommon.requiredText({ value: ' a ', label: 'A' })).toBe('a');
    expect(() => twitchCommon.requiredText({ value: ' ', label: 'A' })).toThrow('A is required');
  });
  it('assertTextLength enforces 1..max', () => {
    expect(() => twitchCommon.assertTextLength({ value: 'abc', max: 2, label: 'T' })).toThrow();
    expect(() => twitchCommon.assertTextLength({ value: '  ', max: 2, label: 'T' })).toThrow();
  });
  it('validateLimitMax respects the per-action max', () => {
    expect(twitchCommon.validateLimitMax({ limit: undefined, max: 50 })).toBe(20);
    expect(() => twitchCommon.validateLimitMax({ limit: 51, max: 50 })).toThrow('between 1 and 50');
  });
});

const TOKEN_USER = { id: '111', login: 'me', display_name: 'Me' };

type SentRequest = Pick<Parameters<typeof httpClient.sendRequest>[0], 'method' | 'url' | 'body' | 'headers'>;

function mockTwitch(handler: (req: SentRequest) => { status: number; body: unknown }) {
  const calls: SentRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
    const sent = { method: req.method, url: req.url, body: req.body, headers: req.headers };
    calls.push(sent);
    if (sent.url === 'https://api.twitch.tv/helix/users') {
      return { status: 200, headers: {}, body: { data: [TOKEN_USER] } };
    }
    const res = handler(sent);
    if (res.status >= 400) {
      throw new HttpError(req.body, { status: res.status, responseBody: res.body });
    }
    return { status: res.status, headers: {}, body: res.body };
  });
  return calls;
}

function ctx(propsValue: Record<string, unknown>) {
  return { auth: { access_token: 'tok', client_id: 'cid' }, propsValue };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('moderation: ban_user', () => {
  it('defaults broadcaster and moderator to the token user and wraps the body in data', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: { data: [{ user_id: '222' }] } }));
    const result = await banUser.run(ctx({ user_id: ' 222 ', reason: 'spam' }));
    const ban = calls.find((c) => c.url.includes('/moderation/bans'));
    expect(ban?.method).toBe(HttpMethod.POST);
    expect(ban?.url).toBe('https://api.twitch.tv/helix/moderation/bans?broadcaster_id=111&moderator_id=111');
    expect(ban?.body).toEqual({ data: { user_id: '222', reason: 'spam' } });
    expect(ban?.headers?.['Client-ID']).toBe('cid');
    expect(result).toEqual({ user_id: '222' });
    expect(calls.filter((c) => c.url.endsWith('/users'))).toHaveLength(1);
  });
});

describe('moderation: update_chat_settings', () => {
  it('sends only changed modes, and a duration turns its mode on', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: { data: [{ slow_mode: true }] } }));
    await updateChatSettings.run(ctx({ broadcaster_id: '999', slow_mode_wait_time: 30, emote_mode: 'no' }));
    const patch = calls.find((c) => c.method === HttpMethod.PATCH);
    expect(patch?.url).toBe('https://api.twitch.tv/helix/chat/settings?broadcaster_id=999&moderator_id=111');
    expect(patch?.body).toEqual({ emote_mode: false, slow_mode: true, slow_mode_wait_time: 30 });
  });
  it('refuses an empty update before any request', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: {} }));
    await expect(updateChatSettings.run(ctx({}))).rejects.toThrow('at least one chat setting');
    expect(calls).toHaveLength(0);
  });
  it('refuses a duration with its mode turned off', async () => {
    mockTwitch(() => ({ status: 200, body: {} }));
    await expect(updateChatSettings.run(ctx({ slow_mode: 'no', slow_mode_wait_time: 10 }))).rejects.toThrow('duration');
  });
});

describe('schedule: get_channel_schedule', () => {
  it('returns an empty schedule on 404', async () => {
    mockTwitch(() => ({ status: 404, body: { message: 'Not Found' } }));
    const result = await getChannelSchedule.run(ctx({ broadcaster_id: '42' }));
    expect(result).toMatchObject({ broadcaster_id: '42', segments: [], count: 0, next_cursor: null });
  });
  it('rethrows other errors', async () => {
    mockTwitch(() => ({ status: 500, body: { message: 'boom' } }));
    await expect(getChannelSchedule.run(ctx({ broadcaster_id: '42' }))).rejects.toBeInstanceOf(HttpError);
  });
});

describe('subscriptions: check_user_subscription', () => {
  it('maps 404 to subscribed false', async () => {
    const calls = mockTwitch(() => ({ status: 404, body: { message: 'has no subscription' } }));
    const result = await checkUserSubscription.run(ctx({ broadcaster_id: '42' }));
    expect(result).toEqual({ subscribed: false, broadcaster_id: '42' });
    expect(calls.at(-1)?.url).toBe('https://api.twitch.tv/helix/subscriptions/user?broadcaster_id=42&user_id=111');
  });
});

describe('chat presence: get_chatters', () => {
  it('pages with first up to 1000 and the cursor, keeping total', async () => {
    const calls = mockTwitch((req) =>
      req.url.includes('after=c1')
        ? { status: 200, body: { data: [{ user_id: '3' }], pagination: {}, total: 3 } }
        : { status: 200, body: { data: [{ user_id: '1' }, { user_id: '2' }], pagination: { cursor: 'c1' }, total: 3 } }
    );
    const result = await getChatters.run(ctx({ limit: 1500 }));
    const pages = calls.filter((c) => c.url.includes('/chat/chatters'));
    expect(pages[0].url).toContain('first=1000');
    expect(pages[1].url).toContain('after=c1');
    expect(result).toEqual({ chatters: [{ user_id: '1' }, { user_id: '2' }, { user_id: '3' }], total: 3, count: 3, next_cursor: null });
  });
});

describe('free reads: get_games', () => {
  it('repeats query keys and refuses an empty lookup', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: { data: [] } }));
    await getGames.run(ctx({ names: ['Fortnite', 'Just Chatting'] }));
    expect(calls[0].url).toBe('https://api.twitch.tv/helix/games?name=Fortnite&name=Just+Chatting');
    await expect(getGames.run(ctx({}))).rejects.toThrow('between 1 and 100');
  });
});

describe('twitchCommon.unixToIso', () => {
  it('maps Twitch 0 / empty to null and Unix seconds to ISO', () => {
    expect(twitchCommon.unixToIso(0)).toBeNull();
    expect(twitchCommon.unixToIso('')).toBeNull();
    expect(twitchCommon.unixToIso('0')).toBeNull();
    expect(twitchCommon.unixToIso(1700000000)).toBe('2023-11-14T22:13:20.000Z');
    expect(twitchCommon.unixToIso('1700000000')).toBe('2023-11-14T22:13:20.000Z');
    expect(twitchCommon.unixToIso('2023-11-14T22:13:20Z')).toBe('2023-11-14T22:13:20.000Z');
  });
});

describe('markers: get_stream_markers', () => {
  it('maps the uppercase URL field to url', async () => {
    mockTwitch(() => ({
      status: 200,
      body: {
        data: [
          {
            user_id: '111',
            videos: [{ video_id: 'v1', markers: [{ id: 'm1', position_seconds: 10, URL: 'https://twitch.tv/videos/v1?t=0h0m10s' }] }],
          },
        ],
        pagination: {},
      },
    }));
    const result = await getStreamMarkers.run(ctx({ user_id: '111' }));
    expect(result).toEqual({
      markers: [
        {
          user_id: '111',
          videos: [{ video_id: 'v1', markers: [{ id: 'm1', position_seconds: 10, url: 'https://twitch.tv/videos/v1?t=0h0m10s' }] }],
        },
      ],
      count: 1,
      next_cursor: null,
    });
  });
});

describe('polls: get_polls', () => {
  it('uses the token user as broadcaster and pages 20 at a time', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: { data: [{ id: 'p1' }], pagination: {} } }));
    const result = await getPolls.run(ctx({ poll_ids: ['p1'], limit: 50 }));
    const get = calls.find((c) => c.url.includes('/polls'));
    expect(get?.url).toBe('https://api.twitch.tv/helix/polls?broadcaster_id=111&id=p1&first=20');
    expect(result).toEqual({ polls: [{ id: 'p1' }], count: 1, next_cursor: null });
  });
});

describe('social: send_shoutout', () => {
  it('sends from the token user and returns built ids', async () => {
    const calls = mockTwitch(() => ({ status: 204, body: undefined }));
    const result = await sendShoutout.run(ctx({ to_broadcaster_id: '5' }));
    const post = calls.find((c) => c.url.includes('/chat/shoutouts'));
    expect(post?.method).toBe(HttpMethod.POST);
    expect(post?.url).toBe('https://api.twitch.tv/helix/chat/shoutouts?from_broadcaster_id=111&to_broadcaster_id=5&moderator_id=111');
    expect(result).toEqual({ success: true, from_broadcaster_id: '111', to_broadcaster_id: '5' });
  });
});

function memoryStore() {
  const data: Record<string, unknown> = {};
  return {
    data,
    get: async <T>(key: string) => (key in data ? (data[key] as T) : null),
    put: async <T>(key: string, value: T) => {
      data[key] = value;
      return value;
    },
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

function liveStream(i: number, startedAt: string) {
  return { id: `s${i}`, user_login: `user${i}`, started_at: startedAt, tag_ids: [], tags: ['English'] };
}

function triggerCtx(streamers: unknown[], store = memoryStore()) {
  return { auth: { access_token: 'tok', client_id: 'cid' }, propsValue: { streamers }, store, files: {} } as never;
}

describe('trigger: stream_started', () => {
  it('makes no request and throws when every entry is blank or invalid', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: { data: [] } }));
    await expect(streamStarted.test(triggerCtx(['', '  ', 'https://twitch.tv/']))).rejects.toThrow('at least one valid Twitch username');
    expect(calls).toHaveLength(0);
  });

  it('splits more than 100 logins into requests of at most 100 with first=100', async () => {
    const calls = mockTwitch(() => ({ status: 200, body: { data: [] } }));
    const logins = Array.from({ length: 250 }, (_, i) => `user${i}`);
    await streamStarted.test(triggerCtx(logins));
    const streams = calls.filter((c) => c.url.startsWith('https://api.twitch.tv/helix/streams'));
    expect(streams).toHaveLength(3);
    const perRequest = streams.map((c) => new URL(c.url).searchParams);
    expect(perRequest.map((q) => q.getAll('user_login').length)).toEqual([100, 100, 50]);
    expect(perRequest.every((q) => q.get('first') === '100')).toBe(true);
    expect(perRequest.flatMap((q) => q.getAll('user_login'))).toEqual(logins);
  });

  it('returns every live stream when more than 20 are live', async () => {
    const live = Array.from({ length: 30 }, (_, i) => liveStream(i, new Date(Date.UTC(2030, 0, 1, 0, i)).toISOString()));
    mockTwitch(() => ({ status: 200, body: { data: live } }));
    const store = memoryStore();
    const logins = live.map((s) => s.user_login);
    await store.put('lastPoll', Date.UTC(2029, 0, 1));
    const result = (await streamStarted.run(triggerCtx(logins, store))) as Array<Record<string, unknown>>;
    expect(result).toHaveLength(30);
    expect(result[0]).not.toHaveProperty('tag_ids');
  });

  it('does not fire the same streams again on the next poll', async () => {
    const now = Date.now();
    const live = [liveStream(1, new Date(now + 60_000).toISOString()), liveStream(2, new Date(now + 120_000).toISOString())];
    mockTwitch(() => ({ status: 200, body: { data: live } }));
    const store = memoryStore();
    const context = triggerCtx(['user1', 'user2'], store);
    await streamStarted.onEnable(context);
    expect(typeof store.data['lastPoll']).toBe('number');
    const first = (await streamStarted.run(context)) as Array<{ id: string }>;
    expect(first.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(store.data['lastPoll']).toBe(now + 120_000);
    const second = await streamStarted.run(context);
    expect(second).toEqual([]);
  });
});
