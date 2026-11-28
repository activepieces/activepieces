import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.hoisted(() => vi.fn());

vi.mock('monday-sdk-js', () => ({
  default: () => ({
    setToken: vi.fn(),
    setApiVersion: vi.fn(),
    api: apiMock,
  }),
}));

import { mondayClient } from '../src/lib/common/client';

const columnIds = ['status', 'people'];

function firstPageResponse({
  items,
  cursor,
}: {
  items: { id: string }[];
  cursor: string | null;
}) {
  return { data: { boards: [{ items_page: { items, cursor } }] } };
}

function nextPageResponse({
  items,
  cursor,
}: {
  items: { id: string }[];
  cursor: string | null;
}) {
  return { data: { next_items_page: { items, cursor } } };
}

describe('mondayClient.getAllBoardItemValues', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it('returns an empty list for a board with no results', async () => {
    apiMock.mockResolvedValueOnce({ data: { boards: [] } });

    const result = await new mondayClient('key').getAllBoardItemValues({
      boardId: '1',
      columnIds,
    });

    expect(result).toEqual([]);
    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  it('returns the items of a single page with one request', async () => {
    apiMock.mockResolvedValueOnce(
      firstPageResponse({ items: [{ id: 'a' }, { id: 'b' }], cursor: null })
    );

    const result = await new mondayClient('key').getAllBoardItemValues({
      boardId: '1',
      columnIds,
    });

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  it('follows the cursor across pages and keeps item order', async () => {
    apiMock
      .mockResolvedValueOnce(
        firstPageResponse({ items: [{ id: 'a' }], cursor: 'c1' })
      )
      .mockResolvedValueOnce(
        nextPageResponse({ items: [{ id: 'b' }], cursor: 'c2' })
      )
      .mockResolvedValueOnce(
        nextPageResponse({ items: [{ id: 'c' }], cursor: null })
      );

    const result = await new mondayClient('key').getAllBoardItemValues({
      boardId: '1',
      columnIds,
    });

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(apiMock).toHaveBeenCalledTimes(3);
    expect(apiMock.mock.calls[0][1].variables).toEqual({
      boardId: '1',
      columnIds,
    });
    expect(apiMock.mock.calls[1][1].variables).toEqual({
      cursor: 'c1',
      columnIds,
    });
    expect(apiMock.mock.calls[2][1].variables).toEqual({
      cursor: 'c2',
      columnIds,
    });
  });

  it('rejects when a later page request fails', async () => {
    apiMock
      .mockResolvedValueOnce(
        firstPageResponse({ items: [{ id: 'a' }], cursor: 'c1' })
      )
      .mockRejectedValueOnce(new Error('page failed'));

    await expect(
      new mondayClient('key').getAllBoardItemValues({
        boardId: '1',
        columnIds,
      })
    ).rejects.toThrow('page failed');
    expect(apiMock).toHaveBeenCalledTimes(2);
  });
});
