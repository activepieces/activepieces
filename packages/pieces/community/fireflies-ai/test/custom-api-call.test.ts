import { afterEach, describe, expect, test, vi } from 'vitest';
import { firefliesCustomApiCall, firefliesCustomApiCallInternals } from '../src/lib/actions/custom-api-call';

afterEach(() => vi.unstubAllGlobals());

describe('Custom API Call', () => {
  test('sends the request with the bearer key, a verified-TLS dispatcher and no redirect following', async () => {
    const seen = stubFetch();
    const output = await firefliesCustomApiCall.run(
      fakeContext({ props: { method: 'POST', url: { url: '/graphql' }, headers: {}, queryParams: {}, body_type: 'json', body: { data: { query: '{ user { user_id } }' } } } }),
    );
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.fireflies.ai/graphql');
    expect(seen[0].authorization).toBe('Bearer key-1');
    expect(seen[0].hasDispatcher).toBe(true);
    expect(seen[0].redirect).toBe('manual');
    expect(output).toMatchObject({ status: 200, body: { data: { user: { user_id: 'u1' } } } });
  });

  test('the connection key overrides a user-supplied Authorization header', async () => {
    const seen = stubFetch();
    await firefliesCustomApiCall.run(fakeContext({ props: { method: 'POST', url: { url: 'graphql' }, headers: { Authorization: 'Bearer other' }, queryParams: {} } }));
    expect(seen[0].authorization).toBe('Bearer key-1');
  });

  test.each(['authorization', 'AuThOrIzAtIoN', 'AUTHORIZATION'])('drops a user %s header so only the connection key is sent', async (name) => {
    const captured: Headers[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        captured.push(new Headers(init?.headers));
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      }),
    );
    await firefliesCustomApiCall.run(fakeContext({ props: { method: 'POST', url: { url: '/graphql' }, headers: { [name]: 'Bearer other', 'X-Extra': '1' }, queryParams: {} } }));
    expect(captured[0].get('authorization')).toBe('Bearer key-1');
    expect(captured[0].get('x-extra')).toBe('1');
    expect([...captured[0].keys()].filter((key) => key === 'authorization')).toHaveLength(1);
  });

  test('refuses URLs that would send the key to another host', () => {
    expect(() => firefliesCustomApiCallInternals.urlOf({ value: { url: 'https://api.fireflies.ai.evil.io/graphql' } })).toThrow('must be on https://api.fireflies.ai');
    expect(() => firefliesCustomApiCallInternals.urlOf({ value: { url: '//evil.io/graphql' } })).toThrow('must be on https://api.fireflies.ai');
    expect(() => firefliesCustomApiCallInternals.urlOf({ value: { url: 'https://user:pass@api.fireflies.ai/graphql' } })).toThrow('must be on https://api.fireflies.ai');
    expect(() => firefliesCustomApiCallInternals.urlOf({ value: { url: '/graphql/../x' } })).toThrow('".." segments');
    expect(firefliesCustomApiCallInternals.urlOf({ value: { url: 'https://api.fireflies.ai/graphql' } })).toBe('https://api.fireflies.ai/graphql');
  });

  test('is a human-only escape hatch', () => {
    expect(firefliesCustomApiCall.name).toBe('custom_api_call');
    expect(firefliesCustomApiCall.audience).toBe('human');
  });

  test('does not show a Follow Redirects prop that run() would ignore', () => {
    expect(Object.keys(firefliesCustomApiCall.props)).not.toContain('followRedirects');
    expect(Object.keys(firefliesCustomApiCall.props)).toEqual(expect.arrayContaining(['method', 'url', 'headers', 'queryParams', 'body_type', 'body']));
  });
});

function fakeContext({ props }: { props: Record<string, unknown> }): Parameters<typeof firefliesCustomApiCall.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: ' key-1 ' }, propsValue: props });
}

function stubFetch(): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit & { dispatcher?: unknown }) => {
      seen.push({
        url: String(input),
        authorization: new Headers(init?.headers).get('authorization'),
        hasDispatcher: init?.dispatcher !== undefined,
        redirect: init?.redirect,
      });
      return new Response(JSON.stringify({ data: { user: { user_id: 'u1' } } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }),
  );
  return seen;
}

type SeenRequest = { url: string; authorization: string | null; hasDispatcher: boolean; redirect: RequestRedirect | undefined };
