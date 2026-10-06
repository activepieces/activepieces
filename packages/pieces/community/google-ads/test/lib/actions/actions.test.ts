import { beforeEach, describe, expect, it, vi } from 'vitest';

const search = vi.fn<() => Promise<unknown>>();
const searchAll = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { search, searchAll } };
});

const { searchRecords } = await import('../../../src/lib/actions/search-records');

const AUTH = { access_token: 'ya29.test-token', props: { loginCustomerId: '' } };

function actionContext(propsValue: Record<string, unknown>) {
  return { auth: AUTH, propsValue } as never;
}

describe('searchRecords', () => {
  beforeEach(() => {
    search.mockReset();
    searchAll.mockReset();
  });

  it('should return one page with its next token when not fetching all pages', async () => {
    search.mockResolvedValue({
      results: [{ campaign: { id: '1' } }],
      nextPageToken: 'p2',
    });

    const output = await searchRecords.run(
      actionContext({ customerId: '1234567890', query: 'SELECT campaign.id FROM campaign', fetchAllPages: false, pageToken: 'p1' })
    );

    expect(search).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT campaign.id FROM campaign', pageToken: 'p1' });
    expect(output).toEqual({
      results: [{ campaign: { id: '1' } }],
      count: 1,
      nextPageToken: 'p2',
    });
  });

  it('should null the token on the last page', async () => {
    search.mockResolvedValue({ results: [] });

    const output = await searchRecords.run(actionContext({ customerId: '1234567890', query: 'SELECT x FROM y' }));

    expect(search).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y', pageToken: undefined });
    expect(output).toEqual({ results: [], count: 0, nextPageToken: null });
  });

  it('should follow every page up to the row cap when fetching all pages', async () => {
    searchAll.mockResolvedValue({ results: [{ n: 1 }, { n: 2 }], truncated: true });

    const output = await searchRecords.run(
      actionContext({ customerId: '1234567890', query: 'SELECT x FROM y', fetchAllPages: true, maxRows: 2 })
    );

    expect(searchAll).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y', maxRows: 2 });
    expect(output).toEqual({ results: [{ n: 1 }, { n: 2 }], count: 2, truncated: true });
  });

  it('should default and clamp the row cap', async () => {
    searchAll.mockResolvedValue({ results: [], truncated: false });

    await searchRecords.run(actionContext({ customerId: '1234567890', query: 'SELECT x FROM y', fetchAllPages: true }));
    expect(searchAll).toHaveBeenLastCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y', maxRows: 1000 });

    await searchRecords.run(
      actionContext({ customerId: '1234567890', query: 'SELECT x FROM y', fetchAllPages: true, maxRows: 5_000_000 })
    );
    expect(searchAll).toHaveBeenLastCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y', maxRows: 100_000 });
  });
});
