/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [], next: null, previous: null }),
  },
}));

import { api } from '@/lib/api';
import { pieceSetsApi } from '@/features/piece-sets';

const getMock = api.get as ReturnType<typeof vi.fn>;

describe('pieceSetsApi.list', () => {
  beforeEach(() => {
    getMock.mockClear();
  });

  it('forwards cursor and limit as query params', async () => {
    await pieceSetsApi.list({ cursor: 'abc', limit: 25 });
    expect(getMock).toHaveBeenCalledWith('/v1/piece-sets', {
      cursor: 'abc',
      limit: 25,
    });
  });

  it('sends an empty query when called with no args', async () => {
    await pieceSetsApi.list();
    expect(getMock).toHaveBeenCalledWith('/v1/piece-sets', {});
  });
});
