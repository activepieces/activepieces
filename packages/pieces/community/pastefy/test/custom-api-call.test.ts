import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { apiUrlOf, pastefyCustomApiCallAction } from '../src/lib/actions/custom-api-call';
import { AUTH, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const BASE = 'https://paste.example.com/api/v2';

describe('custom api call', () => {
  test('relative paths and same-base URLs stay on the instance API', () => {
    expect(apiUrlOf({ baseUrl: BASE, url: '/user' })).toBe(`${BASE}/user`);
    expect(apiUrlOf({ baseUrl: BASE, url: `${BASE}/paste/abc` })).toBe(`${BASE}/paste/abc`);
  });

  test.each([
    'https://evil.example.com/api/v2/user',
    'https://paste.example.com.evil.io/api/v2/user',
    '//evil.example.com/api/v2/user',
    'http://paste.example.com/api/v2/user',
    'https://u@paste.example.com/api/v2/user',
    'https://paste.example.com/other',
    '/../user',
  ])('rejects %s', (url) => {
    expect(() => apiUrlOf({ baseUrl: BASE, url })).toThrow();
  });

  test('sends the key to the instance only, without following redirects', async () => {
    const seen = stubFetch(() => ({ body: { name: 'me' } }));
    const output = await Reflect.apply(pastefyCustomApiCallAction.run, pastefyCustomApiCallAction, [
      { auth: AUTH, propsValue: { method: HttpMethod.GET, url: { url: '/user' }, headers: { Authorization: 'Bearer other' }, queryParams: {} }, files: {} },
    ]);
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(`${BASE}/user`);
    expect(seen[0].auth).toBe('Bearer key-1');
    expect(output).toMatchObject({ status: 200 });
  });

  test('keeps array query values and names binary downloads by content type', async () => {
    const seen = stubFetch(() => ({ body: { ok: true } }));
    const written: string[] = [];
    const files = { write: async ({ fileName }: { fileName: string }) => { written.push(fileName); return `file://${fileName}`; } };
    await Reflect.apply(pastefyCustomApiCallAction.run, pastefyCustomApiCallAction, [
      { auth: AUTH, propsValue: { method: HttpMethod.GET, url: { url: '/user/pastes' }, headers: {}, queryParams: { filter_tags: ['a', 'b'] }, response_is_binary: true }, files },
    ]);
    expect(seen[0].query.get('filter_tags')).toBe('a,b');
    expect(written).toEqual(['output.json']);
  });

  test('refuses an outside URL without a request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      Reflect.apply(pastefyCustomApiCallAction.run, pastefyCustomApiCallAction, [
        { auth: AUTH, propsValue: { method: HttpMethod.GET, url: { url: 'https://attacker.example/api/v2/user' }, headers: {}, queryParams: {} }, files: {} },
      ]),
    ).rejects.toThrow('must start with');
    expect(seen).toHaveLength(0);
  });
});
