'use client';

import {
  ColumnDef as TanstackColumnDef,
  flexRender,
  getCoreRowModel,
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
  hidePagination?: boolean;  // Default to false, but we'll set it to true in usage
  bulkActions?: BulkAction<TData>[];
  emptyStateTextTitle: string;
  emptyStateTextDescription: string;
  emptyStateIcon: React.ReactNode;
  selectColumn?: boolean;
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
  hidePagination = true, // 🔥 CHANGED: Default to true to hide broken pagination
  bulkActions = [],
  emptyStateTextTitle,
  emptyStateTextDescription,
  emptyStateIcon,
  customFilters,
  selectColumn = false,
}: DataTableProps<TData, TValue, Keys>) {
  const selectColumnDef: ColumnDef<RowDataWithActions<TData>, TValue> = {
    id: 'select',
    accessorKey: 'select',
    notClickable: true,
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
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined,
  );
  const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(
    undefined,
  );
  const [previousPageCursor, setPreviousPageCursor] = useState<
    string | undefined
  >(undefined);

  // Sync URL params with internal state on mount
  useEffect(() => {
    const urlCursor = searchParams.get('cursor') || undefined;
    setCurrentCursor(urlCursor);
  }, []);

  // Update cursor state when page data changes
  useDeepCompareEffect(() => {
    setNextPageCursor(page?.next ?? undefined);
    setPreviousPageCursor(page?.previous ?? undefined);
  }, [page?.next, page?.previous]);

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
    setTableData(enrichPageData(page?.data ?? []));
  }, [page?.data]);

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: () => apId(),
    initialState: {
      pagination: {
        pageSize: parseInt(searchParams.get('limit') || '10'),
      },
      columnVisibility,
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

  // Update URL when cursor or page size changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        
        // Only set cursor if it exists, otherwise remove it
        if (currentCursor) {
          newParams.set('cursor', currentCursor);
        } else {
          newParams.delete('cursor');
        }
        
        newParams.set('limit', `${table.getState().pagination.pageSize}`);
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

  const handlePreviousPage = () => {
    if (previousPageCursor) {
      setCurrentCursor(previousPageCursor);
    }
  };

  const handleNextPage = () => {
    if (nextPageCursor) {
      setCurrentCursor(nextPageCursor);
    }
  };

  const handlePageSizeChange = (value: string) => {
    table.setPageSize(Number(value));
    setCurrentCursor(undefined); // Reset to first page
  };

  const hasData = table.getRowModel().rows?.length > 0;
  const showEmptyState = !isLoading && !hasData;

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
        <Table>
          <TableHeader>
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
              <TableRow className="hover:bg-background">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            ) : hasData ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={cn('cursor-pointer', {
                    'hover:bg-background cursor-default': isNil(onRowClick),
                  })}
                  onClick={(e) => {
                    const clickedCellIndex = (e.target as HTMLElement).closest(
                      'td',
                    )?.cellIndex;
                    if (
                      clickedCellIndex !== undefined &&
                      columns[clickedCellIndex]?.notClickable
                    ) {
                      return;
                    }
                    onRowClick?.(row.original, e.ctrlKey, e);
                  }}
                  onAuxClick={(e) => {
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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <div
                        className={cn('flex items-center', {
                          'justify-end': cell.column.id === '__actions' || cell.column.id === 'actions',
                          'justify-start': cell.column.id !== '__actions' && cell.column.id !== 'actions',
                        })}
                      >
                        <div
                          onClick={(e) => {
                            if (cell.column.id === 'select') {
                              e.preventDefault();
                              e.stopPropagation();
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
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-background">
                <TableCell
                  colSpan={columns.length}
                  className="h-[350px] text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    {emptyStateIcon}
                    <p className="text-lg font-semibold">
                      {emptyStateTextTitle}
                    </p>
                    {emptyStateTextDescription && (
                      <p className="text-sm text-muted-foreground">
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

      {/* 🔥 PAGINATION IS NOW HIDDEN BY DEFAULT - NO FAKE DATA, NO BROKEN UI */}
      {!hidePagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium whitespace-nowrap hidden sm:block">
                {t('Rows per page')}
              </p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-9 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!previousPageCursor}
              >
                {t('Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!nextPageCursor}
              >
                {t('Next')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}