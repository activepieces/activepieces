import { isNil, SeekPage } from '@activepieces/core-utils';

function slicePage<TData>({
  page,
  cursor,
  limit,
}: {
  page: SeekPage<TData>;
  cursor: string | null;
  limit: string | null;
}): SeekPage<TData> {
  const pageSize = parseLimit(limit);
  const offset = toPositiveInt({ value: cursor, fallback: 0 });
  const total = page.data.length;
  if (offset > 0 && offset >= total) {
    return {
      data: [],
      next: null,
      previous:
        total > 0 ? `${Math.floor((total - 1) / pageSize) * pageSize}` : null,
    };
  }
  return {
    data: page.data.slice(offset, offset + pageSize),
    next: offset + pageSize < total ? `${offset + pageSize}` : null,
    previous: offset > 0 ? `${Math.max(0, offset - pageSize)}` : null,
  };
}

function fitsOnOnePage<TData>(page: SeekPage<TData>): boolean {
  return (
    page.data.length <= SINGLE_PAGE_ROWS &&
    isNil(page.next) &&
    isNil(page.previous)
  );
}

function parseLimit(value: string | null): number {
  const limit = Number(value);
  return PAGE_SIZE_OPTIONS.includes(limit) ? limit : SINGLE_PAGE_ROWS;
}

function toPositiveInt({
  value,
  fallback,
}: {
  value: string | null;
  fallback: number;
}): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const adminPagination = { slicePage, fitsOnOnePage, parseLimit };

const SINGLE_PAGE_ROWS = 10;
const PAGE_SIZE_OPTIONS = [10, 30, 50];
