import { isNil, SeekPage } from '@activepieces/core-utils';

// Admin tables hide the pagination footer while a list has this many rows or fewer.
export const SINGLE_PAGE_ROWS = 10;

function slicePage<TData>({
  page,
  cursor,
  limit,
}: {
  page: SeekPage<TData>;
  cursor: string | null;
  limit: string | null;
}): SeekPage<TData> {
  const pageSize = toPositiveInt(limit, SINGLE_PAGE_ROWS);
  const lastPageStart = Math.max(
    0,
    Math.floor((page.data.length - 1) / pageSize) * pageSize,
  );
  const offset = Math.min(toPositiveInt(cursor, 0), lastPageStart);
  return {
    data: page.data.slice(offset, offset + pageSize),
    next: offset + pageSize < page.data.length ? `${offset + pageSize}` : null,
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

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const adminPagination = { slicePage, fitsOnOnePage };
