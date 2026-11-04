import { isNil } from '@activepieces/core-utils';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableProps,
  DataWithId,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';

import { adminPagination } from './admin-pagination';
import { adminSurface } from './admin-surface';

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
  /** Keep the pagination footer hidden while the list has 10 rows or fewer. */
  hideFooterUntilNeeded?: boolean;
  /** Page a list that is already fully loaded, keeping the page in the URL so reloads don't reset it. */
  pageInBrowser?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cursor = searchParams.get(CURSOR_QUERY_PARAM);
  const page =
    pageInBrowser && !isNil(props.page)
      ? adminPagination.slicePage({
          page: props.page,
          cursor,
          limit: searchParams.get(LIMIT_QUERY_PARAM),
        })
      : props.page;

  // A page can come back empty, e.g. after deleting its last rows: go back a page, or to the first one.
  const landedOnEmptyPage =
    !props.isLoading &&
    !isNil(page) &&
    page.data.length === 0 &&
    !isNil(cursor);
  const previous = page?.previous ?? null;
  useEffect(() => {
    if (!landedOnEmptyPage) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (isNil(previous)) {
          next.delete(CURSOR_QUERY_PARAM);
        } else {
          next.set(CURSOR_QUERY_PARAM, previous);
        }
        return next;
      },
      { replace: true },
    );
  }, [landedOnEmptyPage, previous, setSearchParams]);

  // Keep the footer's last state while a page loads, so it doesn't blink.
  const lastFitsOnOnePage = useRef(true);
  if (!isNil(page)) {
    lastFitsOnOnePage.current = adminPagination.fitsOnOnePage(page);
  }

  return (
    <div
      data-slot="admin-data-table"
      className="flex max-h-full min-h-0 flex-initial flex-col"
    >
      <DataTable
        {...props}
        page={page}
        hidePagination={
          props.hidePagination ||
          (hideFooterUntilNeeded && lastFitsOnOnePage.current)
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
