import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { fetchCallDetailsInternals } from '../src/lib/actions/fetch-call-details';

const auth = { username: 'id', password: 'secret' };

describe('fetchCallDetails', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('reports a missing call per item without failing the batch', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      if (req.url.endsWith('/missing')) {
        throw new HttpError({}, { status: 404, responseBody: { success: false, message: 'Call not found' } });
      }
      return { status: 200, headers: {}, body: { data: { uuid: req.url.split('/').pop(), created_at: 'x', summary: 's', tasks: [] } } };
    });
    const result = await fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: ['a', 'missing', 'b'], include: [] });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(result.found_count).toBe(2);
    expect(result.not_found_count).toBe(1);
    expect(result.results[1]).toMatchObject({ uuid: 'missing', found: false });
    expect(result.results[0]).toMatchObject({ uuid: 'a', found: true });
  });

  it('fails the batch on 401', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 401, responseBody: {} }));
    await expect(fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: ['a'], include: [] })).rejects.toThrow(/401/);
  });

  it('fails the batch on a 500 after an earlier call succeeded', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      if (req.url.endsWith('/broken')) {
        throw new HttpError({}, { status: 500, responseBody: { message: 'boom' } });
      }
      return { status: 200, headers: {}, body: { data: { uuid: 'a', created_at: 'x' } } };
    });
    await expect(
      fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: ['a', 'broken'], include: [] }),
    ).rejects.toThrow(/500/);
  });

  it('fails the batch on a network error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('ECONNRESET'));
    await expect(fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: ['a'], include: [] })).rejects.toThrow(/ECONNRESET/);
  });

  it('enforces 20 UUIDs, and 5 with include', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const many = Array.from({ length: 21 }, (_, i) => `id-${i}`);
    await expect(fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: many, include: [] })).rejects.toThrow(/20/);
    await expect(
      fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: many.slice(0, 6), include: ['chapters'] }),
    ).rejects.toThrow(/5/);
    await expect(fetchCallDetailsInternals.fetchCallDetails({ auth, callUuids: [' '], include: [] })).rejects.toThrow(/at least one/);
    expect(spy).not.toHaveBeenCalled();
  });
});
