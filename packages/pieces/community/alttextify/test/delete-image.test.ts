import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { deleteImageAction } from '../src/lib/actions/delete-image';

function runDelete({ assetId }: { assetId: string }) {
  const context = { auth: { secret_text: 'key' }, propsValue: { asset_id: assetId } };
  return Reflect.apply(deleteImageAction.run, undefined, [context]);
}

describe('delete-image', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends DELETE and returns a confirmation', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { asset_id: 'abc', alt_text: '["A dog"]', status: 'DELETED' },
    });
    const output = await runDelete({ assetId: 'abc' });
    expect(send.mock.calls[0][0]).toMatchObject({ method: HttpMethod.DELETE, url: 'https://api.alttextify.net/api/v1/image/abc' });
    expect(output).toEqual({ deleted: true, asset_id: 'abc', status: 'DELETED' });
  });

  it.each([[''], [null], [{}]])('throws when the body is empty (%j)', async (body) => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
    await expect(runDelete({ assetId: 'totally-fake-id' })).rejects.toThrow(
      'AltTextify has no image with this asset ID (nothing was deleted).',
    );
  });

  it('surfaces a 404', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: { error: 'notFound', message: 'Image not found' } }),
    );
    await expect(runDelete({ assetId: 'abc' })).rejects.toThrow('(HTTP 404): Image not found (notFound)');
  });
});
