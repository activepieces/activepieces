import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { mastodonPolling } from '../src/lib/common/polling';
import { newFollower } from '../src/lib/triggers/new-follower';
import { newMention } from '../src/lib/triggers/new-mention';
import { newStatusFromAccount } from '../src/lib/triggers/new-status-from-account';
import { newStatusWithHashtag } from '../src/lib/triggers/new-status-with-hashtag';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { base_url: 'https://social.example/', access_token: 'token' };

type Route = (url: URL) => unknown;

let routes: Record<string, Route> = {};

function route({ path, handler }: { path: string; handler: Route }): void {
  routes[path] = handler;
}

function notFound(): never {
  throw new HttpError(undefined, { status: 404, responseBody: { error: 'Record not found' } });
}

function callsTo(path: string): URL[] {
  return sendRequest.mock.calls.map((call) => new URL(call[0].url)).filter((url) => url.pathname === path);
}

function memoryStore() {
  const values = new Map<string, unknown>();
  return {
    values,
    get: async <T>(key: string) => (values.has(key) ? (values.get(key) as T) : null),
    put: async <T>(key: string, value: T) => {
      values.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      values.delete(key);
    },
  };
}

function triggerContext({
  propsValue,
  store,
  auth = AUTH,
}: {
  propsValue: Record<string, unknown>;
  store: ReturnType<typeof memoryStore>;
  auth?: typeof AUTH;
}) {
  return { auth: { props: auth }, propsValue, store, files: {} } as never;
}

beforeEach(() => {
  routes = {};
  sendRequest.mockReset();
  sendRequest.mockImplementation(async ({ url }: { url: string }) => {
    const parsed = new URL(url);
    const handler = routes[parsed.pathname];
    if (handler === undefined) {
      throw new Error(`Unexpected request to ${parsed.pathname}`);
    }
    return { status: 200, headers: {}, body: handler(parsed) };
  });
});

describe('fetchNewItems', () => {
  it('sends min_id and the page limit, drops items without an ID and sorts IDs newest first by number', async () => {
    route({
      path: '/api/v1/notifications',
      handler: () => [{ id: '99' }, { id: '1000' }, { id: '' }, { other: true }, { id: '101' }],
    });

    const items = await mastodonPolling.fetchNewItems({
      auth: AUTH,
      path: '/api/v1/notifications',
      query: { types: ['mention'] },
      lastItemId: '98',
      operation: 'New Mention',
      scope: 'read:notifications',
    });

    expect(items.map((item) => item.id)).toEqual(['1000', '101', '99']);
    const [url] = callsTo('/api/v1/notifications');
    expect(url.searchParams.get('min_id')).toBe('98');
    expect(url.searchParams.get('limit')).toBe('40');
  });

  it('leaves min_id out on the first poll', async () => {
    route({ path: '/api/v1/notifications', handler: () => [] });

    await mastodonPolling.fetchNewItems({
      auth: AUTH,
      path: '/api/v1/notifications',
      lastItemId: null,
      operation: 'New Follower',
      scope: 'read:notifications',
    });

    expect(callsTo('/api/v1/notifications')[0].searchParams.has('min_id')).toBe(false);
  });
});

describe('resolveAccountId', () => {
  it('uses a numeric Account ID as is, without a request', async () => {
    await expect(mastodonPolling.resolveAccountId({ auth: AUTH, account: ' 12345 ', operation: 'test' })).resolves.toBe('12345');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('looks up a handle and strips a leading @', async () => {
    route({ path: '/api/v1/accounts/lookup', handler: () => ({ id: '77', acct: 'Gargron@mastodon.social' }) });

    await expect(
      mastodonPolling.resolveAccountId({ auth: AUTH, account: '@Gargron@mastodon.social', operation: 'test' })
    ).resolves.toBe('77');
    expect(callsTo('/api/v1/accounts/lookup')[0].searchParams.get('acct')).toBe('Gargron@mastodon.social');
  });

  it('falls back to a resolving search when the lookup returns 404, matching a local account by host', async () => {
    route({ path: '/api/v1/accounts/lookup', handler: notFound });
    route({
      path: '/api/v2/search',
      handler: () => ({ accounts: [{ id: '5', acct: 'someone@else.example' }, { id: '6', acct: 'alice' }] }),
    });

    await expect(
      mastodonPolling.resolveAccountId({ auth: AUTH, account: 'alice@social.example', operation: 'test' })
    ).resolves.toBe('6');
    expect(callsTo('/api/v2/search')[0].searchParams.get('resolve')).toBe('true');
  });

  it('explains when no account matches', async () => {
    route({ path: '/api/v1/accounts/lookup', handler: notFound });
    route({ path: '/api/v2/search', handler: () => ({ accounts: [] }) });

    await expect(mastodonPolling.resolveAccountId({ auth: AUTH, account: 'ghost', operation: 'test' })).rejects.toThrow(
      'Mastodon found no account for "ghost"'
    );
  });
});

describe('New Status from Account', () => {
  const propsValue = { account: 'Gargron@mastodon.social', exclude_replies: true, exclude_reblogs: false };

  it('fires only for statuses newer than the last one, and looks the account up once', async () => {
    const store = memoryStore();
    let statuses = [{ id: '10' }, { id: '9' }];
    route({ path: '/api/v1/accounts/lookup', handler: () => ({ id: '77' }) });
    route({ path: '/api/v1/accounts/77/statuses', handler: () => statuses });

    await newStatusFromAccount.onEnable(triggerContext({ propsValue, store }));
    statuses = [{ id: '12' }, { id: '11' }, { id: '10' }];
    const fired = await newStatusFromAccount.run(triggerContext({ propsValue, store }));

    expect(fired).toEqual([{ id: '12' }, { id: '11' }]);
    expect(store.values.get('lastItem')).toBe('12');
    expect(callsTo('/api/v1/accounts/lookup')).toHaveLength(1);
    const lastCall = callsTo('/api/v1/accounts/77/statuses').at(-1);
    expect(lastCall?.searchParams.get('min_id')).toBe('10');
    expect(lastCall?.searchParams.get('exclude_replies')).toBe('true');
    expect(lastCall?.searchParams.has('exclude_reblogs')).toBe(false);
  });

  it('looks the account up again and starts from its newest post when the configured handle changes', async () => {
    const store = memoryStore();
    route({ path: '/api/v1/accounts/lookup', handler: (url) => ({ id: url.searchParams.get('acct') === 'other' ? '88' : '77' }) });
    route({ path: '/api/v1/accounts/77/statuses', handler: () => [{ id: '1' }] });
    route({ path: '/api/v1/accounts/88/statuses', handler: () => [{ id: '2' }] });

    await newStatusFromAccount.onEnable(triggerContext({ propsValue, store }));
    const fired = await newStatusFromAccount.run(triggerContext({ propsValue: { ...propsValue, account: 'other' }, store }));

    expect(fired).toEqual([]);
    expect(store.values.get('lastItem')).toBe('2');
    expect(callsTo('/api/v1/accounts/lookup')).toHaveLength(2);
    expect(callsTo('/api/v1/accounts/88/statuses')).toHaveLength(1);
  });

  it('starts from the newest post, without firing, when the connection points to another server', async () => {
    const store = memoryStore();
    let otherStatuses = [{ id: '5' }, { id: '4' }];
    route({ path: '/api/v1/accounts/lookup', handler: (url) => ({ id: url.hostname === 'social.example' ? '77' : '55' }) });
    route({ path: '/api/v1/accounts/77/statuses', handler: () => [{ id: '900' }] });
    route({ path: '/api/v1/accounts/55/statuses', handler: () => otherStatuses });
    const otherServer = { ...AUTH, base_url: 'https://other.example' };

    await newStatusFromAccount.onEnable(triggerContext({ propsValue, store }));
    const afterSwitch = await newStatusFromAccount.run(triggerContext({ propsValue, store, auth: otherServer }));
    otherStatuses = [{ id: '6' }, { id: '5' }];
    const nextPoll = await newStatusFromAccount.run(triggerContext({ propsValue, store, auth: otherServer }));

    expect(afterSwitch).toEqual([]);
    expect(nextPoll).toEqual([{ id: '6' }]);
    expect(callsTo('/api/v1/accounts/55/statuses')[0].searchParams.has('min_id')).toBe(false);
    expect(callsTo('/api/v1/accounts/55/statuses')[1].searchParams.get('min_id')).toBe('5');
    expect(callsTo('/api/v1/accounts/lookup')).toHaveLength(2);
    expect(store.values.get('resolved_account')).toMatchObject({ server: 'https://other.example', id: '55' });
  });

  it('clears the cursor when the newly watched account has no posts yet, so its first post fires', async () => {
    const store = memoryStore();
    let otherStatuses: { id: string }[] = [];
    route({ path: '/api/v1/accounts/lookup', handler: (url) => ({ id: url.searchParams.get('acct') === 'other' ? '88' : '77' }) });
    route({ path: '/api/v1/accounts/77/statuses', handler: () => [{ id: '900' }] });
    route({ path: '/api/v1/accounts/88/statuses', handler: () => otherStatuses });
    const otherProps = { ...propsValue, account: 'other' };

    await newStatusFromAccount.onEnable(triggerContext({ propsValue, store }));
    const afterSwitch = await newStatusFromAccount.run(triggerContext({ propsValue: otherProps, store }));
    otherStatuses = [{ id: '3' }];
    const nextPoll = await newStatusFromAccount.run(triggerContext({ propsValue: otherProps, store }));

    expect(afterSwitch).toEqual([]);
    expect(nextPoll).toEqual([{ id: '3' }]);
    expect(callsTo('/api/v1/accounts/88/statuses')[1].searchParams.has('min_id')).toBe(false);
  });

  it('retries the switch on the next poll when reading the new account fails', async () => {
    const store = memoryStore();
    let failOther = true;
    route({ path: '/api/v1/accounts/lookup', handler: (url) => ({ id: url.searchParams.get('acct') === 'other' ? '88' : '77' }) });
    route({ path: '/api/v1/accounts/77/statuses', handler: () => [{ id: '900' }] });
    route({
      path: '/api/v1/accounts/88/statuses',
      handler: () => {
        if (failOther) {
          throw new HttpError(undefined, { status: 503, responseBody: {} });
        }
        return [{ id: '4' }];
      },
    });
    const otherProps = { ...propsValue, account: 'other' };

    await newStatusFromAccount.onEnable(triggerContext({ propsValue, store }));
    await expect(newStatusFromAccount.run(triggerContext({ propsValue: otherProps, store }))).rejects.toThrow();
    expect(store.values.get('resolved_account')).toMatchObject({ id: '77' });
    failOther = false;
    const retried = await newStatusFromAccount.run(triggerContext({ propsValue: otherProps, store }));

    expect(retried).toEqual([]);
    expect(store.values.get('lastItem')).toBe('4');
    expect(store.values.get('resolved_account')).toMatchObject({ id: '88' });
    expect(callsTo('/api/v1/accounts/88/statuses').every((url) => !url.searchParams.has('min_id'))).toBe(true);
  });

  it('looks the account up again when the cached Account ID returns 404', async () => {
    const store = memoryStore();
    let currentId = '77';
    route({ path: '/api/v1/accounts/lookup', handler: () => ({ id: currentId }) });
    route({ path: '/api/v1/accounts/77/statuses', handler: () => (currentId === '77' ? [{ id: '1' }] : notFound()) });
    route({ path: '/api/v1/accounts/90/statuses', handler: () => [{ id: '3' }] });

    await newStatusFromAccount.onEnable(triggerContext({ propsValue, store }));
    currentId = '90';
    const fired = await newStatusFromAccount.run(triggerContext({ propsValue, store }));

    expect(fired).toEqual([{ id: '3' }]);
    expect(callsTo('/api/v1/accounts/lookup')).toHaveLength(2);
    expect(store.values.get('resolved_account')).toEqual({ server: 'https://social.example', handle: 'gargron@mastodon.social', id: '90' });
  });
});

describe('notification and hashtag triggers', () => {
  it('New Mention and New Follower poll notifications of their own type', async () => {
    route({ path: '/api/v1/notifications', handler: () => [{ id: '5' }] });

    await newMention.run(triggerContext({ propsValue: {}, store: memoryStore() }));
    await newFollower.run(triggerContext({ propsValue: {}, store: memoryStore() }));

    const types = callsTo('/api/v1/notifications').map((url) => url.searchParams.getAll('types[]').concat(url.searchParams.getAll('types')));
    expect(types).toEqual([['mention'], ['follow']]);
  });

  it('New Status with Hashtag strips the # and refuses an empty hashtag', async () => {
    route({ path: '/api/v1/timelines/tag/opensource', handler: () => [{ id: '8' }] });

    const fired = await newStatusWithHashtag.run(
      triggerContext({ propsValue: { hashtag: '#opensource', local: true, only_media: false }, store: memoryStore() })
    );

    expect(fired).toEqual([{ id: '8' }]);
    expect(callsTo('/api/v1/timelines/tag/opensource')[0].searchParams.get('local')).toBe('true');
    await expect(
      newStatusWithHashtag.run(triggerContext({ propsValue: { hashtag: ' # ', local: false, only_media: false }, store: memoryStore() }))
    ).rejects.toThrow('Enter a hashtag to watch');
  });
});
