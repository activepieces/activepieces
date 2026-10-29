import { afterEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterCustomApiCallAction, hunterUrlOf } from '../src/lib/actions/custom-api-call';
import { API_KEY, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('custom api call', () => {
  test('relative paths and same-host URLs stay on api.hunter.io/v2', () => {
    expect(hunterUrlOf('/account')).toBe('https://api.hunter.io/v2/account');
    expect(hunterUrlOf('account')).toBe('https://api.hunter.io/v2/account');
    expect(hunterUrlOf('https://api.hunter.io/v2/leads?limit=1')).toBe('https://api.hunter.io/v2/leads?limit=1');
  });

  test.each([
    'https://evil.example.com/v2/account',
    'https://api.hunter.io.evil.io/v2/account',
    '//evil.example.com/v2/account',
    'http://api.hunter.io/v2/account',
    'https://user@api.hunter.io/v2/account',
    'https://api.hunter.io/v3/account',
    'https://api.hunter.io:8443/v2/account',
    '/../account',
    'ftp://api.hunter.io/v2/account',
  ])('rejects %s before sending the key', (url) => {
    expect(() => hunterUrlOf(url)).toThrow();
  });

  test('sends the key only to Hunter with the verified TLS dispatcher and no redirects', async () => {
    const seen = stubFetch(() => ({ body: { data: { email: 'me@example.com' } } }));
    const output = await hunterCustomApiCallAction.run(
      Object.assign(Object.create(null), {
        auth: { type: 'SECRET_TEXT', secret_text: API_KEY },
        propsValue: { method: HttpMethod.GET, url: { url: '/account' }, headers: { 'X-API-KEY': 'other' }, queryParams: {}, failsafe: false },
        files: {},
      }),
    );
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.hunter.io/v2/account');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(seen[0].hasDispatcher).toBe(true);
    expect(output).toMatchObject({ status: 200 });
  });

  test('keeps array query values and names binary downloads by content type', async () => {
    const seen = stubFetch(() => ({ body: { ok: true }, headers: { 'content-type': 'application/json' } }));
    const written: string[] = [];
    const files = { write: async ({ fileName }: { fileName: string }) => { written.push(fileName); return `file://${fileName}`; } };
    await hunterCustomApiCallAction.run(
      Object.assign(Object.create(null), {
        auth: { type: 'SECRET_TEXT', secret_text: API_KEY },
        propsValue: { method: HttpMethod.GET, url: { url: '/leads' }, headers: {}, queryParams: { fields: ['a', 'b'] }, response_is_binary: true },
        files,
      }),
    );
    expect(seen[0].query.get('fields')).toBe('a,b');
    expect(written).toEqual(['output.json']);
  });

  test('refuses an outside URL without making a request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      hunterCustomApiCallAction.run(
        Object.assign(Object.create(null), {
          auth: { type: 'SECRET_TEXT', secret_text: API_KEY },
          propsValue: { method: HttpMethod.GET, url: { url: 'https://attacker.example/v2/account' }, headers: {}, queryParams: {} },
          files: {},
        }),
      ),
    ).rejects.toThrow('must start with');
    expect(seen).toHaveLength(0);
  });
});
