import { beforeEach, describe, expect, it, vi } from 'vitest';

const search = vi.fn<() => Promise<unknown>>();
const searchAll = vi.fn<(params: { maxRows: number }) => Promise<unknown>>();

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

  it.each([
    [1.5, 1],
    [0.4, 1],
    [-3, 1],
    [2.9, 2],
  ])('should treat a Max Rows of %s as %i and report the rest as truncated', async (maxRows, expected) => {
    const rows = [{ n: 1 }, { n: 2 }, { n: 3 }];
    searchAll.mockImplementation(async (params: { maxRows: number }) => ({ results: rows.slice(0, params.maxRows), truncated: rows.length > params.maxRows }));

    const output = await searchRecords.run(actionContext({ customerId: '1234567890', query: 'SELECT x FROM y', fetchAllPages: true, maxRows }));

    expect(searchAll).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT x FROM y', maxRows: expected });
    expect(output).toEqual({ results: rows.slice(0, expected), count: expected, truncated: true });
  });
});
