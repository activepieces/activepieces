import { isNil, SeekPage } from '@activepieces/core-utils';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableProps,
  DataWithId,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';

import { adminSurface } from './admin-surface';

const DEFAULT_PAGE_SIZE = 10;

export function AdminDataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
>({
  hideFooterUntilNeeded = false,
  pageInBrowser = false,
  ...props
}: Omit<
  DataTableProps<TData, TValue, Keys>,
  'bordered' | 'frameClassName' | 'toolbarClassName'
> & {
  /** Keep the pagination footer hidden while the whole list fits on one page. */
  hideFooterUntilNeeded?: boolean;
  /** Page a list that is already fully loaded, keeping the page in the URL so reloads don't reset it. */
  pageInBrowser?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageInBrowser ? slicePage(props.page, searchParams) : props.page;

  const emptyPageWithPrevious =
    !props.isLoading &&
    !isNil(page) &&
    page.data.length === 0 &&
    !isNil(page.previous);
  useEffect(() => {
    if (!emptyPageWithPrevious || isNil(page?.previous)) {
      return;
    }
    const previous = page.previous;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(CURSOR_QUERY_PARAM, previous);
        return next;
      },
      { replace: true },
    );
  }, [emptyPageWithPrevious, page?.previous, setSearchParams]);

  const fitsOnOnePage =
    isNil(props.page) ||
    (props.page.data.length <= DEFAULT_PAGE_SIZE &&
      isNil(page?.next) &&
      isNil(page?.previous));

  return (
    <div
      data-slot="admin-data-table"
      className="flex max-h-full min-h-0 flex-initial flex-col"
    >
      <DataTable
        {...props}
        page={page}
        hidePagination={
          props.hidePagination || (hideFooterUntilNeeded && fitsOnOnePage)
        }
        emptyStateIcon={
          props.emptyStateIcon && (
            <span className="flex size-10 items-center justify-center rounded-lg bg-gray-3 text-gray-11 [&_svg]:size-5">
              {props.emptyStateIcon}
            </span>
          )
        }
        bordered
        frameClassName={adminSurface.listFrame}
        toolbarClassName="px-0 pt-0 pb-4"
      />
    </div>
  );
}

function slicePage<TData>(
  page: SeekPage<TData> | undefined,
  searchParams: URLSearchParams,
): SeekPage<TData> | undefined {
  if (isNil(page)) {
    return page;
  }
  const limit = toPositiveInt(
    searchParams.get(LIMIT_QUERY_PARAM),
    DEFAULT_PAGE_SIZE,
  );
  const requested = toPositiveInt(searchParams.get(CURSOR_QUERY_PARAM), 0);
  const lastPageStart = Math.max(
    0,
    Math.floor((page.data.length - 1) / limit) * limit,
  );
  const offset = Math.min(requested, lastPageStart);
  return {
    data: page.data.slice(offset, offset + limit),
    next: offset + limit < page.data.length ? `${offset + limit}` : null,
    previous: offset > 0 ? `${Math.max(0, offset - limit)}` : null,
  };
}

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
