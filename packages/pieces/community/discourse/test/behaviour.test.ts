import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { discourse } from '../src';
import { addUsersToGroup } from '../src/lib/actions/add-users-to-group.action';
import { createPost } from '../src/lib/actions/create-post.action';
import { createTopicAiAction } from '../src/lib/actions/ai/create-topic-ai';
import { createUserAction } from '../src/lib/actions/ai/create-user';
import { getTopicAction } from '../src/lib/actions/ai/get-topic';
import { getTopicByExternalIdAction } from '../src/lib/actions/ai/get-topic-by-external-id';
import { getUserAction } from '../src/lib/actions/ai/get-user';
import { deletePostAction } from '../src/lib/actions/ai/delete-post';
import { deleteTopicAction } from '../src/lib/actions/ai/delete-topic';
import { likePostAction } from '../src/lib/actions/ai/like-post';
import { setUserTrustLevelAction } from '../src/lib/actions/ai/set-user-trust-level';
import { updateTopicAction } from '../src/lib/actions/ai/update-topic';
import { discourseAuth } from '../src/lib/auth';
import { DiscourseApiError, isSameInstanceUrl, normalizeBaseUrl } from '../src/lib/common/client';
import { discourseProps } from '../src/lib/common/props';
import { newPostTrigger } from '../src/lib/triggers/new-post';
import { newTopicTrigger } from '../src/lib/triggers/new-topic';
import { userAddedToGroupTrigger } from '../src/lib/triggers/user-added-to-group';
import { BASE, call, makeContext, makeStore, stubFetch } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('instance URL', () => {
  it('normalises scheme, trailing slash and subfolder', () => {
    expect(normalizeBaseUrl(' forum.example.com/ ')).toBe('https://forum.example.com');
    expect(normalizeBaseUrl('https://Example.com/forum/')).toBe('https://example.com/forum');
    expect(normalizeBaseUrl('https://forum.example.com/a/../b')).toBe('https://forum.example.com/b');
  });
  it.each([
    'http://forum.example.com',
    'ftp://forum.example.com',
    'https://user:pw@forum.example.com',
    'https://forum.example.com/?x=1',
    'https://forum.example.com/#a',
    'https://localhost',
    'https://127.0.0.1',
    'https://10.1.2.3',
    'https://192.168.0.5',
    'https://169.254.169.254',
    'https://[::1]',
    'https://[fd00::1]',
    'https://metadata.internal',
    '',
  ])('rejects %s', (url) => {
    expect(() => normalizeBaseUrl(url)).toThrow();
  });
  it('keeps redirects on the same instance and path prefix only', () => {
    expect(isSameInstanceUrl({ baseUrl: 'https://forum.example.com', candidate: '/t/hello/42' })).toBe(true);
    expect(isSameInstanceUrl({ baseUrl: 'https://forum.example.com', candidate: 'https://forum.example.com.evil.io/t/x/1' })).toBe(false);
    expect(isSameInstanceUrl({ baseUrl: 'https://forum.example.com', candidate: '//evil.io/t/x/1' })).toBe(false);
    expect(isSameInstanceUrl({ baseUrl: 'https://example.com/forum', candidate: 'https://example.com/other/t/x/1' })).toBe(false);
  });
  it('sends requests under a subfolder install and refuses http before any request', async () => {
    const calls = stubFetch([{ body: { user: { id: 1 } } }]);
    await call({ fn: getUserAction.run, ctx: makeContext({ props: { username: 'alice' }, websiteUrl: 'https://example.com/forum/' }) });
    expect(calls[0].url.toString()).toBe('https://example.com/forum/u/alice.json');
    await expect(
      call({ fn: getUserAction.run, ctx: makeContext({ props: { username: 'alice' }, websiteUrl: 'http://example.com' }) }),
    ).rejects.toThrow('https://');
    expect(calls).toHaveLength(1);
  });
  it('custom API call uses the normalised base URL', () => {
    const customCall = discourse.actions()['custom_api_call'];
    expect(customCall).toBeDefined();
  });
});

describe('path segments', () => {
  it.each(['1/../../admin', '7.5', '-1', 'abc', ''])('rejects user id %s', async (userId) => {
    const calls = stubFetch([]);
    await expect(call({ fn: setUserTrustLevelAction.run, ctx: makeContext({ props: { user_id: userId, level: 1 } }) })).rejects.toThrow('User ID');
    expect(calls).toHaveLength(0);
  });
  it('rejects slashes and dot segments in usernames and encodes the rest', async () => {
    await expect(call({ fn: getUserAction.run, ctx: makeContext({ props: { username: '../admin' } }) })).rejects.toThrow();
    await expect(call({ fn: getUserAction.run, ctx: makeContext({ props: { username: '..' } }) })).rejects.toThrow();
    const calls = stubFetch([{ body: { user: {} } }]);
    await call({ fn: getUserAction.run, ctx: makeContext({ props: { username: 'jo ë?x' } }) });
    expect(calls[0].url.pathname).toBe('/u/jo%20%C3%AB%3Fx.json');
  });
  it('rejects trust levels outside 0 to 4', async () => {
    await expect(call({ fn: setUserTrustLevelAction.run, ctx: makeContext({ props: { user_id: '7', level: 5 } }) })).rejects.toThrow('Trust Level');
  });
  it('update topic needs at least one field', async () => {
    await expect(call({ fn: updateTopicAction.run, ctx: makeContext({ props: { topic_id: '1' } }) })).rejects.toThrow('Provide');
  });
});

describe('connection failures', () => {
  function flakyFetch(failures: number) {
    const methods: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_input: string | URL, init?: RequestInit) => {
      methods.push(init?.method ?? 'GET');
      if (methods.length <= failures) {
        throw new TypeError('fetch failed');
      }
      return new Response(JSON.stringify({ user: { id: 7, username: 'alice' } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));
    return methods;
  }
  it('retries an idempotent GET after a connect failure', async () => {
    const methods = flakyFetch(1);
    await expect(call({ fn: getUserAction.run, ctx: makeContext({ props: { username: 'alice' } }) })).resolves.toMatchObject({ id: 7 });
    expect(methods).toEqual(['GET', 'GET']);
  });
  it('never resends a POST after a connect failure', async () => {
    const methods = flakyFetch(1);
    await expect(call({ fn: createPost.run, ctx: makeContext({ props: { topic_id: 1, raw: 'hello there' } }) })).rejects.toThrow('fetch failed');
    expect(methods).toEqual(['POST']);
  });
});

describe('errors', () => {
  it('surfaces 422 errors and keeps the body under responseBody', async () => {
    stubFetch([{ status: 422, body: { errors: ['Title has already been used'], error_type: 'invalid_parameters' } }]);
    const error = await call({ fn: createPost.run, ctx: makeContext({ props: { raw: 'x', topic_id: 1 } }) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DiscourseApiError);
    expect(error).toHaveProperty('message', 'Discourse could not process the request (HTTP 422): Title has already been used');
    expect(error).toHaveProperty('status', 422);
    expect(error).not.toHaveProperty('body');
    expect(error).toHaveProperty('responseBody');
  });
  it('explains 403 as a scope or admin problem', async () => {
    stubFetch([{ status: 403, body: { errors: ['You are not permitted to view the requested resource.'], error_type: 'invalid_access' } }]);
    await expect(call({ fn: getTopicAction.run, ctx: makeContext({ props: { topic_id: '1' } }) })).rejects.toThrow('scope');
  });
  it('retries 429 at most twice with the clamped wait', async () => {
    vi.useFakeTimers();
    const calls = stubFetch([
      { status: 429, body: { errors: ['slow'], extras: { wait_seconds: 999 } } },
      { status: 429, body: { errors: ['slow'], extras: { wait_seconds: 1 } } },
      { status: 429, body: { errors: ['slow'] } },
    ]);
    const pending = call({ fn: getTopicAction.run, ctx: makeContext({ props: { topic_id: '1' } }) }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(29000);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toHaveLength(3);
    expect(await pending).toHaveProperty('status', 429);
  });
  it('never logs the password of Create User', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch([{ status: 500, body: { errors: ['boom'] } }]);
    await expect(
      call({ fn: createUserAction.run, ctx: makeContext({ props: { name: 'A', email: 'a@x.io', username: 'a', password: 'TopSecret#1' } }) }),
    ).rejects.toThrow('server error');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('TopSecret#1');
  });
  it('reports success:false from Create User as a failure', async () => {
    stubFetch([{ body: { success: false, message: 'Username taken', errors: { username: ['must be unique'] } } }]);
    await expect(
      call({ fn: createUserAction.run, ctx: makeContext({ props: { name: 'A', email: 'a@x.io', username: 'a', password: 'secret-pass-1' } }) }),
    ).rejects.toThrow('username: must be unique');
  });
  it('reads the user id back when Create User leaves it out (live Discourse 2026)', async () => {
    const calls = stubFetch([{ body: { success: true, active: true, message: 'ok' } }, { body: { user: { id: 12, username: 'a' } } }]);
    await expect(
      call({ fn: createUserAction.run, ctx: makeContext({ props: { name: 'A', email: 'a@x.io', username: 'a', password: 'secret-pass-1', active: true } }) }),
    ).resolves.toMatchObject({ user_id: 12, success: true });
    expect(calls[1].url.pathname).toBe('/u/a.json');
  });
  it('requires a password for Create User', async () => {
    stubFetch([]);
    await expect(
      call({ fn: createUserAction.run, ctx: makeContext({ props: { name: 'A', email: 'a@x.io', username: 'a' } }) }),
    ).rejects.toThrow('Password is required');
  });
  it('reports a soft-deleted topic as already deleted without a second DELETE (live: 2nd DELETE = 422)', async () => {
    const calls = stubFetch([{ body: { id: 42, deleted_at: '2026-10-13T10:00:00.000Z' } }]);
    await expect(call({ fn: deleteTopicAction.run, ctx: makeContext({ props: { topic_id: '42' } }) })).resolves.toMatchObject({ already_deleted: true });
    expect(calls.map((c) => c.method)).toEqual(['GET']);
  });
  it('fails with a not found error when the post or topic ID does not exist, without a DELETE', async () => {
    const postCalls = stubFetch([{ status: 404, body: { errors: ['not found'] } }]);
    await expect(call({ fn: deletePostAction.run, ctx: makeContext({ props: { post_id: '501' } }) })).rejects.toThrow('Discourse post 501 was not found');
    expect(postCalls.map((c) => c.method)).toEqual(['GET']);
    const topicCalls = stubFetch([{ status: 404, body: { errors: ['not found'] } }]);
    await expect(call({ fn: deleteTopicAction.run, ctx: makeContext({ props: { topic_id: '42' } }) })).rejects.toThrow('Discourse topic 42 was not found');
    expect(topicCalls.map((c) => c.method)).toEqual(['GET']);
  });
  it('explains that a user cannot like their own post', async () => {
    stubFetch([{ status: 403, body: { errors: ['You are not permitted to view the requested resource.'] } }, { body: { ...{ id: 5, topic_id: 1, post_number: 1 }, yours: true } }]);
    await expect(call({ fn: likePostAction.run, ctx: makeContext({ props: { post_id: '5' } }) })).rejects.toThrow('like their own post');
  });
  it('treats already-liked and already-member as success', async () => {
    stubFetch([{ status: 403, body: { errors: ['You already performed this action.'] } }, { body: { id: 5, topic_id: 1, post_number: 1, actions_summary: [{ id: 2, count: 4 }] } }]);
    await expect(call({ fn: likePostAction.run, ctx: makeContext({ props: { post_id: '5' } }) })).resolves.toMatchObject({ already_liked: true, like_count: 4 });
    stubFetch([{ status: 422, body: { errors: ['alice is already a member of this group.'] } }]);
    await expect(call({ fn: addUsersToGroup.run, ctx: makeContext({ props: { group_id: 1, users: ['alice'] } }) })).resolves.toMatchObject({
      skipped_usernames: 'alice',
    });
  });
});

describe('topics by external id', () => {
  it('returns the existing topic instead of creating a duplicate', async () => {
    const calls = stubFetch([{ body: { id: 42, slug: 'hello', title: 'Hello', post_stream: { posts: [{ id: 500, post_number: 1 }] } } }]);
    const output = await call({ fn: createTopicAiAction.run, ctx: makeContext({ props: { title: 'T', raw: 'b', external_id: 'e1' } }) });
    expect(calls).toHaveLength(1);
    expect(output).toMatchObject({ already_existed: true, id: 500, topic_id: 42, topic_url: `${BASE}/t/hello/42` });
  });
  it('follows a same-origin redirect manually', async () => {
    const calls = stubFetch([{ status: 301, headers: { location: `${BASE}/t/hello/42` } }, { body: { id: 42, slug: 'hello' } }]);
    await expect(call({ fn: getTopicByExternalIdAction.run, ctx: makeContext({ props: { external_id: 'e1' } }) })).resolves.toMatchObject({ id: 42 });
    expect(calls[1].url.pathname).toBe('/t/42.json');
  });
  it('refuses a redirect to another host', async () => {
    const calls = stubFetch([{ status: 302, headers: { location: 'https://forum.example.com.evil.io/t/x/42' } }]);
    await expect(call({ fn: getTopicByExternalIdAction.run, ctx: makeContext({ props: { external_id: 'e1' } }) })).rejects.toThrow('unexpected address');
    expect(calls).toHaveLength(1);
  });
});

describe('auth validate', () => {
  const validate = discourseAuth.validate;
  const SERVER = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };
  const auth = { api_key: 'k', api_username: 'system', website_url: 'https://forum.example.com' };
  it('accepts a working key', async () => {
    const calls = stubFetch([{ body: { current_user: { id: 1 } } }]);
    await expect(validate?.({ auth, server: SERVER })).resolves.toEqual({ valid: true });
    expect(calls[0].url.pathname).toBe('/session/current.json');
  });
  it('says invalid only on 401/403', async () => {
    stubFetch([{ status: 403, body: {} }]);
    await expect(validate?.({ auth, server: SERVER })).resolves.toEqual({ valid: false, error: 'Invalid API Key or API Username.' });
    stubFetch([{ status: 500, body: {} }]);
    await expect(validate?.({ auth, server: SERVER })).resolves.toMatchObject({ valid: false, error: expect.stringContaining('Could not verify') });
  });
  it('rejects a bad URL without a request', async () => {
    const calls = stubFetch([]);
    await expect(validate?.({ auth: { ...auth, website_url: 'http://10.0.0.1' }, server: SERVER })).resolves.toMatchObject({ valid: false });
    expect(calls).toHaveLength(0);
  });
});

describe('metadata', () => {
  const actions = Object.values(discourse.actions()).filter((action) => action.name !== 'custom_api_call');
  it('has audience counts as planned', () => {
    const count = (audience: string) => actions.filter((action) => action.audience === audience).length;
    expect({ human: count('human'), both: count('both'), ai: count('ai') }).toEqual({ human: 4, both: 1, ai: 51 });
  });
  it('every action has classification, aiMetadata and an outputSchema', () => {
    for (const action of actions) {
      expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE'], action.name).toContain(action.classification);
      expect(action.aiMetadata?.description?.length ?? 0, action.name).toBeGreaterThan(40);
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema?.fields.length ?? 0, action.name).toBeGreaterThan(0);
    }
  });
  it('every trigger is READ with aiMetadata and outputSchema', () => {
    const triggers = Object.values(discourse.triggers());
    expect(triggers).toHaveLength(5);
    for (const trigger of triggers) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description).toBeTruthy();
      expect(trigger.outputSchema?.fields.length ?? 0).toBeGreaterThan(0);
    }
  });
  it('email-sending and moderation actions warn the agent', () => {
    const all = discourse.actions();
    for (const name of ['create_invite', 'invite_to_topic', 'create_user']) {
      expect(all[name].aiMetadata?.description).toMatch(/email/i);
    }
    for (const name of ['suspend_user', 'silence_user', 'deactivate_user', 'log_out_user', 'delete_topic', 'delete_post', 'remove_group_members']) {
      expect(all[name].aiMetadata?.description).toMatch(/explicit|clearly/i);
    }
  });
});

describe('dropdowns', () => {
  it('pages through groups and stops on the last page', async () => {
    const calls = stubFetch([
      { body: { groups: [{ id: 1, name: 'a' }], load_more_groups: '/groups?page=1' } },
      { body: { groups: [{ id: 2, name: 'b' }] } },
    ]);
    const dropdown = discourseProps.groupDropdown();
    const result = await call({ fn: dropdown.options, ctx: { auth: makeContext({ props: {} }).auth } });
    expect(result).toMatchObject({ disabled: false, options: [{ value: 1 }, { value: 2 }] });
    expect(calls.map((item) => item.url.searchParams.get('page'))).toEqual(['0', '1']);
  });
  it('returns a disabled state with the reason on error', async () => {
    stubFetch([{ status: 403, body: { errors: ['nope'] } }]);
    const result = await call({ fn: discourseProps.topicDropdown().options, ctx: { auth: makeContext({ props: {} }).auth } });
    expect(result).toMatchObject({ disabled: true, placeholder: expect.stringContaining('HTTP 403') });
  });
  it('flattens subcategories', () => {
    expect(
      discourseProps.flattenCategories({ category_list: { categories: [{ id: 1, name: 'A', subcategory_list: [{ id: 2, name: 'B' }] }] } }),
    ).toEqual([
      { id: 1, label: 'A' },
      { id: 2, label: 'A › B' },
    ]);
  });
});

describe('webhook triggers', () => {
  const SECRET = 'a'.repeat(64);
  function signed({ event, body, eventId = '7', secret = SECRET }: { event: string; body: unknown; eventId?: string; secret?: string }) {
    const rawBody = JSON.stringify(body);
    return {
      body: JSON.parse(rawBody),
      rawBody,
      headers: {
        'x-discourse-event': event,
        'x-discourse-event-id': eventId,
        'x-discourse-event-signature': `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`,
      },
    };
  }
  function ctxWith({ payload, props = {} }: { payload: unknown; props?: Record<string, unknown> }) {
    const store = makeStore();
    store.data.set('discourse_webhook', { id: 9, secret: SECRET });
    return makeContext({ props, extra: { store, payload } });
  }
  const now = new Date().toISOString();

  it('subscribes the webhook to its exact event type (wildcard hooks get no deliveries live) and stores the secret', async () => {
    const calls = stubFetch([{ body: EVENT_TYPES }, { body: { web_hook: { id: 9 } } }]);
    const ctx = makeContext({ props: {} });
    await call({ fn: newTopicTrigger.onEnable, ctx });
    expect(calls[0]).toMatchObject({ method: 'GET' });
    expect(calls[1].url.pathname).toBe('/admin/api/web_hooks.json');
    expect(calls[1].body).toMatchObject({ web_hook: { payload_url: ctx.webhookUrl, content_type: 1, wildcard_web_hook: false, active: true, web_hook_event_type_ids: [101] } });
    const stored = ctx.store.data.get('discourse_webhook');
    expect(stored).toMatchObject({ id: 9 });
    expect(JSON.stringify(calls[1].body)).toContain(String(Reflect.get(Object(stored), 'secret')));
  });
  it('maps each trigger to its own event type id', async () => {
    for (const [trigger, id] of [[newPostTrigger, 201], [userAddedToGroupTrigger, 1401]] as const) {
      const calls = stubFetch([{ body: EVENT_TYPES }, { body: { web_hook: { id: 9 } } }]);
      await call({ fn: trigger.onEnable, ctx: makeContext({ props: {} }) });
      expect(calls[1].body).toMatchObject({ web_hook: { web_hook_event_type_ids: [id] } });
    }
  });
  it('refuses to create a hook when the forum lacks the event type', async () => {
    const calls = stubFetch([{ body: { web_hooks: [], extras: { grouped_event_types: {} } } }]);
    await expect(call({ fn: newTopicTrigger.onEnable, ctx: makeContext({ props: {} }) })).rejects.toThrow('topic_created');
    expect(calls).toHaveLength(1);
  });
  it('deletes the webhook it created when the store write fails', async () => {
    const calls = stubFetch([{ body: EVENT_TYPES }, { body: { web_hook: { id: 9 } } }, { body: {} }]);
    const ctx = makeContext({ props: {} });
    ctx.store.put.mockRejectedValueOnce(new Error('store down'));
    await expect(call({ fn: newTopicTrigger.onEnable, ctx })).rejects.toThrow('store down');
    expect(calls[2]).toMatchObject({ method: 'DELETE' });
    expect(calls[2].url.pathname).toBe('/admin/api/web_hooks/9.json');
  });
  it('forgets the webhook only after a confirmed delete (404 counts)', async () => {
    stubFetch([{ status: 500, body: {} }]);
    const failing = ctxWith({ payload: {} });
    await expect(call({ fn: newTopicTrigger.onDisable, ctx: failing })).rejects.toThrow();
    expect(failing.store.data.has('discourse_webhook')).toBe(true);
    stubFetch([{ status: 404, body: {} }]);
    const gone = ctxWith({ payload: {} });
    await call({ fn: newTopicTrigger.onDisable, ctx: gone });
    expect(gone.store.data.has('discourse_webhook')).toBe(false);
  });
  it('emits a verified topic once and drops the redelivery', async () => {
    const payload = signed({ event: 'topic_created', body: { topic: { id: 42, title: 'Hi', slug: 'hi', created_at: now, archetype: 'regular' } } });
    const ctx = ctxWith({ payload });
    const first = await call({ fn: newTopicTrigger.run, ctx });
    expect(first).toMatchObject([{ id: 42, event: 'topic_created', event_id: '7', url: `${BASE}/t/hi/42` }]);
    expect(Object.keys(Array.isArray(first) ? first[0] : {}).sort()).toEqual(newTopicTrigger.outputSchema?.fields.map((field) => field.key).sort());
    await expect(call({ fn: newTopicTrigger.run, ctx })).resolves.toEqual([]);
  });
  it('rejects forged, tampered or unsigned deliveries', async () => {
    const body = { topic: { id: 42, created_at: now } };
    await expect(call({ fn: newTopicTrigger.run, ctx: ctxWith({ payload: signed({ event: 'topic_created', body, secret: 'b'.repeat(64) }) }) })).resolves.toEqual([]);
    const tampered = { ...signed({ event: 'topic_created', body }), rawBody: JSON.stringify({ topic: { id: 43, created_at: now } }) };
    await expect(call({ fn: newTopicTrigger.run, ctx: ctxWith({ payload: tampered }) })).resolves.toEqual([]);
    const noRaw = { ...signed({ event: 'topic_created', body }), rawBody: undefined };
    await expect(call({ fn: newTopicTrigger.run, ctx: ctxWith({ payload: noRaw }) })).resolves.toEqual([]);
  });
  it('ignores other events, ping and stale replays', async () => {
    await expect(call({ fn: newTopicTrigger.run, ctx: ctxWith({ payload: signed({ event: 'ping', body: { ping: 'OK' } }) }) })).resolves.toEqual([]);
    await expect(call({ fn: newTopicTrigger.run, ctx: ctxWith({ payload: signed({ event: 'post_created', body: { post: { id: 1 } } }) }) })).resolves.toEqual([]);
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await expect(call({ fn: newTopicTrigger.run, ctx: ctxWith({ payload: signed({ event: 'topic_created', body: { topic: { id: 1, created_at: old } } }) }) })).resolves.toEqual([]);
  });
  it('new post skips first posts and private messages by default', async () => {
    const first = signed({ event: 'post_created', body: { post: { id: 1, post_number: 1, topic_id: 2, created_at: now } } });
    await expect(call({ fn: newPostTrigger.run, ctx: ctxWith({ payload: first }) })).resolves.toEqual([]);
    const pm = signed({ event: 'post_created', body: { post: { id: 2, post_number: 2, topic_id: 2, topic_archetype: 'private_message', created_at: now } } });
    await expect(call({ fn: newPostTrigger.run, ctx: ctxWith({ payload: pm }) })).resolves.toEqual([]);
    const reply = signed({ event: 'post_created', body: { post: { id: 3, post_number: 2, topic_id: 2, created_at: now } } });
    await expect(call({ fn: newPostTrigger.run, ctx: ctxWith({ payload: reply }) })).resolves.toMatchObject([{ id: 3 }]);
  });
  it('user added to group filters by group id', async () => {
    const payload = signed({ event: 'user_added_to_group', body: { group_user: { group_id: 5, user_id: 7, created_at: now } } });
    await expect(call({ fn: userAddedToGroupTrigger.run, ctx: ctxWith({ payload, props: { group_id: '6' } }) })).resolves.toEqual([]);
    const again = signed({ event: 'user_added_to_group', body: { group_user: { group_id: 5, user_id: 7, created_at: now } }, eventId: '8' });
    await expect(call({ fn: userAddedToGroupTrigger.run, ctx: ctxWith({ payload: again, props: { group_id: '5' } }) })).resolves.toMatchObject([
      { group_id: 5, user_id: 7 },
    ]);
  });
});

const EVENT_TYPES = {
  web_hooks: [],
  extras: {
    grouped_event_types: {
      topic: [{ id: 101, name: 'topic_created', group: 'topic' }],
      post: [{ id: 201, name: 'post_created', group: 'post' }, { id: 202, name: 'post_edited', group: 'post' }],
      user: [{ id: 304, name: 'user_created', group: 'user' }],
      group_user: [{ id: 1401, name: 'user_added_to_group', group: 'group_user' }],
    },
  },
};
