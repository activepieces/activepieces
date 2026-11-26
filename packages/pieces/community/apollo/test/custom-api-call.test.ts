import { afterEach, describe, expect, test, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { apolloCustomApiCall, apolloCustomApiCallInternals } from '../src/lib/actions/custom-api-call';
import { apollo } from '../src/index';
import { API_KEY, replies, runContext, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Custom API Call', () => {
  test('sends the trimmed key with a verified-TLS dispatcher, no redirects and redacted bodies', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const seen = stubFetch({ respond: replies({ list: [{ body: { contact: { id: 'c1' } } }] }) });
    const output = await apolloCustomApiCall.run(
      runContext({ props: { method: 'POST', url: { url: '/contacts/search' }, headers: {}, queryParams: { page: '2' }, body_type: 'json', body: { data: { q_keywords: 'jane' } } } }),
    );
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.apollo.io/api/v1/contacts/search?page=2');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(seen[0].hasDispatcher).toBe(true);
    expect(seen[0].body).toEqual({ q_keywords: 'jane' });
    const [request] = spy.mock.calls[0];
    expect(request.followRedirects).toBe(false);
    expect(request.redactBodyInErrors).toBe(true);
    expect(output).toMatchObject({ status: 200, body: { contact: { id: 'c1' } } });
  });

  test('the connection key wins over a user-set x-api-key header in any case', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    await apolloCustomApiCall.run(runContext({ props: { method: 'GET', url: { url: 'users/api_profile' }, headers: { 'X-Api-Key': 'other', 'x-api-key': 'other2', 'X-Custom': 'kept' }, queryParams: {} } }));
    expect(seen[0].url).toBe('https://api.apollo.io/api/v1/users/api_profile');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(seen[0].headers.get('x-custom')).toBe('kept');
  });

  test('refuses URLs that would send the key to another host', () => {
    const refuse = (url: string) => expect(() => apolloCustomApiCallInternals.urlOf({ value: { url } }), url).toThrow();
    refuse('https://api.apollo.io.evil.io/api/v1/contacts');
    refuse('http://api.apollo.io/api/v1/contacts');
    refuse('//evil.io/api/v1/contacts');
    refuse('//api.apollo.io/api/v1/contacts');
    refuse('https://user:pass@api.apollo.io/api/v1/contacts');
    refuse('https://api.apollo.io@evil.io/x');
    refuse('/contacts/../../evil');
    refuse('/contacts/%2E%2E/x');
    refuse('\\\\evil.io\\x');
    refuse('/contacts/.%2e/x');
    refuse('/contacts/%2E./x');
    refuse('/contacts/%2e%2E/x');
    refuse('https://api.apollo.io/api/v1/.%2E/x');
    refuse('//user@api.apollo.io/x');
    expect(apolloCustomApiCallInternals.urlOf({ value: { url: 'https://api.apollo.io/api/v1/contacts' } })).toBe('https://api.apollo.io/api/v1/contacts');
    expect(apolloCustomApiCallInternals.urlOf({ value: { url: 'contacts/abc' } })).toBe('https://api.apollo.io/api/v1/contacts/abc');
  });

  test('relative paths keep /api/v1 even with @ in the path or query', async () => {
    expect(apolloCustomApiCallInternals.urlOf({ value: { url: '/people/match?email=jane@example.com' } })).toBe('https://api.apollo.io/api/v1/people/match?email=jane@example.com');
    expect(apolloCustomApiCallInternals.urlOf({ value: { url: 'people/match?email=a%40b.com&q=..' } })).toBe('https://api.apollo.io/api/v1/people/match?email=a%40b.com&q=..');
    expect(apolloCustomApiCallInternals.urlOf({ value: { url: 'contacts/jane@example.com' } })).toBe('https://api.apollo.io/api/v1/contacts/jane@example.com');
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    await apolloCustomApiCall.run(runContext({ props: { method: 'POST', url: { url: '/people/match?email=jane@example.com' }, headers: {}, queryParams: {} } }));
    expect(seen[0].path).toBe('/api/v1/people/match');
    expect(seen[0].query.get('email')).toBe('jane@example.com');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
  });

  test('a refused URL sends nothing', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    await expect(apolloCustomApiCall.run(runContext({ props: { method: 'GET', url: { url: 'https://evil.io/x' }, headers: {}, queryParams: {} } }))).rejects.toThrow('must be on https://api.apollo.io');
    expect(seen).toHaveLength(0);
  });

  test('does not offer a Follow redirects prop that run() ignores', () => {
    expect(Object.keys(apolloCustomApiCall.props)).not.toContain('followRedirects');
    for (const group of apolloCustomApiCall.propertyGroups ?? []) {
      expect(group.props).not.toContain('followRedirects');
    }
    expect(Object.keys(apolloCustomApiCall.props)).toEqual(expect.arrayContaining(['url', 'method', 'headers', 'queryParams', 'body_type', 'body', 'timeout', 'failsafe']));
  });

  test('is the registered human-only custom_api_call', () => {
    expect(apolloCustomApiCall.name).toBe('custom_api_call');
    expect(apolloCustomApiCall.audience).toBe('human');
    expect(apollo.actions()['custom_api_call']).toBe(apolloCustomApiCall);
  });
});
