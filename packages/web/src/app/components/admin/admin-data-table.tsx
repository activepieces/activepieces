import { isNil } from '@activepieces/core-utils';
import { useEffect } from 'react';
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
  hideFooterUntilNeeded?: boolean;
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

  const followsEmptyPages = hideFooterUntilNeeded || pageInBrowser;
  const landedOnEmptyPage =
    followsEmptyPages &&
    !props.isLoading &&
    !props.isError &&
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
        if (isNil(previous) || previous === adminPagination.FIRST_PAGE_CURSOR) {
          next.delete(CURSOR_QUERY_PARAM);
        } else {
          next.set(CURSOR_QUERY_PARAM, previous);
        }
        return next;
      },
      { replace: true },
    );
  }, [landedOnEmptyPage, previous, setSearchParams]);

  const hideFooter =
    props.hidePagination ||
    (hideFooterUntilNeeded &&
      (isNil(page) || adminPagination.fitsOnOnePage(page)));

  const emptyStateIcon = props.emptyStateIcon && (
    <span className="flex size-10 items-center justify-center rounded-lg bg-gray-3 text-gray-11 [&_svg]:size-5">
      {props.emptyStateIcon}
    </span>
  );

  return (
    <div
      data-slot="admin-data-table"
      className="flex max-h-full min-h-0 flex-initial flex-col"
    >
      <DataTable
        {...props}
        {...(followsEmptyPages && {
          isLoading: props.isLoading || landedOnEmptyPage,
          page,
          hidePagination: hideFooter,
          syncPagingWithPage: true,
          firstPageCursor: adminPagination.FIRST_PAGE_CURSOR,
        })}
        emptyStateIcon={emptyStateIcon}
        bordered
        frameClassName={adminSurface.listFrame}
        toolbarClassName="px-0 pt-0 pb-4"
      />
    </div>
  );
}
