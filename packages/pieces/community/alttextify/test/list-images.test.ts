import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { listImagesAction } from '../src/lib/actions/list-images';

function makeImages({ start, count }: { start: number; count: number }) {
  return Array.from({ length: count }, (_, index) => ({
    asset_id: `id-${start + index}`,
    alt_text: [`text ${start + index}`],
    created_at: '2025-03-21T08:39:29.751Z',
  }));
}

function runList({ maxResults }: { maxResults: number | undefined }) {
  const context = { auth: { secret_text: 'key' }, propsValue: { max_results: maxResults } };
  return Reflect.apply(listImagesAction.run, undefined, [context]);
}

describe('list-images', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('pages until a short page', async () => {
    const send = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: makeImages({ start: 0, count: 100 }) })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: makeImages({ start: 100, count: 30 }) });
    const output = await runList({ maxResults: 500 });
    expect(output).toMatchObject({ count: 130 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].queryParams).toEqual({ page: '2', limit: '100' });
  });

  it('stops at the cap', async () => {
    const send = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: makeImages({ start: 0, count: 25 }) });
    const output = await runList({ maxResults: undefined });
    expect(output).toMatchObject({ count: 25 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].queryParams).toEqual({ page: '1', limit: '25' });
  });

  it('rejects an out-of-range cap', async () => {
    await expect(runList({ maxResults: 501 })).rejects.toThrow('from 1 to 500');
  });
});
