'use client';

import { apId, isNil, SeekPage } from '@activepieces/core-utils';
import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDeepCompareEffect } from 'react-use';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { DataFetchErrorState } from '../data-fetch-error-state';

import { DataTableBulkActions } from './data-table-bulk-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFilter, DataTableFilterProps } from './data-table-filter';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableToolbar } from './data-table-toolbar';

export type DataWithId = {
  id?: string;
};
export type RowDataWithActions<TData extends DataWithId> = TData & {
  delete: () => void;
  update: (payload: Partial<TData>) => void;
};

export const CURSOR_QUERY_PARAM = 'cursor';
export const LIMIT_QUERY_PARAM = 'limit';
export const PAGE_QUERY_PARAM = 'page';

type DataTableAction<TData extends DataWithId> = (
  row: RowDataWithActions<TData>,
) => React.ReactNode;

type ColumnDef<TData, TValue> = TanstackColumnDef<TData, TValue> & {
  notClickable?: boolean;
};

interface DataTableProps<
  TData extends DataWithId,
  TValue,
  Keys extends string,
> {
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  page: SeekPage<TData> | undefined;
  onRowClick?: (
    row: RowDataWithActions<TData>,
    newWindow: boolean,
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;
  isLoading: boolean;
  isError: boolean;
  errorStateEntity: string;
  onRetry?: () => void;
  filters?: DataTableFilters<Keys>[];
  customFilters?: React.ReactNode[];
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
  bulkActions?: BulkAction<TData>[];
  toolbarButtons?: React.ReactNode[];
  emptyStateTextTitle: string;
  emptyStateTextDescription: string;
  emptyStateIcon: React.ReactNode;
  emptyStateAction?: React.ReactNode;
  selectColumn?: boolean;
  initialSorting?: SortingState;
  clientPagination?: boolean;
  clientFiltering?: boolean;
  getRowClassName?: (row: RowDataWithActions<TData>, index: number) => string;
  isRowSelectionDisabled?: (row: RowDataWithActions<TData>) => boolean;
  getRowId?: (row: TData) => string;
  virtualizeRows?: boolean;
}

export type DataTableFilters<Keys extends string> = DataTableFilterProps & {
  accessorKey: Keys;
};

export type BulkAction<TData extends DataWithId> = {
  render: (
    selectedRows: RowDataWithActions<TData>[],
    resetSelection: () => void,
  ) => React.ReactNode;
};

export function DataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
>({
  columns: columnsInitial,
  page,
  onRowClick,
  filters = [],
  actions = [],
  isLoading,
  isError,
  errorStateEntity,
  onRetry,
  onSelectedRowsChange,
  hidePagination,
  bulkActions = [],
  toolbarButtons,
  emptyStateTextTitle,
  emptyStateTextDescription,
  emptyStateIcon,
  emptyStateAction,
  customFilters,
  selectColumn = false,
  initialSorting = [],
  clientPagination = false,
  clientFiltering = false,
  getRowClassName,
  isRowSelectionDisabled,
  getRowId,
  virtualizeRows = false,
}: DataTableProps<TData, TValue, Keys>) {
  const selectColumnDef: ColumnDef<RowDataWithActions<TData>, TValue> = {
    id: 'select',
    accessorKey: 'select',
    notClickable: true,
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
      <div className="flex items-center h-full">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center h-full">
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
  };

  const columnsWithSelect = selectColumn
    ? [selectColumnDef, ...columnsInitial]
    : columnsInitial;

  const columns =
    actions.length > 0
      ? columnsWithSelect.concat([
          {
            accessorKey: '__actions',
            size: 60,
            minSize: 60,
            maxSize: 60,
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="" />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex justify-end gap-3">
                  {actions.map((action, index) => {
                    return (
                      <React.Fragment key={index}>
                        {action(row.original)}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            },
          },
        ])
      : columnsWithSelect;

  const columnVisibility = columnsInitial.reduce((acc, column) => {
    if (column.enableHiding && 'accessorKey' in column) {
      acc[column.accessorKey as string] = false;
    }
    return acc;
  }, {} as Record<string, boolean>);

  const [searchParams, setSearchParams] = useSearchParams();
  const startingCursor = searchParams.get('cursor') || undefined;
  const startingLimit = parseLimit(searchParams.get(LIMIT_QUERY_PARAM));
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    startingCursor,
  );
  const [lastUrlCursor, setLastUrlCursor] = useState(startingCursor);
  if (startingCursor !== lastUrlCursor) {
    setLastUrlCursor(startingCursor);
    setCurrentCursor(startingCursor);
  }
  const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(
    page?.next ?? undefined,
  );
  const [previousPageCursor, setPreviousPageCursor] = useState<
    string | undefined
  >(page?.previous ?? undefined);

  const enrichPageData = (data: TData[]) => {
    return data.map((row, index) => ({
      ...row,
      delete: () => {
        setDeletedRows((prevDeletedRows) => [...prevDeletedRows, row]);
      },
      update: (payload: Partial<TData>) => {
        setTableData((prevData) => {
          const newData = [...prevData];
          newData[index] = { ...newData[index], ...payload };
          return newData;
        });
      },
    }));
  };

  const [deletedRows, setDeletedRows] = useState<TData[]>([]);
  const [tableData, setTableData] = useState<RowDataWithActions<TData>[]>(
    enrichPageData(page?.data ?? []),
  );

  useDeepCompareEffect(() => {
    setNextPageCursor(page?.next ?? undefined);
    setPreviousPageCursor(page?.previous ?? undefined);
    setTableData(enrichPageData(page?.data ?? []));
    if (getRowId && page) {
      const shown = new Set(page.data.map((row) => getRowId(row)));
      table.setRowSelection((selection) =>
        Object.fromEntries(
          Object.entries(selection).filter(([id]) => shown.has(id)),
        ),
      );
    }
  }, [page?.data]);

  const urlPagination = {
    pageIndex: clampPageIndex({
      pageIndex: parsePageIndex(searchParams.get(PAGE_QUERY_PARAM)),
      rowCount: tableData.length,
      pageSize: startingLimit,
    }),
    pageSize: startingLimit,
  };

  const table = useReactTable({
    data: tableData,
    columns,
    ...(clientPagination &&
      !virtualizeRows && {
        state: { pagination: urlPagination },
        autoResetPageIndex: false,
        onPaginationChange: (updater) => {
          const next =
            typeof updater === 'function' ? updater(urlPagination) : updater;
          setSearchParams(
            (prev) => {
              const params = new URLSearchParams(prev);
              if (next.pageIndex === 0) {
                params.delete(PAGE_QUERY_PARAM);
              } else {
                params.set(PAGE_QUERY_PARAM, `${next.pageIndex + 1}`);
              }
              if (next.pageSize === DEFAULT_PAGE_SIZE) {
                params.delete(LIMIT_QUERY_PARAM);
              } else {
                params.set(LIMIT_QUERY_PARAM, `${next.pageSize}`);
              }
              return params;
            },
            { replace: true },
          );
        },
      }),
    enableRowSelection: isRowSelectionDisabled
      ? (row) => !isRowSelectionDisabled(row.original)
      : undefined,
    manualPagination: virtualizeRows ? false : !clientPagination,
    manualFiltering: !clientFiltering,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(clientFiltering && { getFilteredRowModel: getFilteredRowModel() }),
    ...((clientPagination || virtualizeRows) && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    getRowId: getRowId ? (row) => getRowId(row) : () => apId(),
    initialState: {
      pagination: {
        pageSize: virtualizeRows ? tableData.length || 1000 : startingLimit,
      },
      columnVisibility,
      sorting: initialSorting,
    },
  });

  const columnFor = (id: string) =>
    table.getAllLeafColumns().find((column) => column.id === id);

  useEffect(() => {
    filters?.forEach((filter) => {
      const column = columnFor(filter.accessorKey);
      if (!column) return;
      if (filter.type === 'input') {
        const value = searchParams.get(filter.accessorKey);
        if (value) column.setFilterValue(value);
      } else {
        const values = searchParams.getAll(filter.accessorKey);
        if (values.length) column.setFilterValue(values);
      }
    });
  }, []);

  const rowSelection = table.getState().rowSelection;
  const selectedRowOriginals = React.useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [rowSelection],
  );
  useEffect(() => {
    onSelectedRowsChange?.(selectedRowOriginals);
  }, [selectedRowOriginals]);

  useEffect(() => {
    if (hidePagination) {
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    if (!isNil(currentCursor) && currentCursor !== '') {
      newParams.set(CURSOR_QUERY_PARAM, currentCursor);
    } else {
      newParams.delete(CURSOR_QUERY_PARAM);
    }
    const pageSize = table.getState().pagination.pageSize;
    if (pageSize === DEFAULT_PAGE_SIZE) {
      newParams.delete(LIMIT_QUERY_PARAM);
    } else {
      newParams.set(LIMIT_QUERY_PARAM, `${pageSize}`);
    }
    if (newParams.toString() === searchParams.toString()) {
      return;
    }
    setSearchParams(newParams, { replace: true });
  }, [currentCursor, table.getState().pagination.pageSize, hidePagination]);

  useEffect(() => {
    setTableData(
      tableData.filter(
        (row) => !deletedRows.some((deletedRow) => deletedRow.id === row.id),
      ),
    );
  }, [deletedRows]);

  const resetSelection = () => {
    table.toggleAllRowsSelected(false);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const columnLayout = layoutColumns({
    columns: table.getVisibleLeafColumns().map((column) => ({
      id: column.id,
      size: column.columnDef.size ?? DEFAULT_COLUMN_SIZE,
    })),
  });
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 53,
    overscan: 15,
    enabled: virtualizeRows,
  });

  return (
    <div className={cn('flex flex-col', virtualizeRows && 'min-h-0 flex-1')}>
      {((filters && filters.length > 0) ||
        (customFilters && customFilters.length > 0) ||
        (toolbarButtons && toolbarButtons.length > 0)) && (
        <DataTableToolbar>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {filters &&
                filters.map((filter) => (
                  <DataTableFilter
                    key={filter.accessorKey}
                    column={columnFor(filter.accessorKey)}
                    {...filter}
                  />
                ))}
              {customFilters &&
                customFilters.map((filter, idx) => (
                  <React.Fragment key={idx}>{filter}</React.Fragment>
                ))}
            </div>
            {toolbarButtons && toolbarButtons.length > 0 && (
              <div className="flex items-center gap-2">
                {toolbarButtons.map((button, idx) => (
                  <React.Fragment key={idx}>{button}</React.Fragment>
                ))}
              </div>
            )}
          </div>
        </DataTableToolbar>
      )}

      <div
        ref={scrollContainerRef}
        className={cn(
          'overflow-hidden rounded-2xl bg-panel shadow-edge',
          virtualizeRows && 'min-h-0 flex-1 overflow-auto',
        )}
      >
        <Table
          className="table-fixed"
          style={{ minWidth: columnLayout.minWidth }}
        >
          <colgroup>
            {columnLayout.columns.map((column) => (
              <col key={column.id} style={{ width: column.width }} />
            ))}
          </colgroup>
          <TableHeader
            className={cn(virtualizeRows ? 'sticky top-0 z-10' : undefined)}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center"
                >
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              virtualizeRows ? (
                <>
                  {virtualizer.getVirtualItems().length > 0 && (
                    <tr>
                      <td
                        colSpan={visibleColumnCount}
                        style={{
                          height: virtualizer.getVirtualItems()[0].start,
                        }}
                      />
                    </tr>
                  )}
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    const rowIndex = virtualRow.index;
                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        className={cn(
                          'cursor-pointer',
                          {
                            'cursor-default hover:bg-transparent':
                              isNil(onRowClick),
                          },
                          getRowClassName?.(row.original, rowIndex),
                        )}
                        onClick={(e) => {
                          const clickedCellIndex = (
                            e.target as HTMLElement
                          ).closest('td')?.cellIndex;
                          if (
                            clickedCellIndex !== undefined &&
                            columns[clickedCellIndex]?.notClickable
                          ) {
                            return;
                          }
                          onRowClick?.(row.original, e.ctrlKey || e.metaKey, e);
                        }}
                        onAuxClick={(e) => {
                          const clickedCellIndex = (
                            e.target as HTMLElement
                          ).closest('td')?.cellIndex;
                          if (
                            clickedCellIndex !== undefined &&
                            columns[clickedCellIndex]?.notClickable
                          ) {
                            return;
                          }
                          onRowClick?.(row.original, true, e);
                        }}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => {
                          return (
                            <TableCell key={cell.id}>
                              <div
                                className={cn('flex w-full items-center', {
                                  'justify-end': cell.column.id === 'actions',
                                  'justify-start': cell.column.id !== 'actions',
                                })}
                              >
                                <div
                                  className="w-full"
                                  onClick={(e) => {
                                    if (cell.column.id === 'select') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return;
                                    }
                                  }}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  {virtualizer.getVirtualItems().length > 0 && (
                    <tr>
                      <td
                        colSpan={visibleColumnCount}
                        style={{
                          height:
                            virtualizer.getTotalSize() -
                            (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                        }}
                      />
                    </tr>
                  )}
                </>
              ) : (
                rows.map((row, rowIndex) => (
                  <TableRow
                    className={cn(
                      'cursor-pointer',
                      {
                        'cursor-default hover:bg-transparent':
                          isNil(onRowClick),
                      },
                      getRowClassName?.(row.original, rowIndex),
                    )}
                    onClick={(e) => {
                      const clickedCellIndex = (
                        e.target as HTMLElement
                      ).closest('td')?.cellIndex;
                      if (
                        clickedCellIndex !== undefined &&
                        columns[clickedCellIndex]?.notClickable
                      ) {
                        return;
                      }
                      onRowClick?.(row.original, e.ctrlKey || e.metaKey, e);
                    }}
                    onAuxClick={(e) => {
                      const clickedCellIndex = (
                        e.target as HTMLElement
                      ).closest('td')?.cellIndex;
                      if (
                        clickedCellIndex !== undefined &&
                        columns[clickedCellIndex]?.notClickable
                      ) {
                        return;
                      }
                      onRowClick?.(row.original, true, e);
                    }}
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell key={cell.id}>
                          <div
                            className={cn('flex w-full items-center', {
                              'justify-end': cell.column.id === 'actions',
                              'justify-start': cell.column.id !== 'actions',
                            })}
                          >
                            <div
                              className="w-full"
                              onClick={(e) => {
                                if (cell.column.id === 'select') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )
            ) : isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-[350px] text-center"
                >
                  <DataFetchErrorState
                    entity={errorStateEntity}
                    onRetry={onRetry}
                  />
                </TableCell>
              </TableRow>
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-[350px] text-center"
                >
                  <Empty className="border-0 p-0">
                    <EmptyHeader>
                      {emptyStateIcon && (
                        <EmptyMedia variant="icon">{emptyStateIcon}</EmptyMedia>
                      )}
                      <EmptyTitle>{emptyStateTextTitle}</EmptyTitle>
                      {emptyStateTextDescription && (
                        <EmptyDescription>
                          {emptyStateTextDescription}
                        </EmptyDescription>
                      )}
                    </EmptyHeader>
                    {emptyStateAction && (
                      <EmptyContent>{emptyStateAction}</EmptyContent>
                    )}
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!hidePagination && !virtualizeRows && (
        <div className="flex items-center justify-end gap-3 pt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-11">{t('Rows per page')}</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                if (!clientPagination) {
                  setCurrentCursor(undefined);
                }
              }}
            >
              <SelectTrigger size="sm" className="w-20">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (clientPagination) {
                table.previousPage();
              } else {
                setCurrentCursor(previousPageCursor);
              }
            }}
            disabled={
              clientPagination
                ? !table.getCanPreviousPage()
                : !previousPageCursor
            }
          >
            <ChevronLeft />
            {t('Previous')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (clientPagination) {
                table.nextPage();
              } else {
                setCurrentCursor(nextPageCursor);
              }
            }}
            disabled={
              clientPagination ? !table.getCanNextPage() : !nextPageCursor
            }
          >
            {t('Next')}
            <ChevronRight />
          </Button>
        </div>
      )}
      {bulkActions.length > 0 && page && (
        <DataTableBulkActions
          selectedRows={selectedRowOriginals}
          actions={bulkActions}
          resetSelection={resetSelection}
        />
      )}
    </div>
  );
}

function layoutColumns({ columns }: { columns: ColumnSize[] }): ColumnLayout {
  const fluid = columns.filter((column) => column.size > FIXED_COLUMN_MAX);
  const fluidTotal = fluid.reduce((total, column) => total + column.size, 0);
  const fixedTotal = columns
    .filter((column) => column.size <= FIXED_COLUMN_MAX)
    .reduce((total, column) => total + column.size, 0);
  return {
    columns: columns.map((column) => ({
      id: column.id,
      width:
        column.size <= FIXED_COLUMN_MAX || fluidTotal === 0
          ? `${column.size}px`
          : `${((column.size / fluidTotal) * 100).toFixed(3)}%`,
    })),
    minWidth: Math.round(fixedTotal + fluidTotal * FLUID_SHRINK_LIMIT),
  };
}

function parsePageIndex(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 1 ? parsed - 1 : 0;
}

function clampPageIndex({
  pageIndex,
  rowCount,
  pageSize,
}: {
  pageIndex: number;
  rowCount: number;
  pageSize: number;
}): number {
  if (rowCount === 0) {
    return pageIndex;
  }
  return Math.min(pageIndex, Math.ceil(rowCount / pageSize) - 1);
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_PAGE_SIZE
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const DEFAULT_COLUMN_SIZE = 150;
const FIXED_COLUMN_MAX = 64;
const FLUID_SHRINK_LIMIT = 0.7;

type ColumnSize = { id: string; size: number };

type ColumnLayout = {
  columns: { id: string; width: string }[];
  minWidth: number;
};
