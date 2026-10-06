import { beforeEach, describe, expect, it, vi } from 'vitest';

const search = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { search } };
});

const { polling, newRecord } = await import('../../../src/lib/triggers/new-record');

const AUTH = { access_token: 'ya29.test-token' };

describe('newRecord polling', () => {
  beforeEach(() => {
    search.mockReset();
  });

  it('should be a last-item poll (ids grow monotonically)', () => {
    expect(newRecord.type).toBe('POLLING');
    expect(polling.strategy).toBe(1);
  });

  it('should query the newest records of the type and key them by id', async () => {
    search.mockResolvedValue({
      results: [
        { adGroupAd: { ad: { id: '30' }, status: 'ENABLED' } },
        { adGroupAd: { ad: { id: '20' }, status: 'PAUSED' } },
      ],
    });

    const items = await polling.items({
      auth: AUTH,
      propsValue: { customerId: '1234567890', resourceType: 'ad_group_ad' },
      store: {} as never,
      lastItemId: '10',
    } as never);

    expect(search).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      query: expect.stringMatching(/^SELECT ad_group_ad\.ad\.id, .* FROM ad_group_ad WHERE ad_group_ad\.status != 'REMOVED' ORDER BY ad_group_ad\.ad\.id DESC LIMIT 100$/),
    });
    expect(items).toEqual([
      { id: '30', data: { adGroupAd: { ad: { id: '30' }, status: 'ENABLED' } } },
      { id: '20', data: { adGroupAd: { ad: { id: '20' }, status: 'PAUSED' } } },
    ]);
  });

  it('should apply the keyword filter for criteria', async () => {
    search.mockResolvedValue({ results: [] });

    await polling.items({
      auth: AUTH,
      propsValue: { customerId: '1234567890', resourceType: 'ad_group_criterion' },
      store: {} as never,
      lastItemId: undefined,
    } as never);

    expect(search).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: expect.stringContaining("WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED' ORDER BY") });
  });
});
