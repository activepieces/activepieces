import { afterEach, describe, expect, test, vi } from 'vitest';
import { totalcmsApi, totalcmsHelpers } from '../src/lib/common/client';
import { API_KEY, connection, SITE, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('client', () => {
  test('sends X-API-Key, trims the site URL and encodes path segments', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'a b', text: 'x' } } }));
    await totalcmsApi.getObject({ auth: connection(), collection: 'text', id: 'a b' });
    expect(seen[0].url).toBe(`${SITE}/api/collections/text/a%20b`);
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].redirect).toBe('manual');
  });

  test('refuses path traversal in IDs before any request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(totalcmsApi.getObject({ auth: connection(), collection: 'text', id: '..' })).rejects.toThrow('not valid');
    await expect(totalcmsApi.getObject({ auth: connection(), collection: 'blog/../auth', id: 'x' })).rejects.toThrow('not valid');
    expect(seen).toHaveLength(0);
  });

  test('surfaces the nested error.message from Total CMS', async () => {
    stubFetch(() => ({ status: 400, body: { error: { message: '400 Bad Request - Object with id x already exists in text' } } }));
    await expect(totalcmsApi.createObject({ auth: connection(), collection: 'text', fields: { id: 'x' } })).rejects.toThrow(
      'Total CMS could not create an object in collection "text" (HTTP 400): Object with id x already exists in text',
    );
  });

  test('surfaces a plain string error', async () => {
    stubFetch(() => ({ status: 400, body: { error: "Property 'text' is not numeric" } }));
    await expect(
      totalcmsApi.adjustNumber({ auth: connection(), collection: 'text', id: 'a', property: 'text', direction: 'increment', amount: 1 }),
    ).rejects.toThrow("Property 'text' is not numeric");
  });

  test('error keeps status but no body field', async () => {
    stubFetch(() => ({ status: 401, body: { error: { message: 'Unauthorized' } } }));
    const error = await totalcmsApi.listCollections({ auth: connection() }).catch((e: unknown) => e);
    expect(totalcmsHelpers.statusOf(error)).toBe(401);
    expect(error instanceof Error && error.message).toContain('API key is invalid');
    expect(error !== null && typeof error === 'object' && 'body' in error).toBe(false);
  });

  test('findObject returns null only on 404', async () => {
    stubFetch(() => ({ status: 404, body: { error: { message: '404 Not Found - Unable to fetch object text/x' } } }));
    expect(await totalcmsApi.findObject({ auth: connection(), collection: 'text', id: 'x' })).toBeNull();
    stubFetch(() => ({ status: 500, body: { error: { message: 'boom' } } }));
    await expect(totalcmsApi.findObject({ auth: connection(), collection: 'text', id: 'x' })).rejects.toThrow('boom');
  });

  test('a redirect is reported, not followed', async () => {
    stubFetch(() => ({ status: 301, body: {}, headers: { location: 'https://evil.example.com/api' } }));
    await expect(totalcmsApi.listCollections({ auth: connection() })).rejects.toThrow('redirect');
  });

  test('rejects a non-http site URL', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    const auth = { props: { domain: 'ftp://cms.example.com', apiKey: API_KEY } };
    await expect(totalcmsApi.listCollections({ auth })).rejects.toThrow('http');
    expect(seen).toHaveLength(0);
  });

  test('replaceObject PUTs the whole object with the id in the body', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'headline', text: 'Hi' } } }));
    await totalcmsApi.replaceObject({ auth: connection(), collection: 'text', id: ' headline ', fields: { text: 'Hi' } });
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].path).toBe('/api/collections/text/headline');
    expect(seen[0].json).toEqual({ text: 'Hi', id: 'headline' });
  });

  test('queryObjects passes paging, sort and filters and reads the total', async () => {
    const seen = stubFetch(() => ({ body: { data: [{ id: 'a' }], meta: { pagination: { total: 7 } } } }));
    const page = await totalcmsApi.queryObjects({ auth: connection(), collection: 'blog', limit: 10, offset: 20, sort: '-created', include: 'draft:false' });
    expect(seen[0].path).toBe('/api/collections/blog/query');
    expect(Object.fromEntries(seen[0].query)).toEqual({ limit: '10', offset: '20', sort: '-created', include: 'draft:false' });
    expect(page.total).toBe(7);
  });
});
