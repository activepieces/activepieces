import { describe, expect, it } from 'vitest';

import { adminPagination } from '@/app/components/admin/admin-pagination';

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `row-${index}` }));
const all = (count: number) => ({
  data: rows(count),
  next: null,
  previous: null,
});

describe('adminPagination.slicePage', () => {
  it('shows the first page by default', () => {
    const page = adminPagination.slicePage({
      page: all(25),
      cursor: null,
      limit: null,
    });
    expect(page.data.map((row) => row.id)).toEqual(
      rows(10).map((row) => row.id),
    );
    expect(page.next).toBe('10');
    expect(page.previous).toBeNull();
  });

  it('shows a middle page with both cursors', () => {
    const page = adminPagination.slicePage({
      page: all(25),
      cursor: '10',
      limit: '10',
    });
    expect(page.data[0].id).toBe('row-10');
    expect(page.next).toBe('20');
    expect(page.previous).toBe('0');
  });

  it('points back to the last page when the cursor is past the end', () => {
    const page = adminPagination.slicePage({
      page: all(25),
      cursor: '500',
      limit: '10',
    });
    expect(page).toEqual({ data: [], next: null, previous: '20' });
  });

  it('falls back to the first page and the default size for junk params', () => {
    const page = adminPagination.slicePage({
      page: all(25),
      cursor: 'abc',
      limit: '-3',
    });
    expect(page.data).toHaveLength(10);
    expect(page.data[0].id).toBe('row-0');
  });

  it('returns an empty page for an empty list', () => {
    const page = adminPagination.slicePage({
      page: all(0),
      cursor: '20',
      limit: '10',
    });
    expect(page).toEqual({ data: [], next: null, previous: null });
  });
});

describe('adminPagination.fitsOnOnePage', () => {
  it('is true for 10 rows or fewer with no other pages', () => {
    expect(adminPagination.fitsOnOnePage(all(10))).toBe(true);
  });

  it('is false past 10 rows', () => {
    expect(adminPagination.fitsOnOnePage(all(11))).toBe(false);
  });

  it('is false when another page exists', () => {
    expect(
      adminPagination.fitsOnOnePage({
        data: rows(3),
        next: '3',
        previous: null,
      }),
    ).toBe(false);
    expect(
      adminPagination.fitsOnOnePage({
        data: rows(3),
        next: null,
        previous: '0',
      }),
    ).toBe(false);
  });
});

describe('adminPagination.parseLimit', () => {
  it('accepts the page sizes the table offers', () => {
    expect(adminPagination.parseLimit('10')).toBe(10);
    expect(adminPagination.parseLimit('30')).toBe(30);
    expect(adminPagination.parseLimit('50')).toBe(50);
  });

  it('falls back to 10 for anything else', () => {
    for (const value of [null, '', '0', '-5', '2.5', '7', '100', '500', 'abc']) {
      expect(adminPagination.parseLimit(value)).toBe(10);
    }
  });
});
