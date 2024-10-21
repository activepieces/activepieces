'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { t } from 'i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
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
import { isNil, SeekPage } from '@activepieces/shared';

import { cn } from '../../lib/utils';

import { Button } from './button';
import { DataTableColumnHeader } from './data-table-column-header';
import {
  DataTableFacetedFilter,
  TABLE_QUERY_PARAMS_NAME,
} from './data-table-options-filter';
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

export type DataTableFilter<Keys> = {
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
  limit: number;
  createdAfter?: string;
  createdBefore?: string;
};

const PAGE_SIZE = ['10', '30', '50'];

interface DataTableProps<
  TData extends DataWithId,
  TValue,
  F extends DataTableFilter<Exclude<keyof TData, symbol | number>>,
> {
  allowOrdering?: boolean;
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  fetchData: (
    filters: FilterRecord<Exclude<keyof TData, symbol | number>, F>,
    pagination: PaginationParams,
    order?: {
      column: keyof TData;
      order: 'DESC' | 'ASC';
    },
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
  F extends DataTableFilter<Exclude<keyof TData, symbol | number>>,
>({
  columns: columnsInitial,
  fetchData,
  onRowClick,
  filters = [] as F[],
  refresh = 0,
  actions = [],
  onSelectedRowsChange,
  hidePagination,
  allowOrdering,
}: DataTableProps<TData, TValue, F>) {
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
  const pagination = useRef<{
    nextCursor: string | null;
    previousCursor: string | null;
    limit: string;
  }>({
    nextCursor: null,
    previousCursor: null,
    limit: searchParams.get(TABLE_QUERY_PARAMS_NAME.limit) ?? PAGE_SIZE[0],
  });

  const [tableData, setTableData] = useState<RowDataWithActions<TData>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setReRender] = useState<boolean>(false);
  const refreshRef = useRef<number>(0);
  const fetchDataAndUpdateState = async (params: URLSearchParams) => {
    setLoading(true);
    try {
      const limit = params.get(TABLE_QUERY_PARAMS_NAME.limit) ?? undefined;
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
        }, {} as FilterRecord<Exclude<keyof TData, symbol | number>, F>);

      const orderParam = params.get(TABLE_QUERY_PARAMS_NAME.order);
      const columnParam = params.get(TABLE_QUERY_PARAMS_NAME.orderByColumn);

      const response = await fetchData(
        paramsObject,
        {
          cursor: params.get(TABLE_QUERY_PARAMS_NAME.cursor) ?? undefined,
          limit: parseInt(limit ?? PAGE_SIZE[0]),
          createdAfter:
            params.get(TABLE_QUERY_PARAMS_NAME.createdAfter) ?? undefined,
          createdBefore:
            params.get(TABLE_QUERY_PARAMS_NAME.createdBefore) ?? undefined,
        },
        allowOrdering &&
          (orderParam === 'ASC' || orderParam === 'DESC') &&
          columnParam
          ? {
              //If column is an invalid name, server query will fail, so I need to find a way to validate the column param
              column: columnParam as keyof TData,
              order: orderParam,
            }
          : undefined,
      );

      setTableData(
        response.data.map((row, index) => ({
          ...row,
          delete: () => {
            setTableData((prev) => prev.filter((r) => row.id === r.id));
            setReRender((val) => !val);
          },
          update: (payload: Partial<TData>) => {
            setTableData((prev) => {
              const newData = [...prev];
              newData[index] = {
                ...tableData[index],
                ...payload,
              };
              return newData;
            });
          },
        })),
      );
      pagination.current = {
        ...pagination.current,
        nextCursor: response.next,
        previousCursor: response.previous,
      };
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
        pageSize: 10,
      },
    },
  });

  useDeepCompareEffect(() => {
    onSelectedRowsChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  }, [table.getSelectedRowModel().rows]);
  if (refresh !== refreshRef.current) {
    refreshRef.current = refresh;
    fetchDataAndUpdateState(searchParams);
  }
  useEffect(() => {
    fetchDataAndUpdateState(searchParams);
  }, []);
  return (
    <div>
      <DataTableToolbar>
        {filters &&
          filters.map((filter) => (
            <DataTableFacetedFilter
              key={filter.accessorKey}
              type={filter.type}
              title={filter.title}
              options={filter.options}
              accessorKey={filter.accessorKey}
              filterChanged={fetchDataAndUpdateState}
            />
          ))}
      </DataTableToolbar>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} hoverable={false}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      <div
                        onClick={
                          allowOrdering
                            ? () => {
                                const orderParam = searchParams.get('order');
                                const columnParam = searchParams.get(
                                  TABLE_QUERY_PARAMS_NAME.orderByColumn,
                                );

                                setSearchParams(
                                  (prev) => {
                                    const newParams = new URLSearchParams(prev);
                                    newParams.set(
                                      TABLE_QUERY_PARAMS_NAME.cursor,
                                      '',
                                    );
                                    if (columnParam !== header.id) {
                                      newParams.set(
                                        TABLE_QUERY_PARAMS_NAME.orderByColumn,
                                        header.id,
                                      );
                                      newParams.set(
                                        TABLE_QUERY_PARAMS_NAME.order,
                                        'DESC',
                                      );
                                    } else {
                                      newParams.set(
                                        TABLE_QUERY_PARAMS_NAME.order,
                                        orderParam === 'DESC' ? 'ASC' : 'DESC',
                                      );
                                    }
                                    pagination.current.previousCursor = null;
                                    pagination.current.nextCursor = null;
                                    fetchDataAndUpdateState(newParams);
                                    return newParams;
                                  },
                                  { replace: true },
                                );
                              }
                            : undefined
                        }
                        className={cn('flex gap-1 items-center', {
                          'underline underline-offset-4':
                            searchParams.get(
                              TABLE_QUERY_PARAMS_NAME.orderByColumn,
                            ) === header.id,
                          'cursor-pointer': allowOrdering,
                        })}
                      >
                        {searchParams.get(
                          TABLE_QUERY_PARAMS_NAME.orderByColumn,
                        ) === header.id && (
                          <div>
                            {searchParams.get(TABLE_QUERY_PARAMS_NAME.order) ===
                            'ASC' ? (
                              <ArrowUp className="h-4 w-4 stroke-foreground"></ArrowUp>
                            ) : (
                              <ArrowDown className="h-4 w-4 stroke-foreground"></ArrowDown>
                            )}
                          </div>
                        )}
                        <div>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </div>
                      </div>
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
          <p className="text-sm font-medium">{t('Rows')}</p>
          <Select
            value={
              searchParams.get(TABLE_QUERY_PARAMS_NAME.limit) ?? PAGE_SIZE[0]
            }
            onValueChange={(value) => {
              setSearchParams(
                (prev) => {
                  const newParams = new URLSearchParams(prev);
                  newParams.set('cursor', '');
                  newParams.set('limit', value);
                  pagination.current = {
                    limit: value,
                    nextCursor: null,
                    previousCursor: null,
                  };

                  fetchDataAndUpdateState(newParams);

                  return newParams;
                },
                { replace: true },
              );
            }}
          >
            <SelectTrigger className="h-9 min-w-[70px] w-auto">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE.map((pageSize) => (
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
              setSearchParams(
                (prev) => {
                  const newParams = new URLSearchParams(prev);
                  if (pagination.current.previousCursor) {
                    newParams.set(
                      TABLE_QUERY_PARAMS_NAME.cursor,
                      pagination.current.previousCursor,
                    );
                  }
                  fetchDataAndUpdateState(newParams);
                  return newParams;
                },
                { replace: true },
              );
            }}
            disabled={isNil(pagination.current.previousCursor)}
          >
            {t('Previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchParams(
                (prev) => {
                  const newParams = new URLSearchParams(prev);
                  if (pagination.current.nextCursor) {
                    newParams.set(
                      TABLE_QUERY_PARAMS_NAME.cursor,
                      pagination.current.nextCursor,
                    );
                  }
                  fetchDataAndUpdateState(newParams);
                  return newParams;
                },
                { replace: true },
              );
            }}
            disabled={isNil(pagination.current.nextCursor)}
          >
            {t('Next')}
          </Button>
        </div>
      )}
    </div>
  );
}
