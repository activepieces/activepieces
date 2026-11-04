import { describe, expect, it } from 'vitest';

import { adminPagination } from '@/app/components/admin/admin-pagination';

const all = (count: number) => ({
  data: Array.from({ length: count }, (_, index) => ({ id: `row-${index}` })),
  next: null,
  previous: null,
});

describe('adminPagination.slicePage', () => {
  it('points a cursor past the end back to the last page', () => {
    expect(
      adminPagination.slicePage({ page: all(25), cursor: '500', limit: '10' }),
    ).toEqual({ data: [], next: null, previous: '20' });
  });

  it('treats junk cursor and page size as the first page of 10', () => {
    const page = adminPagination.slicePage({
      page: all(25),
      cursor: 'abc',
      limit: '-3',
    });
    expect(page.data).toHaveLength(10);
    expect(page.data[0].id).toBe('row-0');
    expect(page.previous).toBeNull();
  });

  it('sends a cursor on an emptied list to the first page', () => {
    expect(
      adminPagination.slicePage({ page: all(0), cursor: '20', limit: '10' }),
    ).toEqual({ data: [], next: null, previous: null });
  });
});

describe('adminPagination.parseLimit', () => {
  it('falls back to 10 for any size the table does not offer', () => {
    for (const value of [null, '0', '-5', '2.5', '7', '100', '500', 'abc']) {
      expect(adminPagination.parseLimit(value)).toBe(10);
    }
  });
});
