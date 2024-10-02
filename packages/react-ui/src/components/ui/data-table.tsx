'use client';

import {
  ColumnDef,
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
import { SeekPage } from '@activepieces/shared';

import { Button } from './button';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFacetedFilter } from './data-table-options-filter';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableToolbar } from './data-table-toolbar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';
import { INTERNAL_ERROR_TOAST, toast } from './use-toast';

export type DataWithId = {
  id?: string;
};
export type RowDataWithActions<TData extends DataWithId> = TData & {
  delete: () => void;
  update: (payload: Partial<TData>) => void;
};

type FilterRecord<Keys extends string, F extends DataTableFilter<Keys>> = {
  [K in F as K['accessorKey']]: K['type'] extends 'select'
    ? K['options'][number]['value'][]
    : K['options'][number]['value'];
};

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

export type PaginationParams = {
  cursor?: string;
  limit?: number;
  createdAfter?: string;
  createdBefore?: string;
};

interface DataTableProps<
  TData extends DataWithId,
  TValue,
  Keys extends string,
  F extends DataTableFilter<Keys>,
> {
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  fetchData: (
    filters: FilterRecord<Keys, F>,
    pagination: PaginationParams,
  ) => Promise<SeekPage<TData>>;
  onRowClick?: (
    row: RowDataWithActions<TData>,
    newWindow: boolean,
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;
  filters?: F[];
  refresh?: number;
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
}

export function DataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
  F extends DataTableFilter<Keys>,
>({
  columns: columnsInitial,
  fetchData,
  onRowClick,
  filters = [] as F[],
  refresh,
  actions = [],
  onSelectedRowsChange,
  hidePagination,
}: DataTableProps<TData, TValue, Keys, F>) {
  const columns = columnsInitial.concat([
    {
      accessorKey: '__actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-end justify-end gap-4">
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
  ]);

  const [searchParams, setSearchParams] = useSearchParams();
  const startingCursor = searchParams.get('cursor') || undefined;
  const startingLimit = searchParams.get('limit') || '10';
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    startingCursor,
  );
  const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(
    undefined,
  );
  const [previousPageCursor, setPreviousPageCursor] = useState<
    string | undefined
  >(undefined);
  const [tableData, setTableData] = useState<RowDataWithActions<TData>[]>([]);
  const [deletedRows = [], setDeletedRows] = useState<TData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDataAndUpdateState = async (params: URLSearchParams) => {
    setLoading(true);
    setTableData([]);
    try {
      const limit = params.get('limit') ?? undefined;
      const filterNames = filters.map((filter) => filter.accessorKey);
      const paramsObject = filterNames
        .map((key) => [key, params.getAll(key)] as const)
        .reduce((acc, [key, values]) => {
          const value = values.length === 1 ? values?.[0] || undefined : values;
          if (!value) {
            return acc;
          }
          const filter = filters.find((filter) => filter.accessorKey === key);
          if (!filter || value.length > 0) {
            return { ...acc, [key]: value };
          }
          if (filter.type === 'select') {
            return { ...acc, [key]: [] };
          }
          return {
            ...acc,
            [key]: '',
          };
        }, {} as FilterRecord<Keys, F>);

      const response = await fetchData(paramsObject, {
        cursor: params.get('cursor') ?? undefined,
        limit: limit ? parseInt(limit) : undefined,
        createdAfter: params.get('createdAfter') ?? undefined,
        createdBefore: params.get('createdBefore') ?? undefined,
      });
      const newData = response.data.map((row, index) => ({
        ...row,
        delete: () => {
          setDeletedRows([...deletedRows, row]);
        },
        update: (payload: Partial<TData>) => {
          setTableData((prevData) => {
            const newData = [...prevData];
            newData[index] = { ...newData[index], ...payload };
            return newData;
          });
        },
      }));
      setTableData(newData);
      setNextPageCursor(response.next ?? undefined);
      setPreviousPageCursor(response.previous ?? undefined);
    } catch (error) {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
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
    fetchDataAndUpdateState(searchParams);
  }, [searchParams, refresh]);

  useEffect(() => {
    setTableData(
      tableData.filter(
        (row) => !deletedRows.some((deletedRow) => deletedRow.id === row.id),
      ),
    );
  }, [deletedRows]);

  return (
    <div>
      <DataTableToolbar>
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
      </DataTableToolbar>
      <div className="rounded-md border">
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
            {loading ? (
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
                  onClick={(e) => onRowClick?.(row.original, e.ctrlKey, e)}
                  onAuxClick={(e) => onRowClick?.(row.original, true, e)}
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
