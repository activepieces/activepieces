'use client';

import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { t } from 'i18next';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDeepCompareEffect } from 'react-use';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { apId, isNil, SeekPage } from '@activepieces/shared';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../select';

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

type DataTableAction<TData extends DataWithId> = (
  row: RowDataWithActions<TData>,
) => JSX.Element;

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
  filters?: DataTableFilters<Keys>[];
  customFilters?: React.ReactNode[];
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
  bulkActions?: BulkAction<TData>[];
  emptyStateTextTitle: string;
  emptyStateTextDescription: string;
  emptyStateIcon: React.ReactNode;
  selectColumn?: boolean;
  initialSorting?: SortingState;
  clientPagination?: boolean;
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
  onSelectedRowsChange,
  hidePagination,
  bulkActions = [],
  emptyStateTextTitle,
  emptyStateTextDescription,
  emptyStateIcon,
  customFilters,
  selectColumn = false,
  initialSorting = [],
  clientPagination = false,
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
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="" />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex justify-end gap-4">
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
  const startingLimit = searchParams.get('limit') || '10';
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    startingCursor,
  );
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
  }, [page?.data]);

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: !clientPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(clientPagination && { getPaginationRowModel: getPaginationRowModel() }),
    getRowId: () => apId(),
    initialState: {
      pagination: {
        pageSize: parseInt(startingLimit),
      },
      columnVisibility,
      sorting: initialSorting,
    },
  });

  useEffect(() => {
    filters?.forEach((filter) => {
      const column = table.getColumn(filter.accessorKey);
      const values = searchParams.getAll(filter.accessorKey);
      if (column && values) {
        column.setFilterValue(values);
      }
    });
  }, []);

  useDeepCompareEffect(() => {
    onSelectedRowsChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  }, [table.getSelectedRowModel().rows]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);

        if (!isNil(currentCursor) && currentCursor !== '') {
          newParams.set('cursor', currentCursor);
        } else {
          newParams.delete('cursor');
        }
        const pageSize = table.getState().pagination.pageSize;
        if (pageSize) {
          newParams.set('limit', `${pageSize}`);
        }
        return newParams;
      },
      { replace: true },
    );
  }, [currentCursor, table.getState().pagination.pageSize]);

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

  return (
    <div>
      {((filters && filters.length > 0) || bulkActions.length > 0) && (
        <DataTableToolbar>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {filters &&
                filters.map((filter) => (
                  <DataTableFilter
                    key={filter.accessorKey}
                    column={table.getColumn(filter.accessorKey)}
                    {...filter}
                  />
                ))}
              {customFilters &&
                customFilters.map((filter, idx) => (
                  <React.Fragment key={idx}>{filter}</React.Fragment>
                ))}
            </div>
            {bulkActions.length > 0 && (
              <DataTableBulkActions
                selectedRows={table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original)}
                actions={bulkActions.map((action) => ({
                  render: (selectedRows: RowDataWithActions<TData>[]) =>
                    action.render(selectedRows, resetSelection),
                }))}
              />
            )}
          </div>
        </DataTableToolbar>
      )}

      <div className="rounded-md mt-0 overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const size = header.column.columnDef.size;
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        size
                          ? { width: size, minWidth: size, maxWidth: size }
                          : undefined
                      }
                    >
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
              <TableRow className="hover:bg-background">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={cn('cursor-pointer', {
                    'hover:bg-background cursor-default': isNil(onRowClick),
                  })}
                  onClick={(e) => {
                    // Check if the clicked cell is not clickable
                    const clickedCellIndex = (e.target as HTMLElement).closest(
                      'td',
                    )?.cellIndex;
                    if (
                      clickedCellIndex !== undefined &&
                      columns[clickedCellIndex]?.notClickable
                    ) {
                      return; // Don't trigger onRowClick for not clickable columns
                    }
                    onRowClick?.(row.original, e.ctrlKey, e);
                  }}
                  onAuxClick={(e) => {
                    // Similar check for auxiliary click (e.g., middle mouse button)
                    const clickedCellIndex = (e.target as HTMLElement).closest(
                      'td',
                    )?.cellIndex;
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
                    const size = cell.column.columnDef.size;
                    return (
                      <TableCell
                        key={cell.id}
                        style={
                          size
                            ? { width: size, minWidth: size, maxWidth: size }
                            : undefined
                        }
                      >
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
            ) : (
              <TableRow className="hover:bg-background">
                <TableCell
                  colSpan={columns.length}
                  className="h-[350px] text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    {emptyStateIcon ? emptyStateIcon : <></>}
                    <p className="text-lg font-semibold">
                      {emptyStateTextTitle}
                    </p>
                    {emptyStateTextDescription && (
                      <p className="text-sm text-muted-foreground ">
                        {emptyStateTextDescription}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!hidePagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              if (!clientPagination) {
                setCurrentCursor(undefined);
              }
            }}
          >
            <SelectTrigger className="h-9 min-w-[70px] w-auto">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
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
            {t('Previous')}
          </Button>
          <Button
            variant="outline"
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
          </Button>
        </div>
      )}
    </div>
  );
}
