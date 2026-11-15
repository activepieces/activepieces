import { describe, expect, it, vi, afterEach } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

import { buildGenerateBody } from '../src/lib/actions/generate-alt-text';
import { altTextAiRequest, normalizeImage, stripDataUriPrefix } from '../src/lib/common/client';

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError({}, { status, responseBody: body });
}

describe('buildGenerateBody', () => {
  it('builds gpt_prompt from plain instructions and optional [AltText] placeholder', () => {
    const url = 'https://x.test/a.png';
    expect(buildGenerateBody({ imageUrl: url, gptPrompt: ' Rewrite it in under 80 characters ' })['gpt_prompt']).toBe(
      'Rewrite it in under 80 characters\n\nAlt text: {{AltText}}',
    );
    expect(buildGenerateBody({ imageUrl: url, gptPrompt: 'Shorten [alttext] and [AltText]' })['gpt_prompt']).toBe('Shorten {{AltText}} and {{AltText}}');
    expect(buildGenerateBody({ imageUrl: url, gptPrompt: 'a'.repeat(745) })['gpt_prompt']).toHaveLength(768);
    expect(() => buildGenerateBody({ imageUrl: url, gptPrompt: 'a'.repeat(746) })).toThrow('at most 768');
  });

  it('sends only set keys for a URL', () => {
    expect(buildGenerateBody({ imageUrl: ' https://x.test/a.png ', keywords: [], negativeKeywords: [''] })).toEqual({
      image: { url: 'https://x.test/a.png' },
    });
  });

  it('strips data URI prefix and maps optional fields', () => {
    const body = buildGenerateBody({
      image: { base64: 'data:image/png;base64,QUJD', filename: 'a.png', extension: 'png' },
      lang: 'en, fr ,',
      keywords: ['cat'],
      overwrite: 'no',
      ecommBrand: 'Acme',
    });
    expect(body).toEqual({
      image: { raw: 'QUJD' },
      lang: 'en,fr',
      keywords: ['cat'],
      overwrite: false,
      ecomm: { brand: 'Acme' },
    });
  });

  it('rejects both or neither image input', () => {
    expect(() => buildGenerateBody({})).toThrow('Provide an Image URL or an Image file.');
    expect(() =>
      buildGenerateBody({ imageUrl: 'https://x.test/a.png', image: { base64: 'QQ', filename: 'a.png' } }),
    ).toThrow('not both');
  });

  it('sends files with unknown extensions and lets AltText.ai validate them', () => {
    const body = buildGenerateBody({ image: { base64: 'QQ', filename: 'unknown.bin', extension: 'bin' } });
    expect(body['image']).toEqual({ raw: 'QQ' });
  });
});

describe('altTextAiRequest errors', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps 429 to a rate-limit message with responseBody', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => {
      throw httpError({ status: 429, body: { error: 'Too many' } });
    });
    await expect(
      altTextAiRequest({ apiKey: 'k', method: HttpMethod.GET, path: '/account', operation: 'Get Account' }),
    ).rejects.toMatchObject({ message: expect.stringContaining('rate limited'), responseBody: { error: 'Too many' } });
  });

  it('includes the vendor message on 4xx', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => {
      throw httpError({ status: 422, body: { errors: { base: ['HTTP 400'] }, error_code: 'download_failed', credits_used: 0 } });
    });
    await expect(
      altTextAiRequest({ apiKey: 'k', method: HttpMethod.POST, path: '/images', operation: 'Generate Alt Text' }),
    ).rejects.toThrow(
      'AltText.ai Generate Alt Text failed (422, download_failed): HTTP 400 — AltText.ai could not download the image URL',
    );
  });

  it('says a POST may have applied on network errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => {
      throw new Error('socket hang up');
    });
    await expect(
      altTextAiRequest({ apiKey: 'k', method: HttpMethod.POST, path: '/images', operation: 'Generate Alt Text' }),
    ).rejects.toThrow('may still have been applied');
  });
});

describe('normalizeImage', () => {
  it('fills defaults for missing fields', () => {
    expect(normalizeImage({ created_at: '1794738321' }).created_at).toBe(1794738321);
    expect(normalizeImage({ asset_id: 'a1', alt_texts: { en: 'A cat', fr: 3 }, tags: ['x', null] })).toEqual({
      asset_id: 'a1',
      url: null,
      alt_text: null,
      alt_texts: { en: 'A cat', fr: '3' },
      tags: ['x'],
      metadata: {},
      created_at: null,
      errors: null,
      error_code: null,
    });
    expect(normalizeImage({ created_at: '1794738321' }).created_at).toBe(1794738321);
    expect(stripDataUriPrefix('QUJD')).toBe('QUJD');
  });
});

describe('actions (mocked httpClient)', () => {
  afterEach(() => vi.restoreAllMocks());

  function mockSend({ body }: { body: unknown }) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => ({ status: 200, headers: {}, body }));
  }

  function ctx({ props }: { props: Record<string, unknown> }) {
    return { auth: { secret_text: 'sk-1', type: 'SECRET_TEXT' }, propsValue: props };
  }

  it('list sends page/limit/url, reads wrapped list, infers next_page only on a full page', async () => {
    const { listImagesAction } = await import('../src/lib/actions/list-images');
    const spy = mockSend({ body: { images: [{ asset_id: 'a' }, { asset_id: 'b' }] } });
    const full = await listImagesAction.run(ctx({ props: { page: 2, limit: 2, url: ' https://x.test/a.png ' } }));
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: 'https://alttext.ai/api/v1/images',
      headers: { 'X-API-Key': 'sk-1' },
      queryParams: { page: '2', limit: '2', url: 'https://x.test/a.png' },
    });
    expect(full).toMatchObject({ count: 2, page: 2, next_page: 3 });
    const partial = await listImagesAction.run(ctx({ props: { limit: 5 } }));
    expect(spy.mock.calls[1][0].queryParams).toEqual({ page: '1', limit: '5' });
    expect(partial).toMatchObject({ next_page: null });
  });

  it('list uses pagination headers for next_page and totals', async () => {
    const { listImagesAction } = await import('../src/lib/actions/list-images');
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => ({
      status: 200,
      headers: { 'current-page': '2', 'page-items': '2', 'total-pages': '3', 'total-count': '5' },
      body: { images: [{ asset_id: 'a' }] },
    }));
    expect(await listImagesAction.run(ctx({ props: { page: 2, limit: 2 } }))).toMatchObject({ page: 2, next_page: 3, total_count: 5, total_pages: 3, count: 1 });
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => ({
      status: 200,
      headers: { 'current-page': '3', 'total-pages': '3', 'total-count': '5' },
      body: { images: [{ asset_id: 'a' }, { asset_id: 'b' }] },
    }));
    expect(await listImagesAction.run(ctx({ props: { page: 3, limit: 2 } }))).toMatchObject({ next_page: null, total_pages: 3 });
  });

  it('search sends page/limit, validates them, returns paging', async () => {
    const { searchImagesAction } = await import('../src/lib/actions/search-images');
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => ({
      status: 200,
      headers: { 'current-page': '1', 'total-pages': '2', 'total-count': '3' },
      body: { images: [{ asset_id: 'a' }, { asset_id: 'b' }] },
    }));
    const out = await searchImagesAction.run(ctx({ props: { query: ' cat ', page: 1, limit: 2 } }));
    expect(spy.mock.calls[0][0].queryParams).toEqual({ q: 'cat', page: '1', limit: '2' });
    expect(out).toMatchObject({ page: 1, next_page: 2, total_count: 3, total_pages: 2 });
    await expect(searchImagesAction.run(ctx({ props: { query: 'x', limit: 101 } }))).rejects.toThrow('between 1 and 100');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('generate sets note when the returned asset ID differs from the requested one', async () => {
    const { generateAltTextAction } = await import('../src/lib/actions/generate-alt-text');
    mockSend({ body: { asset_id: 'hunt-1', alt_text: 'old' } });
    const existing = await generateAltTextAction.run(ctx({ props: { imageUrl: 'https://x.test/a.jpg', assetId: 'hunt-2' } }));
    expect(existing.note).toContain('already existed');
    mockSend({ body: { asset_id: 'hunt-2' } });
    expect((await generateAltTextAction.run(ctx({ props: { imageUrl: 'https://x.test/a.jpg', assetId: 'hunt-2' } }))).note).toBeNull();
    expect((await generateAltTextAction.run(ctx({ props: { imageUrl: 'https://x.test/a.jpg' } }))).note).toBeNull();
  });

  it('list rejects out-of-range limit and page before calling the API', async () => {
    const { listImagesAction } = await import('../src/lib/actions/list-images');
    const spy = mockSend({ body: [] });
    await expect(listImagesAction.run(ctx({ props: { limit: 101 } }))).rejects.toThrow('between 1 and 100');
    await expect(listImagesAction.run(ctx({ props: { page: 0 } }))).rejects.toThrow('1 or greater');
    expect(spy).not.toHaveBeenCalled();
  });

  it('list tolerates an unexpected body', async () => {
    const { listImagesAction } = await import('../src/lib/actions/list-images');
    mockSend({ body: 'oops' });
    expect(await listImagesAction.run(ctx({ props: {} }))).toMatchObject({ images: [], count: 0, next_page: null });
  });

  it('update sends image.alt_text with lang and overwrite as query params, encodes id', async () => {
    const { updateImageAction } = await import('../src/lib/actions/update-image');
    const spy = mockSend({ body: { asset_id: 'a/b' } });
    await updateImageAction.run(ctx({ props: { assetId: 'a/b', altText: ' Cat ', lang: 'fr' } }));
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.PUT,
      url: 'https://alttext.ai/api/v1/images/a%2Fb',
      body: { image: { alt_text: 'Cat' } },
      queryParams: { lang: 'fr', overwrite: 'true' },
    });
    await updateImageAction.run(ctx({ props: { assetId: 'x', altText: 'Dog' } }));
    expect(spy.mock.calls[1][0].body).toEqual({ image: { alt_text: 'Dog' } });
    expect(spy.mock.calls[1][0].queryParams).toEqual({ overwrite: 'true' });
  });

  it('delete returns deleted+asset_id', async () => {
    const { deleteImageAction } = await import('../src/lib/actions/delete-image');
    const spy = mockSend({ body: '' });
    expect(await deleteImageAction.run(ctx({ props: { assetId: ' z1 ' } }))).toEqual({ deleted: true, asset_id: 'z1' });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.DELETE, url: 'https://alttext.ai/api/v1/images/z1' });
  });

  it('account computes credits_remaining and falls back to lang', async () => {
    const { getAccountAction } = await import('../src/lib/actions/get-account');
    mockSend({ body: { usage: '7', usage_limit: 25, lang: 'de' } });
    expect(await getAccountAction.run(ctx({ props: {} }))).toMatchObject({ usage: 7, usage_limit: 25, credits_remaining: 18, default_lang: 'de' });
    mockSend({
      body: {
        name: 'Acme',
        usage: 3,
        usage_limit: 25,
        credits_spendable: 30,
        notification_email: 'owner@acme.test',
        api_key: { kind: 'full_access' },
        subscription: { plan_name: 'Trial', expires_at: '2026-12-01T00:00:00Z' },
      },
    });
    const account = await getAccountAction.run(ctx({ props: {} }));
    expect(account).toMatchObject({ credits_remaining: 30, plan_name: 'Trial', renews_at: '2026-12-01T00:00:00Z' });
    expect(JSON.stringify(account)).not.toContain('owner@acme.test');
    expect(JSON.stringify(account)).not.toContain('full_access');
  });

  it('404 explains missing asset ID', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementationOnce(async () => {
      throw httpError({ status: 404, body: '' });
    });
    await expect(
      altTextAiRequest({ apiKey: 'k', method: HttpMethod.DELETE, path: '/images/x', operation: 'Delete Image' }),
    ).rejects.toThrow('AltText.ai Delete Image failed (404): no image with this asset ID exists (check the ID, or it was already deleted)');
  });

  it('401 maps to invalid key, GET network error has no may-have-applied', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementationOnce(async () => {
      throw httpError({ status: 401, body: { message: 'bad key' } });
    });
    await expect(altTextAiRequest({ apiKey: 'k', method: HttpMethod.GET, path: '/account', operation: 'Get Account' })).rejects.toThrow(
      'AltText.ai Get Account failed (401): the API key is invalid or lacks access — bad key',
    );
    vi.spyOn(httpClient, 'sendRequest').mockImplementationOnce(async () => {
      throw new Error('ETIMEDOUT');
    });
    const err = await altTextAiRequest({ apiKey: 'k', method: HttpMethod.GET, path: '/account', operation: 'Get Account' }).catch((e) => e);
    expect(err.message).toContain('network error (ETIMEDOUT)');
    expect(err.message).not.toContain('may still have been applied');
  });

  it('generate sends a POST with the built body and normalizes the reply', async () => {
    const { generateAltTextAction } = await import('../src/lib/actions/generate-alt-text');
    const spy = mockSend({ body: { asset_id: 'g1', alt_text: 'A cat' } });
    const out = await generateAltTextAction.run(ctx({ props: { imageUrl: 'https://x.test/c.jpg', ecommProduct: 'Mug', assetId: ' my-1 ' } }));
    expect(spy.mock.calls[0][0].body).toEqual({ image: { url: 'https://x.test/c.jpg', asset_id: 'my-1' }, ecomm: { product: 'Mug' } });
    expect(out).toMatchObject({ asset_id: 'g1', alt_text: 'A cat', tags: [] });
  });

  it('PROBE: whitespace-only asset id must not hit the collection endpoint', async () => {
    const { getImageAction } = await import('../src/lib/actions/get-image');
    const spy = mockSend({ body: { images: [] } });
    await getImageAction.run(ctx({ props: { assetId: '   ' } })).catch(() => undefined);
    const urls = spy.mock.calls.map((c) => c[0].url);
    expect(urls).not.toContain('https://alttext.ai/api/v1/images/');
  });

  it('generate puts asset_id inside image', () => {
    expect(buildGenerateBody({ imageUrl: 'https://x.test/a.png', assetId: ' my-id ' })).toEqual({
      image: { asset_id: 'my-id', url: 'https://x.test/a.png' },
    });
  });

  it('PROBE: file without extension is not rejected as non-image', () => {
    expect(() => buildGenerateBody({ image: { base64: 'QQ', filename: 'photo' } })).not.toThrow();
  });
});
