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
import { v4 as uuid } from 'uuid';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SeekPage } from '@activepieces/shared';

import { Button } from '../button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../select';

import { DataTableBulkActions } from './data-table-bulk-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFacetedFilter } from './data-table-options-filter';
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

export type DataTableFilter<Keys extends string> = {
  type: 'select' | 'input' | 'date';
  title: string;
  accessorKey: Keys;
  icon: React.ComponentType<{ className?: string }>;
  options: readonly {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
};

type DataTableAction<TData extends DataWithId> = (
  row: RowDataWithActions<TData>,
) => JSX.Element;

// Extend the ColumnDef type to include the notClickable property
type ColumnDef<TData, TValue> = TanstackColumnDef<TData, TValue> & {
  notClickable?: boolean;
};

interface DataTableProps<
  TData extends DataWithId,
  TValue,
  Keys extends string,
  F extends DataTableFilter<Keys>,
> {
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  page: SeekPage<TData> | undefined;
  onRowClick?: (
    row: RowDataWithActions<TData>,
    newWindow: boolean,
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;
  isLoading: boolean;
  filters?: F[];
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
  bulkActions?: BulkAction<TData>[];
}

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
  F extends DataTableFilter<Keys>,
>({
  columns: columnsInitial,
  page,
  onRowClick,
  filters = [] as F[],
  actions = [],
  isLoading,
  onSelectedRowsChange,
  hidePagination,
  bulkActions = [],
}: DataTableProps<TData, TValue, Keys, F>) {
  const columns =
    actions.length > 0
      ? columnsInitial.concat([
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
      : columnsInitial;

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
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: () => uuid(),
    initialState: {
      pagination: {
        pageSize: parseInt(startingLimit),
      },
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

        newParams.set('cursor', currentCursor ?? '');
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

  return (
    <div>
      {((filters && filters.length > 0) || bulkActions.length > 0) && (
        <DataTableToolbar>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {filters &&
                filters.map((filter) => (
                  <DataTableFacetedFilter
                    key={filter.accessorKey}
                    type={filter.type}
                    column={table.getColumn(filter.accessorKey)}
                    title={filter.title}
                    options={filter.options}
                  />
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

      <div className="rounded-md border mt-8">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-background">
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
              <TableRow>
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
                  onClick={(e) => {
                    // Check if the clicked cell is not clickable
                    const clickedCellIndex = (e.target as HTMLElement).closest(
                      'td',
                    )?.cellIndex;
                    if (
                      clickedCellIndex !== undefined &&
                      (columnsInitial[clickedCellIndex]?.notClickable ||
                        columnsInitial[clickedCellIndex]?.id === 'select')
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
                      columnsInitial[clickedCellIndex]?.notClickable
                    ) {
                      return;
                    }
                    onRowClick?.(row.original, true, e);
                  }}
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
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
              setCurrentCursor(undefined);
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
            onClick={() => setCurrentCursor(previousPageCursor)}
            disabled={!previousPageCursor}
          >
            {t('Previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentCursor(nextPageCursor);
            }}
            disabled={!nextPageCursor}
          >
            {t('Next')}
          </Button>
        </div>
      )}
    </div>
  );
}
