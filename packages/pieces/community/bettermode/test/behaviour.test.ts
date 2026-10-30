import { afterEach, describe, expect, it, vi } from 'vitest';
import { bettermode } from '../src';
import { getPostAction, listPostsAction, updatePostAction, createReplyAction } from '../src/lib/actions/ai/posts';
import { getSpaceAction, removeMemberFromSpaceAction } from '../src/lib/actions/ai/spaces';
import { findMemberByEmailAction, getMemberAction, inviteMembersAction, updateMemberAction } from '../src/lib/actions/ai/members';
import { assignBadgeToMemberAction } from '../src/lib/actions/ai/community';
import { bettermodeAuth } from '../src/lib/auth';
import { assertCustomCallUrl, BettermodeApiError, bettermodeQuery, clearSessionCache, normalizeDomain } from '../src/lib/common/client';
import { badgesDropdown, memberSpacesDropdown } from '../src/lib/common/props';
import { bettermodePolling } from '../src/lib/common/polling';
import { newMemberTrigger } from '../src/lib/triggers/new-member';
import { newPostTrigger } from '../src/lib/triggers/new-post';
import { newReplyTrigger } from '../src/lib/triggers/new-reply';
import { StoreScope } from '@activepieces/pieces-framework';
import { businessCalls, call, makeAuth, makeContext, makeStore, MEMBER_TOKEN, pageOf, stubGraphql } from './helpers';

type TestStore = ReturnType<typeof makeStore>;

async function seedStoredToken({ store, token, expiresAt }: { store: TestStore; token: string; expiresAt?: number }) {
  const probe = makeStore();
  stubGraphql({ GetPost: { post: { id: 'seed' } } });
  await call({ fn: getPostAction.run, ctx: { ...makeContext({ props: { post_id: 'seed' } }), store: probe } });
  clearSessionCache();
  const [key] = probe.put.mock.calls[0];
  store.data.set(key, { accessToken: token, memberId: 'selfMember1', memberName: 'Self', expiresAt: expiresAt ?? Date.now() + 600000 });
}

function firstStored(store: TestStore): unknown {
  return [...store.data.values()][0];
}

afterEach(() => {
  clearSessionCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function validate(auth: Record<string, string>) {
  return call({ fn: bettermodeAuth.validate, ctx: { auth } });
}

describe('metadata', () => {
  const actions = Object.values(bettermode.actions());
  const triggers = Object.values(bettermode.triggers());

  it('has the expected audience split', () => {
    const count = (audience: string) => actions.filter((action) => action.audience === audience).length;
    expect(count('ai')).toBe(39);
    expect(count('human')).toBe(5);
    expect(count('both')).toBe(0);
    expect(triggers.map((trigger) => trigger.name).sort()).toEqual(['new_member', 'new_post', 'new_reply']);
  });

  it('tags every hand-written action and trigger', () => {
    for (const action of actions.filter((item) => item.name !== 'custom_api_call')) {
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      expect(action.outputSchema?.fields.length, action.name).toBeGreaterThan(0);
    }
    for (const trigger of triggers) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description).toBeTruthy();
      expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });

  it('marks deletes and suspensions as destructive and not idempotent', () => {
    const destructive = actions.filter((action) => action.classification === 'DESTRUCTIVE').map((action) => action.name).sort();
    expect(destructive).toEqual(['delete_member', 'delete_post', 'remove_member_from_space', 'suspend_member']);
    for (const action of actions.filter((item) => item.classification === 'DESTRUCTIVE')) {
      expect(action.aiMetadata?.idempotent).toBe(false);
    }
  });

  it('keeps legacy action names and demotes them to human', () => {
    for (const name of ['create_discussion', 'create_question', 'assign_badge', 'revoke_badge']) {
      expect(bettermode.getAction(name)?.audience).toBe('human');
    }
  });

  it('declares 0.88.2 as minimum release', () => {
    expect(bettermode.minimumSupportedRelease).toBe('0.88.2');
  });
});

describe('domain normalisation', () => {
  it.each([
    ['community.example.com', 'community.example.com'],
    ['https://Community.Example.com/', 'community.example.com'],
    ['http://community.example.com/spaces?x=1', 'community.example.com'],
    [' community.example.com:443 ', 'community.example.com'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it.each(['', 'not a host', 'user@evil.io', 'https://user@evil.io', 'localhost'])('rejects %s', (input) => {
    expect(() => normalizeDomain(input)).toThrow();
  });
});

describe('custom API call host guard', () => {
  const region = 'https://api.bettermode.com';
  it.each(['/', '', 'graphql', 'https://api.bettermode.com', 'https://api.bettermode.com/x'])('allows %s', (url) => {
    expect(() => assertCustomCallUrl({ region, url })).not.toThrow();
  });
  it.each([
    'https://api.bettermode.com.evil.io/',
    'https://evil.io',
    '//evil.io/x',
    'http://api.bettermode.com/',
    'https://user@api.bettermode.com/',
    'https://api.bettermode.de/',
    '../x',
  ])('refuses %s', (url) => {
    expect(() => assertCustomCallUrl({ region, url })).toThrow();
  });

  it('runs inside the custom API call auth mapping before any login', async () => {
    const calls = stubGraphql({});
    const action = bettermode.getAction('custom_api_call');
    await expect(
      call({
        fn: action?.run,
        ctx: { ...makeContext({ props: { method: 'POST', url: { url: 'https://evil.io/steal' }, headers: {}, queryParams: {} } }) },
      })
    ).rejects.toThrow('Custom API calls can only go to https://api.bettermode.com');
    expect(calls).toHaveLength(0);
  });
});

describe('auth.validate', () => {
  it('accepts a domain with scheme and sends the bare host as networkDomain', async () => {
    const calls = stubGraphql({});
    const result = await validate(makeAuth({ domain: 'https://community.example.com/' }));
    expect(result).toEqual({ valid: true });
    expect(calls[0].operation).toBe('GetGuestToken');
    expect(calls[0].variables).toEqual({ domain: 'community.example.com' });
    expect(calls[0].headers['authorization']).toBeUndefined();
    expect(calls[1].operation).toBe('Login');
    expect(calls[1].headers['authorization']).toBe('Bearer guest-token');
  });

  it('reports an unknown community domain, not invalid credentials', async () => {
    stubGraphql({ GetGuestToken: { body: { errors: [{ message: 'Network not found', code: '110' }] } } });
    const result = await validate(makeAuth());
    expect(result).toMatchObject({ valid: false });
    expect(String(Reflect.get(Object(result), 'error'))).toContain('Community domain not found');
  });

  it('reports a failed login as invalid credentials', async () => {
    stubGraphql({ Login: { body: { errors: [{ message: 'Invalid email or password' }] } } });
    const result = await validate(makeAuth());
    expect(String(Reflect.get(Object(result), 'error'))).toContain('Invalid credentials');
  });

  it('reports the login lockout (code 120) as a wait, not invalid credentials', async () => {
    stubGraphql({
      Login: {
        body: { errors: [{ code: '120', message: "You've made too many wrong attempts to login into your account. Please wait 5 minutes and try again." }] },
      },
    });
    const result = await validate(makeAuth());
    const error = String(Reflect.get(Object(result), 'error'));
    expect(error).toContain('Wait 5 minutes');
    expect(error).not.toContain('Invalid credentials');
  });

  it('does not call a server error invalid credentials', async () => {
    stubGraphql({ Login: { status: 503, body: { message: 'down' } } });
    const result = await validate(makeAuth());
    const error = String(Reflect.get(Object(result), 'error'));
    expect(error).toContain('Could not reach Bettermode');
    expect(error).not.toContain('Invalid credentials');
  });

  it('maps HTTP 401 to invalid credentials', async () => {
    stubGraphql({ Login: { status: 401, body: {} } });
    const result = await validate(makeAuth());
    expect(String(Reflect.get(Object(result), 'error'))).toContain('Invalid credentials');
  });

  it('rejects an unknown region before any request', async () => {
    const calls = stubGraphql({});
    await expect(
      call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p' }, auth: makeAuth({ region: 'https://api.bettermode.com.evil.io' }) }) })
    ).rejects.toThrow('Select the US or EU region');
    expect(calls).toHaveLength(0);
  });

  it('rejects an invalid email before any request', async () => {
    const calls = stubGraphql({});
    const result = await validate(makeAuth({ email: 'nope' }));
    expect(result).toEqual({ valid: false, error: 'Enter a valid email address.' });
    expect(calls).toHaveLength(0);
  });
});

describe('session and transport', () => {
  it('logs in once per run even with several requests', async () => {
    const calls = stubGraphql({
      GetSpacePostTypes: { space: { authMemberProps: { availablePostTypes: [{ id: 'pt', name: 'Discussion' }] } } },
      CreatePost: { createPost: { id: 'p1' } },
    });
    await call({
      fn: bettermode.getAction('create_discussion')?.run,
      ctx: makeContext({ props: { spaceId: 's', title: 'T', content: 'C' } }),
    });
    expect(calls.filter((item) => item.operation === 'GetGuestToken')).toHaveLength(1);
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
  });

  it('reuses the session across runs of the same connection (Bettermode locks out repeated logins)', async () => {
    const calls = stubGraphql({ GetPost: { post: { id: 'p1' } } });
    await call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p1' } }) });
    await call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p1' } }) });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
    await call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p1' }, auth: makeAuth({ password: 'other-secret' }) }) });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(2);
  });

  it('drops a stored token rejected with 401, logs in once and retries once', async () => {
    const ctx = makeContext({ props: { post_id: 'p1' } });
    await seedStoredToken({ store: ctx.store, token: 'stale-token' });
    const calls = stubGraphql({ GetPost: [{ status: 401, body: {} }, { body: { data: { post: { id: 'p1' } } } }] });
    const out = await call({ fn: getPostAction.run, ctx });
    expect(out).toMatchObject({ id: 'p1' });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
    expect(calls.filter((item) => item.operation === 'GetPost').map((item) => item.headers['authorization'])).toEqual([
      'Bearer stale-token',
      `Bearer ${MEMBER_TOKEN}`,
    ]);
    expect(ctx.store.delete).toHaveBeenCalledTimes(1);
    expect(firstStored(ctx.store)).toMatchObject({ accessToken: MEMBER_TOKEN });
  });

  it('does not log in a second time when a freshly issued token is rejected', async () => {
    const calls = stubGraphql({ GetPost: { status: 401, body: {} } });
    await expect(call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p1' } }) })).rejects.toThrow('HTTP 401');
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
  });

  it('uses a valid stored token without logging in', async () => {
    const ctx = makeContext({ props: { post_id: 'p1' } });
    await seedStoredToken({ store: ctx.store, token: 'stored-token' });
    const calls = stubGraphql({ GetPost: { post: { id: 'p1' } } });
    await call({ fn: getPostAction.run, ctx });
    expect(calls.map((item) => item.operation)).toEqual(['GetPost']);
    expect(calls[0].headers['authorization']).toBe('Bearer stored-token');
    expect(ctx.store.put).not.toHaveBeenCalled();
  });

  it('logs in on a store miss and saves only the token, member and expiry in project scope', async () => {
    const calls = stubGraphql({ GetPost: { post: { id: 'p1' } } });
    const ctx = makeContext({ props: { post_id: 'p1' } });
    const out = await call({ fn: getPostAction.run, ctx });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
    expect(ctx.store.put).toHaveBeenCalledTimes(1);
    const [key, value, scope] = ctx.store.put.mock.calls[0];
    expect(scope).toBe(StoreScope.PROJECT);
    expect(key).toMatch(/^bettermode_token_[0-9a-f]{64}$/);
    expect(Object.keys(Object(value)).sort()).toEqual(['accessToken', 'expiresAt', 'memberId', 'memberName']);
    expect(Reflect.get(Object(value), 'expiresAt')).toBeGreaterThan(Date.now());
    const serialized = JSON.stringify(ctx.store.put.mock.calls);
    expect(serialized).not.toContain('hunter2-secret');
    expect(serialized).not.toContain('admin@example.com');
    expect(JSON.stringify(out)).not.toContain(MEMBER_TOKEN);
  });

  it('Custom API Call reuses the stored project token instead of logging in', async () => {
    const ctx = makeContext({
      props: { method: 'POST', url: { url: 'https://api.bettermode.com' }, headers: {}, queryParams: {}, body_type: 'json', body: { data: { query: 'query Ping { network { id } }' } } },
    });
    await seedStoredToken({ store: ctx.store, token: 'stored-token' });
    const calls = stubGraphql({ Ping: { network: { id: 'n1' } } });
    await call({ fn: bettermode.getAction('custom_api_call')?.run, ctx });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(0);
    expect(calls.at(-1)?.headers['authorization']).toBe('Bearer stored-token');
  });

  it('logs in again when the stored token has expired', async () => {
    const ctx = makeContext({ props: { post_id: 'p1' } });
    await seedStoredToken({ store: ctx.store, token: 'old-token', expiresAt: Date.now() - 1000 });
    const calls = stubGraphql({ GetPost: { post: { id: 'p1' } } });
    await call({ fn: getPostAction.run, ctx });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
    expect(calls.find((item) => item.operation === 'GetPost')?.headers['authorization']).toBe(`Bearer ${MEMBER_TOKEN}`);
    expect(firstStored(ctx.store)).toMatchObject({ accessToken: MEMBER_TOKEN });
  });

  it('keeps a 5-minute Bettermode JWT usable (expiry from exp minus a short margin)', async () => {
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
    const jwt = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;
    const calls = stubGraphql({
      Login: { body: { data: { loginNetwork: { accessToken: jwt, member: { id: 'selfMember1', name: 'Self' } } } } },
      GetPost: { post: { id: 'p1' } },
    });
    const ctx = makeContext({ props: { post_id: 'p1' } });
    await call({ fn: getPostAction.run, ctx });
    await call({ fn: getPostAction.run, ctx });
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
    const expiresAt = Number(Reflect.get(Object(firstStored(ctx.store)), 'expiresAt'));
    expect(expiresAt - Date.now()).toBeGreaterThan(240000);
    expect(expiresAt - Date.now()).toBeLessThanOrEqual(300000);
  });

  it('shares one login across separate runs through the store', async () => {
    const calls = stubGraphql({ GetPost: { post: { id: 'p1' } } });
    const store = makeStore();
    for (let run = 0; run < 3; run++) {
      clearSessionCache();
      const ctx = makeContext({ props: { post_id: 'p1' } });
      await call({ fn: getPostAction.run, ctx: { ...ctx, store } });
    }
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
  });

  it('reports the login lockout as a 5-minute wait without retrying', async () => {
    const calls = stubGraphql({
      Login: { body: { errors: [{ code: '120', message: "You've made too many wrong attempts to login into your account." }] } },
    });
    await expect(call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p1' } }) })).rejects.toThrow('Wait 5 minutes');
    expect(calls.filter((item) => item.operation === 'Login')).toHaveLength(1);
  });

  it('never logs the password when the login request fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubGraphql({ Login: { status: 500, body: { message: 'boom' } } });
    await expect(bettermodeQuery({ auth: makeAuth(), query: 'query X { a }' })).rejects.toThrow();
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain('hunter2-secret');
  });

  it('turns GraphQL errors into a message with code and path, keeping the body under responseBody', async () => {
    stubGraphql({ GetPost: { body: { errors: [{ message: 'Post not found', code: '404', path: ['post'] }] } } });
    const error = await call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p' } }) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BettermodeApiError);
    expect(String(Reflect.get(Object(error), 'message'))).toBe('Bettermode error (code 404, at post): Post not found');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
    expect(Reflect.get(Object(error), 'responseBody')).toBeDefined();
  });

  it('maps HTTP 403 to a permission message', async () => {
    stubGraphql({ GetPost: { status: 403, body: {} } });
    await expect(call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p' } }) })).rejects.toThrow(
      'connected member lacks permission'
    );
  });

  it('retries 429 twice then succeeds', async () => {
    vi.useFakeTimers();
    const calls = stubGraphql({
      GetPost: [{ status: 429, body: {} }, { status: 429, body: {} }, { body: { data: { post: { id: 'p' } } } }],
    });
    const pending = call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p' } }) });
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toMatchObject({ id: 'p' });
    expect(businessCalls(calls)).toHaveLength(3);
  });

  it('gives up after two 429 retries', async () => {
    vi.useFakeTimers();
    stubGraphql({ GetPost: [{ status: 429, body: {} }, { status: 429, body: {} }, { status: 429, body: {} }] });
    const pending = call({ fn: getPostAction.run, ctx: makeContext({ props: { post_id: 'p' } }) }).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    expect(String(Reflect.get(Object(await pending), 'message'))).toContain('rate limit');
  });

  it('fails when Bettermode reports a failed action status', async () => {
    stubGraphql({ AssignBadge: { assignBadge: { status: 'failed' } } });
    await expect(
      call({ fn: assignBadgeToMemberAction.run, ctx: makeContext({ props: { badge_id: 'b', member_id: 'm' } }) })
    ).rejects.toThrow('Bettermode did not complete assignBadge (status: failed)');
  });

  it('fails remove_member_from_space when any status failed', async () => {
    stubGraphql({ RemoveSpaceMembers: { removeSpaceMembers: [{ status: 'succeeded' }, { status: 'failed' }] } });
    await expect(
      call({ fn: removeMemberFromSpaceAction.run, ctx: makeContext({ props: { space_id: 's', member_ids: ['a', 'b'] } }) })
    ).rejects.toThrow('did not remove every member');
  });
});

describe('input validation', () => {
  it.each([
    [getSpaceAction, {}, 'Give exactly one of Space ID or Space Slug.'],
    [getSpaceAction, { space_id: 'a', slug: 'b' }, 'Give exactly one of Space ID or Space Slug.'],
    [getMemberAction, { member_id: 'a', username: 'b' }, 'Give exactly one of Member ID, Username or External ID.'],
    [updatePostAction, { post_id: 'p' }, 'Give at least one field to update.'],
    [updatePostAction, { post_id: 'p', tag_names: ['a'], clear_tags: true }, 'Give Tags or Clear Tags, not both.'],
    [updateMemberAction, { member_id: 'm' }, 'Give at least one field to update.'],
    [updateMemberAction, { tagline: 'x', clear_tagline: true }, 'Give Tagline or Clear Tagline, not both.'],
    [listPostsAction, { limit: 0 }, 'Limit must be a whole number between 1 and 100.'],
    [listPostsAction, { limit: 101 }, 'Limit must be a whole number between 1 and 100.'],
    [listPostsAction, { order_by: 'title; drop' }, 'Order By must be one of'],
    [findMemberByEmailAction, { email: 'not-an-email' }, 'Email must be a valid email address.'],
    [inviteMembersAction, { emails: [] }, 'Emails must contain between 1 and 20 addresses.'],
    [inviteMembersAction, { emails: ['ok@example.com', 'bad'] }, 'Each email must be a valid email address.'],
    [removeMemberFromSpaceAction, { space_id: 's', member_ids: [] }, 'Member IDs must contain at least one member ID.'],
  ])('%#', async (action, props, message) => {
    const calls = stubGraphql({});
    await expect(call({ fn: action.run, ctx: makeContext({ props }) })).rejects.toThrow(message);
    expect(businessCalls(calls)).toHaveLength(0);
  });

  it('update_post omits fields that were not given', async () => {
    const calls = stubGraphql({ UpdatePost: { updatePost: { id: 'p' } } });
    await call({ fn: updatePostAction.run, ctx: makeContext({ props: { post_id: 'p', content: '<b>x</b>', tag_names: ['a'] } }) });
    expect(businessCalls(calls)[0].variables).toEqual({
      id: 'p',
      input: { mappingFields: [{ key: 'content', type: 'html', value: '"<b>x</b>"' }], tagNames: ['a'] },
    });
  });

  it('find_member_by_email returns found false when only partial matches exist', async () => {
    stubGraphql({ FindMembers: { members: pageOf([{ id: 'x', email: 'joann@example.com' }]) } });
    await expect(
      call({ fn: findMemberByEmailAction.run, ctx: makeContext({ props: { email: 'ann@example.com' } }) })
    ).resolves.toEqual({ found: false, member: null });
  });

  it('find_member_by_email pages until it finds the exact email', async () => {
    const calls = stubGraphql({
      FindMembers: [
        { body: { data: { members: pageOf({ nodes: [{ id: 'x', email: 'joann@example.com' }], hasNextPage: true, endCursor: 'c2' }) } } },
        { body: { data: { members: pageOf([{ id: 'm1', email: 'ann@example.com' }]) } } },
      ],
    });
    const result = await call({ fn: findMemberByEmailAction.run, ctx: makeContext({ props: { email: 'ann@example.com' } }) });
    expect(result).toMatchObject({ found: true, member: { id: 'm1' } });
    expect(businessCalls(calls)[1].variables).toMatchObject({ after: 'c2' });
  });

  it('create_reply defaults to the first reply type the parent allows', async () => {
    const calls = stubGraphql({
      GetReplyTypes: { post: { id: 'p', postType: { validReplyTypes: [{ id: 'comment', name: 'Comment' }] } } },
      CreateReply: { createReply: { id: 'r' } },
    });
    await call({ fn: createReplyAction.run, ctx: makeContext({ props: { post_id: 'p', content: 'hi' } }) });
    expect(businessCalls(calls)[1].variables).toMatchObject({ input: { postTypeId: 'comment' } });
  });

  it('create_reply explains when the parent accepts no replies', async () => {
    stubGraphql({ GetReplyTypes: { post: { id: 'p', postType: { validReplyTypes: [] } } } });
    await expect(
      call({ fn: createReplyAction.run, ctx: makeContext({ props: { post_id: 'p', content: 'hi' } }) })
    ).rejects.toThrow('does not accept replies');
  });
});

describe('dropdowns', () => {
  function options({ prop, auth }: { prop: unknown; auth: unknown }) {
    return call({ fn: Reflect.get(Object(prop), 'options'), ctx: { auth } });
  }

  it('spaces dropdown pages through every space the member joined', async () => {
    const calls = stubGraphql({
      ListSpaces: [
        { body: { data: { spaces: pageOf({ nodes: [{ id: 's1', name: 'One' }], hasNextPage: true, endCursor: 'c2' }) } } },
        { body: { data: { spaces: pageOf([{ id: 's2', name: 'Two' }]) } } },
      ],
    });
    const result = await options({ prop: memberSpacesDropdown, auth: { props: makeAuth() } });
    expect(result).toEqual({
      disabled: false,
      options: [
        { label: 'One', value: 's1' },
        { label: 'Two', value: 's2' },
      ],
    });
    expect(businessCalls(calls)[0].variables).toMatchObject({ memberId: 'selfMember1', limit: 100 });
    expect(businessCalls(calls)[1].variables).toMatchObject({ after: 'c2' });
  });

  it('dropdowns show a disabled state with a reason on error', async () => {
    stubGraphql({ ListBadges: { status: 403, body: {} } });
    const result = await options({ prop: badgesDropdown, auth: { props: makeAuth() } });
    expect(result).toMatchObject({ disabled: true, options: [] });
    expect(String(Reflect.get(Object(result), 'placeholder'))).toContain('Could not load badges');
  });

  it('dropdowns ask for a connection first', async () => {
    await expect(options({ prop: memberSpacesDropdown, auth: undefined })).resolves.toMatchObject({ disabled: true });
  });
});

function postNode({ id, createdAt, publishedAt, status }: { id: string; createdAt: string; publishedAt?: string | null; status?: string }) {
  return { id, title: id, createdAt, publishedAt: publishedAt === undefined ? createdAt : publishedAt, status: status ?? 'PUBLISHED' };
}

function triggerContext({ store = makeStore(), props = {} }: { store?: ReturnType<typeof makeStore>; props?: Record<string, unknown> }) {
  return { auth: { props: makeAuth() }, propsValue: props, store };
}

describe('polling triggers', () => {
  it('new_post stores the newest post as checkpoint on enable', async () => {
    const calls = stubGraphql({
      PollPosts: { posts: pageOf([postNode({ id: 'b', createdAt: '2026-10-13T10:00:00.000Z' }), postNode({ id: 'a', createdAt: '2026-10-13T09:00:00.000Z' })]) },
    });
    const store = makeStore();
    await call({ fn: newPostTrigger.onEnable, ctx: triggerContext({ store, props: { space_ids: ['s1'] } }) });
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({
      lastCreatedAt: '2026-10-13T10:00:00.000Z',
      idsAtLast: ['b'],
    });
    expect(businessCalls(calls)[0].variables).toMatchObject({ spaceIds: ['s1'], orderBy: 'publishedAt', reverse: true });
  });

  it('new_post emits only new posts, oldest first, including same-time posts not seen yet', async () => {
    stubGraphql({
      PollPosts: {
        posts: pageOf([
          postNode({ id: 'd', createdAt: '2026-10-13T12:00:00.000Z' }),
          postNode({ id: 'c', createdAt: '2026-10-13T11:00:00.000Z' }),
          postNode({ id: 'b2', createdAt: '2026-10-13T10:00:00.000Z' }),
          postNode({ id: 'b', createdAt: '2026-10-13T10:00:00.000Z' }),
          postNode({ id: 'a', createdAt: '2026-10-13T09:00:00.000Z' }),
        ]),
      },
    });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T10:00:00.000Z', idsAtLast: ['b'] });
    const items = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    expect(Array.isArray(items) ? items.map((item) => item.id) : items).toEqual(['b2', 'c', 'd']);
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({ lastCreatedAt: '2026-10-13T12:00:00.000Z', idsAtLast: ['d'] });
  });

  it('new_post pages back until it reaches the checkpoint', async () => {
    const calls = stubGraphql({
      PollPosts: [
        { body: { data: { posts: pageOf({ nodes: [postNode({ id: 'c', createdAt: '2026-10-13T12:00:00.000Z' })], hasNextPage: true, endCursor: 'p2' }) } } },
        { body: { data: { posts: pageOf({ nodes: [postNode({ id: 'b', createdAt: '2026-10-13T11:00:00.000Z' }), postNode({ id: 'a', createdAt: '2026-10-13T09:00:00.000Z' })], hasNextPage: true, endCursor: 'p3' }) } } },
      ],
    });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T10:00:00.000Z', idsAtLast: [] });
    const items = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    expect(Array.isArray(items) ? items.map((item) => item.id) : items).toEqual(['b', 'c']);
    expect(businessCalls(calls)).toHaveLength(2);
  });

  it('new_post returns nothing and keeps the checkpoint when nothing is new', async () => {
    stubGraphql({ PollPosts: { posts: pageOf([postNode({ id: 'a', createdAt: '2026-10-13T09:00:00.000Z' })]) } });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T09:00:00.000Z', idsAtLast: ['a'] });
    await expect(call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) })).resolves.toEqual([]);
    expect(store.put.mock.calls.filter(([key]) => key === bettermodePolling.CHECKPOINT_KEY)).toHaveLength(0);
  });

  it('fails loudly if Bettermode returns oldest first', async () => {
    stubGraphql({
      PollPosts: { posts: pageOf([postNode({ id: 'a', createdAt: '2026-10-13T09:00:00.000Z' }), postNode({ id: 'b', createdAt: '2026-10-13T11:00:00.000Z' })]) },
    });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T10:00:00.000Z', idsAtLast: [] });
    await expect(call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) })).rejects.toThrow('unexpected order');
  });

  it('caps one poll at 100 items and advances only to what it emitted', async () => {
    const nodes = Array.from({ length: 120 }, (_, index) =>
      postNode({ id: `p${String(index).padStart(3, '0')}`, createdAt: new Date(Date.UTC(2026, 9, 13, 12, 0, 0) - index * 1000).toISOString() })
    );
    stubGraphql({ PollPosts: { posts: pageOf(nodes) } });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-01T00:00:00.000Z', idsAtLast: [] });
    const items = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    expect(Array.isArray(items) ? items.length : 0).toBe(100);
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({
      lastCreatedAt: nodes[20].createdAt,
      idsAtLast: ['p020'],
    });
  });

  it('new_post fires for a draft created before the checkpoint and published after it', async () => {
    stubGraphql({
      PollPosts: {
        posts: pageOf([
          postNode({ id: 'old-draft', createdAt: '2026-10-13T08:00:00.000Z', publishedAt: '2026-10-13T11:00:00.000Z' }),
          postNode({ id: 'still-draft', createdAt: '2026-10-13T10:30:00.000Z', publishedAt: null, status: 'DRAFT' }),
          postNode({ id: 'a', createdAt: '2026-10-13T09:00:00.000Z' }),
        ]),
      },
    });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T10:00:00.000Z', idsAtLast: [] });
    const items = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    expect(Array.isArray(items) ? items.map((item) => item.id) : items).toEqual(['old-draft']);
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({ lastCreatedAt: '2026-10-13T11:00:00.000Z', idsAtLast: ['old-draft'] });
  });

  it('drains a 650-post backlog oldest first across polls and never loops', async () => {
    const feed = fakePostFeed({ count: 0 });
    const store = makeStore();
    const calls = stubGraphql({ PollPosts: feed.handler });
    feed.add(1);
    await call({ fn: newPostTrigger.onEnable, ctx: triggerContext({ store }) });
    feed.add(650);
    const id = (index: number) => `n${String(index).padStart(5, '0')}`;
    const first = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    expect(first).toEqual([]);
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toMatchObject({ resumeCursors: [id(152)] });
    const second = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    expect(businessCalls(calls)[12].variables).toMatchObject({ after: id(152) });
    expect(Array.isArray(second) ? [second.length, second[0].id, second[99].id] : second).toEqual([100, id(2), id(101)]);
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({ lastCreatedAt: '2026-10-13T12:01:41.000Z', idsAtLast: [id(101)], resumeCursors: [id(152)] });
    const rest = await pollUntilQuiet({ store, polls: 12 });
    expect(rest).toEqual(Array.from({ length: 550 }, (_, index) => id(102 + index)));
    expect(await pollUntilQuiet({ store, polls: 4 })).toEqual([]);
  });

  it('new_post on an empty community starts from now', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-13T00:00:00.000Z'));
    stubGraphql({ PollPosts: { posts: pageOf([]) } });
    const store = makeStore();
    await call({ fn: newPostTrigger.onEnable, ctx: triggerContext({ store }) });
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({ lastCreatedAt: '2026-10-13T00:00:00.000Z', idsAtLast: [] });
  });

  it.each([
    ['new_post', newPostTrigger],
    ['new_member', newMemberTrigger],
    ['new_reply', newReplyTrigger],
  ])('%s keeps its checkpoint across a republish', async (_name, trigger) => {
    const calls = stubGraphql({});
    const store = makeStore();
    const saved = { lastCreatedAt: '2026-10-13T09:00:00.000Z', idsAtLast: ['x1'] };
    store.data.set(bettermodePolling.CHECKPOINT_KEY, saved);
    await call({ fn: trigger.onDisable, ctx: { ...triggerContext({ store }), isRepublish: true } });
    await call({ fn: trigger.onEnable, ctx: { ...triggerContext({ store }), isRepublish: true } });
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual(saved);
    expect(businessCalls(calls)).toEqual([]);
  });

  it('re-baselines on enable when a republish finds no checkpoint', async () => {
    stubGraphql({ PollMembers: { members: pageOf([{ id: 'm1', createdAt: '2026-10-13T09:00:00.000Z' }]) } });
    const store = makeStore();
    await call({ fn: newMemberTrigger.onEnable, ctx: { ...triggerContext({ store }), isRepublish: true } });
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({ lastCreatedAt: '2026-10-13T09:00:00.000Z', idsAtLast: ['m1'] });
  });

  it('new_member polls members by createdAt and emits new ones', async () => {
    const calls = stubGraphql({
      PollMembers: { members: pageOf([{ id: 'm2', name: 'New', createdAt: '2026-10-13T11:00:00.000Z' }, { id: 'm1', createdAt: '2026-10-13T09:00:00.000Z' }]) },
    });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T09:00:00.000Z', idsAtLast: ['m1'] });
    const items = await call({ fn: newMemberTrigger.run, ctx: triggerContext({ store }) });
    expect(items).toMatchObject([{ id: 'm2', name: 'New' }]);
    expect(businessCalls(calls)[0].variables).toMatchObject({ orderBy: 'createdAt', reverse: true });
  });

  it('new_reply reads the replies of the most recently active posts in one batched query', async () => {
    const calls = stubGraphql({
      PollActivePosts: { posts: { nodes: [{ id: 'p1', repliesCount: 2 }, { id: 'p2', repliesCount: 0 }, { id: 'p3', repliesCount: 1 }] } },
      PollReplies: {
        r0: { nodes: [{ id: 'r2', repliedToId: 'p1', createdAt: '2026-10-13T11:30:00.000Z' }, { id: 'r1', repliedToId: 'p1', createdAt: '2026-10-13T09:00:00.000Z' }] },
        r1: { nodes: [{ id: 'r3', repliedToId: 'p3', createdAt: '2026-10-13T11:00:00.000Z' }] },
      },
    });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T10:00:00.000Z', idsAtLast: [] });
    const items = await call({ fn: newReplyTrigger.run, ctx: triggerContext({ store }) });
    expect(items).toMatchObject([
      { id: 'r3', replied_to_id: 'p3' },
      { id: 'r2', replied_to_id: 'p1' },
    ]);
    const sent = businessCalls(calls);
    expect(sent[0].variables).toMatchObject({ orderBy: 'lastActivityAt', reverse: true });
    expect(sent[1].variables).toEqual({ p0: 'p1', p1: 'p3' });
    expect(sent[1].query).not.toContain('p1"');
    expect(store.data.get(bettermodePolling.CHECKPOINT_KEY)).toEqual({ lastCreatedAt: '2026-10-13T11:30:00.000Z', idsAtLast: ['r2'] });
  });

  it('new_reply skips the replies query when no active post has replies', async () => {
    const calls = stubGraphql({ PollActivePosts: { posts: { nodes: [{ id: 'p1', repliesCount: 0 }] } } });
    const store = makeStore();
    store.data.set(bettermodePolling.CHECKPOINT_KEY, { lastCreatedAt: '2026-10-13T10:00:00.000Z', idsAtLast: [] });
    const items = await call({ fn: newReplyTrigger.run, ctx: triggerContext({ store }) });
    expect(items).toEqual([]);
    expect(calls.some((item) => item.operation === 'PollReplies')).toBe(false);
  });

  it('run without a checkpoint asks to re-enable', async () => {
    stubGraphql({});
    await expect(call({ fn: newPostTrigger.run, ctx: triggerContext({}) })).rejects.toThrow('re-enable');
  });
});

function fakePostFeed({ count, startIndex = 0 }: { count: number; startIndex?: number }) {
  const base = Date.UTC(2026, 9, 13, 12, 0, 0);
  const feed: ReturnType<typeof postNode>[] = [];
  let next = startIndex;
  const add = (amount: number) => {
    const added = Array.from({ length: amount }, () => {
      next += 1;
      return postNode({ id: `n${String(next).padStart(5, '0')}`, createdAt: new Date(base + next * 1000).toISOString() });
    });
    feed.unshift(...added.reverse());
  };
  const addSameTime = (amount: number) => {
    const createdAt = new Date(base + (next + 1) * 1000).toISOString();
    const added = Array.from({ length: amount }, () => {
      next += 1;
      return postNode({ id: `n${String(next).padStart(5, '0')}`, createdAt });
    });
    feed.unshift(...added);
  };
  add(count);
  const handler = (sent: { variables: Record<string, unknown> }) => {
    const after = sent.variables['after'];
    const limit = Number(sent.variables['limit']);
    const start = typeof after === 'string' ? feed.findIndex((item) => item.id === after) + 1 : 0;
    const nodes = feed.slice(start, start + limit);
    return {
      body: {
        data: { posts: pageOf({ nodes, hasNextPage: start + limit < feed.length, endCursor: nodes.length > 0 ? nodes[nodes.length - 1].id : null }) },
      },
    };
  };
  return { feed, add, addSameTime, handler };
}

async function pollUntilQuiet({ store, polls }: { store: ReturnType<typeof makeStore>; polls: number }) {
  const emitted: string[] = [];
  for (let index = 0; index < polls; index++) {
    const items = await call({ fn: newPostTrigger.run, ctx: triggerContext({ store }) });
    if (Array.isArray(items)) {
      emitted.push(...items.map((item) => String(item.id)));
    }
  }
  return emitted;
}

describe('polling bursts larger than the page budget', () => {
  it.each([650, 1000, 1234, 2600])('fires each of %i new posts exactly once and then stays quiet', async (burst) => {
    const feed = fakePostFeed({ count: 0 });
    const store = makeStore();
    stubGraphql({ PollPosts: feed.handler });
    feed.add(1);
    await call({ fn: newPostTrigger.onEnable, ctx: triggerContext({ store }) });
    feed.add(burst);
    const emitted = await pollUntilQuiet({ store, polls: Math.ceil(burst / 100) * 3 + 10 });
    const expected = feed.feed.slice(0, burst).map((item) => item.id).reverse();
    expect(new Set(emitted).size).toBe(emitted.length);
    expect([...emitted].sort()).toEqual([...expected].sort());
    expect(await pollUntilQuiet({ store, polls: 3 })).toEqual([]);
  });

  it.each([120, 250, 900, 2500])('fires each of %i posts sharing one timestamp exactly once when Bettermode lists them in ID order', async (burst) => {
    const feed = fakePostFeed({ count: 0 });
    const store = makeStore();
    stubGraphql({ PollPosts: feed.handler });
    feed.add(1);
    await call({ fn: newPostTrigger.onEnable, ctx: triggerContext({ store }) });
    feed.addSameTime(burst);
    const emitted = await pollUntilQuiet({ store, polls: Math.ceil(burst / 100) * 3 + 10 });
    const expected = feed.feed.slice(0, burst).map((item) => item.id);
    expect(new Set(emitted).size).toBe(emitted.length);
    expect([...emitted].sort()).toEqual([...expected].sort());
    expect(await pollUntilQuiet({ store, polls: 3 })).toEqual([]);
  });

  it('keeps up when new posts arrive while a large backlog drains', async () => {
    const feed = fakePostFeed({ count: 0 });
    const store = makeStore();
    stubGraphql({ PollPosts: feed.handler });
    feed.add(1);
    await call({ fn: newPostTrigger.onEnable, ctx: triggerContext({ store }) });
    feed.add(1200);
    const emitted: string[] = [];
    for (let round = 0; round < 40; round++) {
      emitted.push(...(await pollUntilQuiet({ store, polls: 1 })));
      if (round < 20) {
        feed.add(30);
      }
    }
    const expected = feed.feed.slice(0, feed.feed.length - 1).map((item) => item.id);
    expect(new Set(emitted).size).toBe(emitted.length);
    expect([...emitted].sort()).toEqual([...expected].sort());
  });
});
