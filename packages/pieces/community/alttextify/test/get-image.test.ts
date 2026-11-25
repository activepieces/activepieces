import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { getImageAction } from '../src/lib/actions/get-image';

function runGet({ assetId }: { assetId: string }) {
  const context = { auth: { secret_text: 'key' }, propsValue: { asset_id: assetId } };
  return Reflect.apply(getImageAction.run, undefined, [context]);
}

describe('get-image', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches by trimmed asset id and normalises alt_text', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { asset_id: 'a b', alt_text: ['A dog'], image_source: 'x.webp', created_at: '2025-03-21T08:39:29.751Z' },
    });
    const output = await runGet({ assetId: ' a b ' });
    expect(send.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: 'https://api.alttextify.net/api/v1/image/a%20b' });
    expect(output).toEqual({
      asset_id: 'a b',
      alt_text: 'A dog',
      alt_texts: ['A dog'],
      image_source: 'x.webp',
      tag: null,
      created_at: '2025-03-21T08:39:29.751Z',
      status: null,
    });
  });

  it('passes through a DELETED status', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { asset_id: 'a', alt_text: ['x'], status: 'DELETED' },
    });
    expect(await runGet({ assetId: 'a' })).toMatchObject({ status: 'DELETED' });
  });

  it('surfaces a 404', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: { error: 'notFound', message: 'Image not found' } }),
    );
    await expect(runGet({ assetId: 'x' })).rejects.toThrow('Image not found');
  });

  it('rejects a blank asset id', async () => {
    await expect(runGet({ assetId: '  ' })).rejects.toThrow('Asset ID is required.');
  });
});
