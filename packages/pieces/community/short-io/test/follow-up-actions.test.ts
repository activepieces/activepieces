import { afterEach, describe, expect, test, vi } from 'vitest';
import { duplicateLinkAction } from '../src/lib/actions/duplicate-link';
import { getFolderAction } from '../src/lib/actions/get-folder';
import { getLinkOpenGraphAction } from '../src/lib/actions/get-link-open-graph';
import { DOMAINS, link, run, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('duplicate_link', () => {
  test('posts to /links/duplicate/{id} with the optional slug and scrubs the copy', async () => {
    const seen = stubFetch(() => ({ body: link({ idString: 'link_new_1', duplicatedFrom: 'link_a_b', path: 'promo-email' }) }));
    const result = await run({ action: duplicateLinkAction, props: { linkId: 'link_a_b', path: '/promo-email' } });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url.pathname).toBe('/links/duplicate/link_a_b');
    expect(seen[0].body).toEqual({ path: 'promo-email' });
    expect(result).toMatchObject({ idString: 'link_new_1', duplicatedFrom: 'link_a_b', linkId: 'link_new_1' });
    expect(JSON.stringify(result)).not.toContain('hunter2');
  });
  test('sends an empty body without a slug and encodes the ID', async () => {
    const seen = stubFetch(() => ({ body: link() }));
    await run({ action: duplicateLinkAction, props: { linkId: '../x' } });
    expect(seen[0].url.pathname).toBe('/links/duplicate/..%2Fx');
    expect(seen[0].body).toEqual({});
  });
});

describe('get_folder', () => {
  test('returns the folder, or found=false when Short.io answers null', async () => {
    const seen = stubFetch((request) =>
      request.url.pathname === '/api/domains' ? { body: DOMAINS } : request.url.pathname.endsWith('/f1') ? { body: { id: 'f1', DomainId: 101, name: 'Promo' } } : { raw: new TextEncoder().encode('null') },
    );
    expect(await run({ action: getFolderAction, props: { domain: 'go.example.com', folderId: 'f1' } })).toEqual({ found: true, folder: { id: 'f1', name: 'Promo', domainId: 101 } });
    expect(seen[1].url.pathname).toBe('/links/folders/101/f1');
    expect(await run({ action: getFolderAction, props: { domain: '101', folderId: 'nope' } })).toEqual({ found: false, folder: null });
  });
});

describe('get_link_open_graph', () => {
  test('turns [property, value] pairs into a map and a list', async () => {
    const seen = stubFetch((request) =>
      request.url.pathname === '/api/domains' ? { body: DOMAINS } : { body: [['title', 'Spring sale'], ['image', 'https://x.io/a.png'], ['bad']] },
    );
    const result = await run({ action: getLinkOpenGraphAction, props: { domain: 'go.example.com', linkId: 'link_a_b' } });
    expect(seen[1].url.pathname).toBe('/links/opengraph/101/link_a_b');
    expect(result).toEqual({
      linkId: 'link_a_b',
      properties: { title: 'Spring sale', image: 'https://x.io/a.png' },
      items: [{ property: 'title', value: 'Spring sale' }, { property: 'image', value: 'https://x.io/a.png' }],
      count: 2,
    });
  });
  test('empty array when nothing is set', async () => {
    stubFetch((request) => (request.url.pathname === '/api/domains' ? { body: DOMAINS } : { body: [] }));
    expect(await run({ action: getLinkOpenGraphAction, props: { domain: 'go.example.com', linkId: 'link_a_b' } })).toEqual({ linkId: 'link_a_b', properties: {}, items: [], count: 0 });
  });
});
