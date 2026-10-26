import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { discourse } from '../src';
import { createUserAction } from '../src/lib/actions/ai/create-user';
import { getUserAction } from '../src/lib/actions/ai/get-user';
import { discourseNetwork } from '../src/lib/common/network-guard';
import { newTopicTrigger } from '../src/lib/triggers/new-topic';
import { API_KEY, BASE, call, makeContext, makeStore, stubFetch } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('resolved address guard', () => {
  it.each([
    '10.0.0.5',
    '127.0.0.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    '::',
    '::ffff:10.0.0.5',
    '::ffff:a00:5',
    '::ffff:7f00:1',
    '0:0:0:0:0:ffff:a9fe:a9fe',
    '64:ff9b::a00:5',
    '2002:a00:5::1',
    'fd12::1',
    'fe80::1',
    'ff02::1',
  ])('blocks %s', (ip) => {
    expect(discourseNetwork.isBlockedIp(ip)).toBe(true);
  });
  it.each(['93.184.215.14', '2606:4700::6810:84e5', '::ffff:93.184.215.14'])('allows %s', (ip) => {
    expect(discourseNetwork.isBlockedIp(ip)).toBe(false);
  });
  it.each(['private.example.com', 'metadata.example.com', 'mapped.example.com', 'mapped-dotted.example.com', 'ula.example.com'])(
    'refuses a public name that resolves privately (%s) before any request',
    async (host) => {
      const calls = stubFetch([{ body: { user: { id: 1 } } }]);
      await expect(
        call({ fn: getUserAction.run, ctx: makeContext({ props: { username: 'alice' }, websiteUrl: `https://${host}` }) }),
      ).rejects.toThrow('private network address');
      expect(calls).toHaveLength(0);
    },
  );
  it('checks the address again when the socket connects', async () => {
    const results = await new Promise<{ error: Error | null }>((resolve) => {
      discourseNetwork.guardedLookup('private.example.com', {}, (error) => resolve({ error }));
    });
    expect(results.error?.message).toContain('private network address');
    const ok = await new Promise<{ error: Error | null; address: unknown }>((resolve) => {
      discourseNetwork.guardedLookup('forum.example.com', {}, (error, address) => resolve({ error, address }));
    });
    expect(ok).toEqual({ error: null, address: '93.184.215.14' });
  });
  it('sends every Discourse request through the guarded dispatcher', async () => {
    const fetchSpy = vi.fn(async (_input: string, _init: RequestInit) => new Response(JSON.stringify({ user: { id: 1 } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchSpy);
    await call({ fn: getUserAction.run, ctx: makeContext({ props: { username: 'alice' } }) });
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(Reflect.get(Object(init), 'dispatcher')).toBe(await discourseNetwork.getGuardedDispatcher());
  });
});

describe('custom API call', () => {
  const customCall = discourse.actions()['custom_api_call'];
  function ctx({ url }: { url: string }) {
    const base = makeContext({ props: { url: { url }, method: 'GET', followRedirects: true } });
    return { ...base, files: { write: vi.fn() } };
  }
  it.each(['https://attacker.example/collect', 'https://forum.example.com.attacker.example/x', '//attacker.example/x', 'http://forum.example.com/x'])(
    'never sends the key to %s',
    async (url) => {
      const calls = stubFetch([{ body: {} }]);
      await expect(call({ fn: customCall.run, ctx: ctx({ url }) })).rejects.toThrow('only sends the API key');
      expect(calls).toHaveLength(0);
    },
  );
  it('calls a relative path on the forum with the key and without following redirects', async () => {
    const calls = stubFetch([{ body: { ok: true } }]);
    await call({ fn: customCall.run, ctx: ctx({ url: '/latest.json' }) });
    expect(calls[0].url.toString()).toBe(`${BASE}/latest.json`);
    expect(calls[0].headers['api-key']).toBe(API_KEY);
    expect(calls[0].redirect).toBe('manual');
  });
  it('passes the guard only on forum requests and never touches the global dispatcher', async () => {
    const { getGlobalDispatcher } = await import('undici');
    const before = getGlobalDispatcher();
    const guarded = await discourseNetwork.getGuardedDispatcher();
    const seen: Array<{ url: string; dispatcher: unknown; global: unknown }> = [];
    const fetchSpy = vi.fn(async (input: string | URL, init?: RequestInit) => {
      seen.push({ url: String(input), dispatcher: Reflect.get(Object(init), 'dispatcher'), global: getGlobalDispatcher() });
      if (String(input).startsWith(BASE)) {
        await fetch('https://engine.local/v1/step-files', { method: 'POST' });
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'application/pdf' } });
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchSpy);
    await call({ fn: customCall.run, ctx: ctx({ url: '/file.pdf' }) });
    expect(seen.map((entry) => entry.url)).toEqual([`${BASE}/file.pdf`, 'https://engine.local/v1/step-files']);
    expect(seen[0].dispatcher).toBe(guarded);
    expect(seen[1].dispatcher).toBeUndefined();
    expect(seen.every((entry) => entry.global === before)).toBe(true);
    expect(getGlobalDispatcher()).toBe(before);
    expect(globalThis.fetch).toBe(fetchSpy);
  });
  it('saves a binary response through files.write without the forum dispatcher', async () => {
    const guarded = await discourseNetwork.getGuardedDispatcher();
    const seen: Array<{ url: string; dispatcher: unknown }> = [];
    const fetchSpy = vi.fn(async (input: string | URL, init?: RequestInit) => {
      seen.push({ url: String(input), dispatcher: Reflect.get(Object(init), 'dispatcher') });
      if (String(input).startsWith(BASE)) {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'application/pdf' } });
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchSpy);
    const write = vi.fn(async ({ fileName, data }: { fileName: string; data: Buffer }) => {
      await fetch('https://engine.local/v1/step-files', { method: 'POST' });
      return `file://${fileName}:${data.length}`;
    });
    const base = makeContext({ props: { url: { url: '/file.pdf' }, method: 'GET', followRedirects: true, response_is_binary: true } });
    const output = await call({ fn: customCall.run, ctx: { ...base, files: { write } } });
    expect(write).toHaveBeenCalledTimes(1);
    expect(output).toMatchObject({ status: 200, body: 'file://output.pdf:3' });
    expect(seen.map((entry) => entry.url)).toEqual([`${BASE}/file.pdf`, 'https://engine.local/v1/step-files']);
    expect(seen[0].dispatcher).toBe(guarded);
    expect(seen[1].dispatcher).toBeUndefined();
  });
  it('accepts a full URL on the same forum', async () => {
    const calls = stubFetch([{ body: { ok: true } }]);
    await call({ fn: customCall.run, ctx: ctx({ url: `${BASE}/site.json` }) });
    expect(calls[0].url.toString()).toBe(`${BASE}/site.json`);
  });
});

describe('webhook replay', () => {
  const SECRET = 'a'.repeat(64);
  const rawBody = JSON.stringify({ topic: { id: 42, title: 'Hi', slug: 'hi', created_at: new Date().toISOString(), archetype: 'regular' } });
  function delivery(eventId: string | undefined) {
    const headers: Record<string, string> = {
      'x-discourse-event': 'topic_created',
      'x-discourse-event-signature': `sha256=${createHmac('sha256', SECRET).update(rawBody).digest('hex')}`,
    };
    if (eventId !== undefined) {
      headers['x-discourse-event-id'] = eventId;
    }
    return { body: JSON.parse(rawBody), rawBody, headers };
  }
  it('drops a replayed signed body whatever the event id header says', async () => {
    const store = makeStore();
    store.data.set('discourse_webhook', { id: 9, secret: SECRET });
    const run = (eventId: string | undefined) =>
      call({ fn: newTopicTrigger.run, ctx: makeContext({ props: {}, extra: { store, payload: delivery(eventId) } }) });
    await expect(run('7')).resolves.toHaveLength(1);
    await expect(run('8')).resolves.toEqual([]);
    await expect(run(undefined)).resolves.toEqual([]);
  });
});

describe('create user password', () => {
  it('sends the password exactly as supplied, surrounding spaces included', async () => {
    const calls = stubFetch([{ body: { success: true, user_id: 3 } }]);
    await call({
      fn: createUserAction.run,
      ctx: makeContext({ props: { name: 'A', email: 'a@x.io', username: 'a', password: '  pass phrase  ' } }),
    });
    expect(calls[0].body).toMatchObject({ password: '  pass phrase  ' });
  });
  it('still rejects a blank password', async () => {
    stubFetch([]);
    await expect(
      call({ fn: createUserAction.run, ctx: makeContext({ props: { name: 'A', email: 'a@x.io', username: 'a', password: '   ' } }) }),
    ).rejects.toThrow('Password is required');
  });
});
