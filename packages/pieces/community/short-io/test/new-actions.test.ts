import { afterEach, describe, expect, test, vi } from 'vitest';
import { addTagToLinksAction } from '../src/lib/actions/add-tag-to-links';
import { deleteLinkAiAction } from '../src/lib/actions/ai/delete-link';
import { createLinksBulkAction } from '../src/lib/actions/create-links-bulk';
import { generateQrCodeAction } from '../src/lib/actions/generate-qr-code';
import { getLinkAction } from '../src/lib/actions/get-link';
import { getTopLinksAction } from '../src/lib/actions/get-top-links';
import { listDomainsAction } from '../src/lib/actions/list-domains';
import { archiveLinkAction } from '../src/lib/actions/archive-link';
import { deleteShortLinkAction } from '../src/lib/actions/delete-short-link';
import { DOMAINS, link, replies, run, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('new actions', () => {
  test('list_domains drops non-schema fields like segmentKey', async () => {
    stubFetch(replies([{ body: DOMAINS }]));
    const result = await run({ action: listDomainsAction, props: {} });
    expect(result).toMatchObject({ count: 2, items: [{ id: 101, hostname: 'go.example.com' }, { id: 202 }] });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  test('delete_link reports alreadyDeleted on 404; legacy delete still throws', async () => {
    stubFetch(replies([{ status: 404, body: { error: 'Link not found' } }]));
    expect(await run({ action: deleteLinkAiAction, props: { linkId: 'lnk_a_b' } })).toEqual({ linkId: 'lnk_a_b', deleted: false, alreadyDeleted: true });
    await expect(run({ action: deleteShortLinkAction, props: { linkId: 'lnk_a_b' } })).rejects.toThrow('may have already been deleted');
  });
  test('add_tag_to_links sends tag + link_ids and validates IDs first', async () => {
    const seen = stubFetch(replies([{ body: {} }]));
    await expect(run({ action: addTagToLinksAction, props: { tag: 'x', linkIds: ['nope'] } })).rejects.toThrow('not Short.io link IDs');
    expect(seen).toHaveLength(0);
    await run({ action: addTagToLinksAction, props: { tag: ' promo ', linkIds: ['link_a_b', 'link_a_b', 'lnk_c_d'] } });
    expect(seen[0].url.pathname).toBe('/tags/bulk');
    expect(seen[0].body).toEqual({ tag: 'promo', link_ids: ['link_a_b', 'lnk_c_d'] });
  });
  test('generate_qr_code writes the image to a file', async () => {
    const seen = stubFetch(replies([{ raw: new Uint8Array([137, 80, 78, 71]), headers: { 'content-type': 'image/png' } }]));
    const result = await run({ action: generateQrCodeAction, props: { linkId: 'lnk_a_b', size: 10, color: '#ff0000' } });
    expect(seen[0].body).toEqual({ type: 'png', size: 10, color: 'ff0000', useDomainSettings: false });
    expect(result).toMatchObject({ linkId: 'lnk_a_b', format: 'png', fileName: 'qr-lnk_a_b.png', file: 'file://qr-lnk_a_b.png', size: 4 });
  });
  test('create_links_bulk validates, then splits created and failed items', async () => {
    const seen = stubFetch((request) => (request.url.pathname === '/api/domains' ? { body: DOMAINS } : { body: [link({ password: 'p' }), { error: 'bad url' }] }));
    await expect(run({ action: createLinksBulkAction, props: { domain: 'go.example.com', links: [{ originalURL: 'javascript:alert(1)' }] } })).rejects.toThrow('http');
    const result = await run({ action: createLinksBulkAction, props: { domain: '101', links: '[{"originalURL":"https://a.com","password":"p","path":"a"},"https://b.com"]' } });
    const bulk = seen.find((request) => request.url.pathname === '/links/bulk');
    expect(bulk?.body).toEqual({ domain: 'go.example.com', links: [{ originalURL: 'https://a.com', path: 'a' }, { originalURL: 'https://b.com' }], allowDuplicates: false });
    expect(result).toMatchObject({ createdCount: 1, errorCount: 1, errors: [{ index: 1, originalURL: 'https://b.com', error: 'bad url' }] });
    expect(JSON.stringify(result)).not.toContain('"password"');
  });
  test('get_link returns found=false on 404', async () => {
    stubFetch(replies([{ status: 404, body: { error: 'Domain not found' } }]));
    expect(await run({ action: getLinkAction, props: { linkId: 'lnk_x_y' } })).toEqual({ found: false, link: null });
  });
  test('get_top_links uses POST /top with column=path', async () => {
    const seen = stubFetch((request) => (request.url.pathname === '/api/domains' ? { body: DOMAINS } : { body: [{ score: 9, column: '/promo', displayName: '/promo' }] }));
    const result = await run({ action: getTopLinksAction, props: { domain: 'go.example.com', period: 'last7' } });
    expect(seen[1].url.toString()).toBe('https://statistics.short.io/statistics/domain/101/top');
    expect(seen[1].body).toEqual({ column: 'path', limit: 10, period: 'last7' });
    expect(result).toEqual({ items: [{ path: '/promo', clicks: 9 }], count: 1 });
  });
  test('archive_link fails when Short.io answers success=false', async () => {
    stubFetch(replies([{ body: { success: false, error: 'Link not found' } }]));
    await expect(run({ action: archiveLinkAction, props: { linkId: 'lnk_a_b' } })).rejects.toThrow('Link not found');
  });
});
