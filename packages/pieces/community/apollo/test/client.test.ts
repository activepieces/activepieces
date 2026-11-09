import { afterEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ApolloApiError, apolloApi, buildQuery } from '../src/lib/common/client';
import { API_KEY, errorOf, messageOf, replies, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('apollo client', () => {
  test('sends the trimmed key in x-api-key with a verified-TLS dispatcher, redacted bodies and no redirects', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const seen = stubFetch({ respond: replies({ list: [{ body: { id: 'u1' } }] }) });
    await apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/contacts', operation: 'create contact', body: { email: 'a@example.com' } });
    expect(seen[0].url).toBe('https://api.apollo.io/api/v1/contacts');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].hasDispatcher).toBe(true);
    expect(seen[0].body).toEqual({ email: 'a@example.com' });
    const [request, options] = spy.mock.calls[0];
    expect(request.redactBodyInErrors).toBe(true);
    expect(request.followRedirects).toBe(false);
    expect(request.timeout).toBe(60_000);
    expect(options?.dispatcher).toBeDefined();
  });

  test('repeats array params, drops empty values and encodes everything', () => {
    expect(buildQuery({ 'ids[]': ['a b', '', 'c&d'], q: 'x=y', empty: '', none: undefined, flag: false })).toBe('?ids%5B%5D=a+b&ids%5B%5D=c%26d&q=x%3Dy&flag=false');
    expect(buildQuery({})).toBe('');
  });

  test('refuses absolute or traversal paths', async () => {
    await expect(apolloApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '//evil.io/x', operation: 'x' })).rejects.toThrow('relative');
    await expect(apolloApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/a/../x', operation: 'x' })).rejects.toThrow('relative');
  });

  test('a 422 on people/match never puts the email, query or key in the message', async () => {
    stubFetch({ respond: replies({ list: [{ status: 422, body: { error: 'Invalid parameters' } }] }) });
    const error = await errorOf({ promise: apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/people/match', operation: 'people enrichment', query: { email: 'secret.person@example.com' } }) });
    expect(error).toBeInstanceOf(ApolloApiError);
    const message = messageOf({ error });
    expect(message).toBe('Apollo people enrichment failed (422): Invalid parameters');
    expect(message).not.toContain('secret.person');
    expect(message).not.toContain('?');
    expect(message).not.toContain(API_KEY);
    expect(Reflect.has(Object(error), 'body')).toBe(false);
    expect(Reflect.get(Object(error), 'responseBody')).toEqual({ error: 'Invalid parameters' });
  });

  test('a plain-text 401 keeps the vendor text', async () => {
    stubFetch({ respond: replies({ list: [{ status: 401, body: 'Invalid API key. See https://docs.apollo.io/reference/authentication for how to authenticate.' }] }) });
    const error = await errorOf({ promise: apolloApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/users/api_profile', operation: 'x' }) });
    expect(Reflect.get(Object(error), 'status')).toBe(401);
    expect(messageOf({ error })).toContain('Invalid API key');
  });

  test('a 403 API_INACCESSIBLE names the scope cause; a paid-plan 403 is shown verbatim', async () => {
    stubFetch({
      respond: replies({
        list: [
          { status: 403, body: { error: 'This API key is not authorized to access api/v1/contacts/search.', error_code: 'API_INACCESSIBLE' } },
          { status: 403, body: '{\n  "message": "This endpoint is only available to Apollo users on paid plans."\n}' },
        ],
      }),
    });
    const scoped = await errorOf({ promise: apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/contacts/search', operation: 'contact search' }) });
    expect(Reflect.get(Object(scoped), 'code')).toBe('API_INACCESSIBLE');
    expect(messageOf({ error: scoped })).toContain('master API key');
    const plan = await errorOf({ promise: apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/contacts/search', operation: 'contact search' }) });
    expect(messageOf({ error: plan })).toBe('Apollo contact search failed (403): This endpoint is only available to Apollo users on paid plans.');
  });

  test('a 403 API_INACCESSIBLE caused by the plan shows the plan text, not the scope hint', async () => {
    stubFetch({
      respond: replies({
        list: [
          {
            status: 403,
            body: {
              error: 'The api/v1/people/match API is not included in your Basic (Trial) plan and is not accessible, even with a master key. All paid plans include full API access. Upgrade your plan from https://www.apollo.io/pricing',
              error_code: 'API_INACCESSIBLE',
              error_details: { code: 'AUTH.AUTHORIZATION.ENDPOINT_ACCESS_DENIED', message: 'Your team is not permitted to call this endpoint.' },
            },
          },
        ],
      }),
    });
    const error = await errorOf({ promise: apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/people/match', operation: 'people enrichment' }) });
    const message = messageOf({ error });
    expect(message).toContain('not included in your Basic (Trial) plan');
    expect(message).not.toContain('scope');
    expect(message).not.toContain('use a master API key');
  });

  test('a 429 reports the window and retry suggestion and is not retried', async () => {
    const seen = stubFetch({
      respond: replies({
        list: [
          {
            status: 429,
            body: {
              message: 'The maximum number of api calls allowed for api/v1/people/match is 600 times per hour.',
              error_details: { code: 'USAGE.RATE_LIMIT.PLATFORM_RATE_LIMIT', message: 'Rate limit exceeded.', context: { window: 'hour' }, suggestions: { retry_after_seconds: 60 } },
            },
          },
        ],
      }),
    });
    const error = await errorOf({ promise: apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/people/match', operation: 'x' }) });
    expect(seen).toHaveLength(1);
    expect(messageOf({ error })).toBe('Apollo x failed (429): Rate limit exceeded. Limit window: hour. Apollo suggests retrying after 60 seconds.');
  });

  test('a 5xx on a POST is not retried', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ status: 503, body: { error: 'down' } }] }) });
    await expect(apolloApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/contacts', operation: 'create contact', body: {} })).rejects.toThrow('(503): down');
    expect(seen).toHaveLength(1);
  });

  test('a network failure says Apollo could not be reached', async () => {
    stubFetch({ respond: replies({ list: [{ networkError: true }] }) });
    await expect(apolloApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/x', operation: 'x' })).rejects.toThrow('could not reach Apollo');
  });

  test('an empty key fails before any request', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    await expect(apolloApi.request({ apiKey: '', method: HttpMethod.GET, path: '/x', operation: 'x' })).rejects.toThrow('API key is missing');
    expect(seen).toHaveLength(0);
  });
});
