import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { alttextifyAuth } from '../src/lib/common/auth';
import { alttextifyApi, normalizeImage, toDataUri } from '../src/lib/common/client';

describe('toDataUri', () => {
  it('uses the mime type from the extension', () => {
    expect(toDataUri({ base64: 'AAA', extension: 'png', filename: 'a.png' })).toBe('data:image/png;base64,AAA');
  });
  it('falls back to image/jpeg when the extension is unknown or missing', () => {
    expect(toDataUri({ base64: 'AAA', extension: 'zzz', filename: 'a' })).toBe('data:image/jpeg;base64,AAA');
    expect(toDataUri({ base64: 'AAA', filename: 'noext' })).toBe('data:image/jpeg;base64,AAA');
  });
  it('rejects an empty file', () => {
    expect(() => toDataUri({ base64: '' })).toThrow('Image File is empty');
  });
});

describe('normalizeImage', () => {
  it('joins an alt_text array into one string', () => {
    expect(normalizeImage({ asset_id: 'a', alt_text: ['one', 'two'] }).alt_text).toBe('one\ntwo');
  });
  it('wraps a string alt_text', () => {
    expect(normalizeImage({ asset_id: 'a', alt_text: 'one' }).alt_texts).toEqual(['one']);
  });
});

describe('error mapping', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [401, 'unauthorized', 'Invalid API key'],
    [404, 'notFound', 'Image not found'],
    [413, 'payloadTooLarge', 'Image too large'],
    [415, 'unsupportedMediaType', 'Unsupported type'],
    [422, 'invalidLangCode', 'Invalid language code'],
  ])('surfaces the vendor message for %i', async (status, code, message) => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status, responseBody: { error: code, message } }),
    );
    const promise = alttextifyApi.request({ apiKey: 'k', method: HttpMethod.GET, path: '/image/x', operation: 'get image' });
    await expect(promise).rejects.toThrow(`AltTextify get image failed (HTTP ${status}): ${message} (${code})`);
    await expect(promise).rejects.toMatchObject({ responseBody: { error: code, message } });
  });

  it('reads the nested vendor error shape', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 400, responseBody: { error: { message: 'body/image Invalid image format.', code: 'FST_ERR_VALIDATION' } } }),
    );
    await expect(
      alttextifyApi.request({ apiKey: 'k', method: HttpMethod.POST, path: '/image/url', operation: 'generate alt text' }),
    ).rejects.toThrow('(HTTP 400): body/image Invalid image format. (FST_ERR_VALIDATION)');
  });

  it('explains a 500 as a processing failure', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 500, responseBody: { error: 'InternalServerError', message: 'internal server error' } }),
    );
    await expect(
      alttextifyApi.request({ apiKey: 'k', method: HttpMethod.POST, path: '/image/url', operation: 'generate alt text' }),
    ).rejects.toThrow('AltTextify failed to process the request (HTTP 500)');
  });

  it('falls back to a status hint without a vendor body', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 401, responseBody: '' }));
    await expect(
      alttextifyApi.request({ apiKey: 'k', method: HttpMethod.GET, path: '/image', operation: 'list images' }),
    ).rejects.toThrow('API key is missing or invalid');
  });

  it('warns about a possible credit charge on a POST transport error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(
      alttextifyApi.request({ apiKey: 'k', method: HttpMethod.POST, path: '/image/url', operation: 'generate alt text' }),
    ).rejects.toThrow('may still have been processed and charged a credit');
  });

  it('does not warn about credits on a GET transport error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(
      alttextifyApi.request({ apiKey: 'k', method: HttpMethod.GET, path: '/image', operation: 'list images' }),
    ).rejects.not.toThrow('credit');
  });
});

describe('auth validate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  const validate = ({ auth }: { auth: string }) =>
    Reflect.apply(alttextifyAuth.validate ?? (async () => ({ valid: true })), undefined, [{ auth }]);
  it('rejects a key that returns 401 and accepts one that returns 200', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new HttpError({}, { status: 401, responseBody: { error: 'unauthorized' } }),
    );
    const bad = await validate({ auth: 'bad' });
    expect(bad.valid).toBe(false);
    expect(bad.error).toContain('Invalid API key');
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ status: 200, headers: {}, body: [] });
    expect(await validate({ auth: 'good' })).toEqual({ valid: true });
  });
});

