import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronLeft,
  Plus,
  Rows4,
  Rows3,
  Rows2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import DataGrid, {
  Column,
  RenderCellProps,
  DataGridHandle,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate, useParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import {
  ColumnHeader,
  ColumnActionType,
} from '@/features/tables/components/column-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { SelectColumn } from '@/features/tables/components/select-column';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { useSequentialMutationsStore } from '@/features/tables/lib/tables-mutations-hooks';
import { Row } from '@/features/tables/lib/types';
import { cn } from '@/lib/utils';
import {
  Field,
  PopulatedRecord,
  UpdateRecordRequest,
  SeekPage,
} from '@activepieces/shared';
import './react-data-grid.css';

enum RowHeight {
  COMPACT = 'compact',
  DEFAULT = 'default',
  RELAXED = 'relaxed',
}

const getRowHeight = (type: RowHeight = RowHeight.DEFAULT): number => {
  switch (type) {
    case RowHeight.COMPACT:
      return 28;
    case RowHeight.RELAXED:
      return 52;
    default:
      return 37;
  }
};

function TablePage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { saving, enqueueMutation } = useSequentialMutationsStore();
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [rowHeight, setRowHeight] = useState<RowHeight>(RowHeight.DEFAULT);
  const [lastRowIdx, setLastRowIdx] = useState<number>(0);
  const gridRef = useRef<DataGridHandle>(null);
  const { theme } = useTheme();

  const { data: fieldsData, isLoading: isFieldsLoading } = useQuery({
    queryKey: ['fields', tableId],
    queryFn: () => fieldsApi.list(tableId!),
  });

  const {
    data: recordsPages,
    isLoading: isRecordsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SeekPage<PopulatedRecord>>({
    queryKey: ['records', tableId],
    queryFn: async ({ pageParam }) =>
      recordsApi.list({
        tableId: tableId!,
        cursor: pageParam as string | undefined,
        limit: 200,
      }),
    getNextPageParam: (lastPage) => lastPage.next,
    initialPageParam: undefined as string | undefined,
  });

  useEffect(() => {
    if (recordsPages) {
      const totalRows = recordsPages.pages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      );
      setLastRowIdx(totalRows);
    }
  }, [recordsPages]);

  const { data: tableData, isLoading: isTableLoading } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tablesApi.getById(tableId!),
  });

  const updateRecordMutation = useMutation({
    mutationKey: ['updateRecord'],
    mutationFn: async ({
      recordId,
      request,
    }: {
      recordId: string;
      request: UpdateRecordRequest;
    }) => {
      return recordsApi.update(recordId, request);
    },
    onMutate: async ({ recordId, request }) => {
      await queryClient.cancelQueries({ queryKey: ['records', tableId] });
      const previousRecords = queryClient.getQueryData(['records', tableId]);

      // Update the cache optimistically
      queryClient.setQueryData(
        ['records', tableId],
        (old: { pages: { data: PopulatedRecord[] }[] }) => ({
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((record) => {
              if (record.id === recordId) {
                return {
                  ...record,
                  cells: record.cells.map((cell) => {
                    const updatedCell = request.cells?.find(
                      (c) => c.key === cell.fieldId,
                    );
                    if (updatedCell) {
                      return {
                        ...cell,
                        value: updatedCell.value,
                      };
                    }
                    return cell;
                  }),
                };
              }
              return record;
            }),
          })),
        }),
      );

      return { previousRecords };
    },
    onError: (error, variables, context) => {
      if (context?.previousRecords) {
        queryClient.setQueryData(['records', tableId], context.previousRecords);
      }
      toast({
        title: t('Error'),
        description: t('Failed to update record.'),
        duration: 3000,
      });
    },
    onSuccess: (data, { recordId }) => {
      // Update the cache with the server response
      queryClient.setQueryData(
        ['records', tableId],
        (old: { pages: { data: PopulatedRecord[] }[] }) => ({
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((record) =>
              record.id === recordId ? data : record,
            ),
          })),
        }),
      );
    },
  });

  const deleteFieldMutation = useMutation({
    mutationKey: ['deleteField'],
    mutationFn: (fieldId: string) => {
      return fieldsApi.delete(fieldId);
    },
    onMutate: async (fieldId) => {
      await queryClient.cancelQueries({ queryKey: ['fields', tableId] });
      const previousFields = queryClient.getQueryData(['fields', tableId]);

      queryClient.setQueryData(
        ['fields', tableId],
        (old: Field[] | undefined) =>
          old ? old.filter((field) => field.id !== fieldId) : [],
      );

      return { previousFields };
    },
    onError: (err, variables, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(['fields', tableId], context.previousFields);
      }
      toast({
        title: t('Error'),
        description: t('Failed to delete field.'),
        duration: 3000,
      });
    },
  });

  const deleteRecordsMutation = useMutation({
    mutationKey: ['deleteRecords'],
    mutationFn: async (recordIds: string[]) => {
      await Promise.all(recordIds.map((id) => recordsApi.delete(id)));
    },
    onMutate: async (recordIds) => {
      await queryClient.cancelQueries({ queryKey: ['records', tableId] });
      const previousRecords = queryClient.getQueryData(['records', tableId]);

      // Update the cache optimistically
      queryClient.setQueryData(
        ['records', tableId],
        (old: { pages: { data: PopulatedRecord[] }[] }) => ({
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((record) => !recordIds.includes(record.id)),
          })),
        }),
      );

      return { previousRecords };
    },
    onError: (error, variables, context) => {
      if (context?.previousRecords) {
        queryClient.setQueryData(['records', tableId], context.previousRecords);
      }
      toast({
        title: t('Error'),
        description: t('Failed to delete records.'),
        duration: 3000,
      });
    },
    onSuccess: () => {
      setSelectedRows(new Set());
    },
  });

  const createRecordMutation = useMutation({
    mutationKey: ['createRecord'],
    mutationFn: async ({
      field,
      value,
      tempId,
    }: {
      field: Field;
      value: string;
      tempId: string;
    }) => {
      return recordsApi.create({
        records: [
          [
            {
              key: field.name,
              value: value,
            },
          ],
        ],
        tableId: tableId!,
      });
    },
    onMutate: async ({ field, value, tempId }) => {
      await queryClient.cancelQueries({ queryKey: ['records', tableId] });
      const previousRecords = queryClient.getQueryData(['records', tableId]);

      return { previousRecords, tempId };
    },
    onError: (error, variables, context) => {
      if (context?.previousRecords) {
        // Restore the previous records and remove the temporary record
        queryClient.setQueryData(
          ['records', tableId],
          (old: { pages: { data: PopulatedRecord[] }[] }) => ({
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((record) => record.id !== context.tempId),
            })),
          }),
        );
      }
      toast({
        title: t('Error'),
        description: t('Failed to create record.'),
        duration: 3000,
      });
    },
    onSuccess: (data, { tempId }) => {
      // Replace the temporary record with the real one
      queryClient.setQueryData(
        ['records', tableId],
        (old: { pages: { data: PopulatedRecord[] }[] }) => ({
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((record) =>
              record.id === tempId ? data[0] : record,
            ),
          })),
        }),
      );
    },
  });

  const columns: readonly Column<Row, { id: string }>[] = [
    {
      ...SelectColumn,
      renderSummaryCell: () => (
        <div
          className="w-full h-full flex items-center justify-start cursor-pointer pl-4"
          onClick={() => {
            // Create an empty record in the grid
            const emptyRecord: PopulatedRecord = {
              id: 'temp-' + Date.now(),
              cells: [],
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              projectId: '',
              tableId: tableId!,
            };

            queryClient.setQueryData(
              ['records', tableId],
              (old: { pages: { data: PopulatedRecord[] }[] }) => {
                const updatedData = {
                  ...old,
                  pages: old.pages.map((page, index) =>
                    index === old.pages.length - 1
                      ? {
                          ...page,
                          data: [...page.data, emptyRecord],
                        }
                      : page,
                  ),
                };

                return updatedData;
              },
            );

            setTimeout(() => {
              gridRef.current?.scrollToCell({
                rowIdx: lastRowIdx,
                idx: 0,
              });
            }, 0);
          }}
        >
          <Plus className="h-4 w-4" />
        </div>
      ),
    },
    ...(fieldsData?.map((field) => ({
      key: field.name,
      minWidth: 207,
      width: 207,
      minHeight: 37,
      resizable: true,
      name: '',
      renderHeaderCell: () => (
        <ColumnHeader
          label={field.name}
          type={field.type}
          actions={[
            {
              type: ColumnActionType.DELETE,
              onClick: async () => {
                await enqueueMutation(deleteFieldMutation, field.id);
              },
            },
          ]}
        />
      ),
      renderCell: ({
        row,
        column,
        rowIdx,
      }: RenderCellProps<Row, { id: string }>) => (
        <EditableCell
          type={field.type}
          value={row[field.name]}
          row={row}
          column={column}
          rowIdx={rowIdx}
          onRowChange={(newRow, commitChanges) => {
            if (commitChanges) {
              if (row.id.startsWith('temp-')) {
                handleCellEdit(row, field, String(newRow[field.name]), row.id);
              } else {
                handleCellEdit(row, field, String(newRow[field.name]));
              }
            }
          }}
        />
      ),
    })) ?? []),
    {
      key: 'new-field',
      minWidth: 67,
      maxWidth: 67,
      width: 67,
      name: '',
      renderHeaderCell: () => (
        <NewFieldPopup tableId={tableId!}>
          <div className="w-full h-full flex items-center justify-center cursor-pointer new-field">
            <Plus className="h-4 w-4" />
          </div>
        </NewFieldPopup>
      ),
      renderCell: () => <div className="empty-cell"></div>,
    },
  ];

  function onSelectedRowsChange(newSelectedRows: ReadonlySet<string>) {
    setSelectedRows(newSelectedRows);
  }

  const handleScroll = useCallback(
    ({ currentTarget }: React.UIEvent<HTMLDivElement>) => {
      const target = currentTarget;
      const scrollPosition = target.scrollTop + target.clientHeight;
      const scrollThreshold = target.scrollHeight - 500; // Load more when 500px from bottom

      if (
        scrollPosition > scrollThreshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  function mapRecordsToRows(
    pages: typeof recordsPages,
    fields: Field[],
  ): Row[] {
    if (!pages) return [];
    return pages.pages.flatMap((page) =>
      page.data.map((record: PopulatedRecord) => {
        const row: Row = { id: record.id };
        record.cells.forEach((cell) => {
          const field = fields.find((f) => f.id === cell.fieldId);
          if (field) {
            row[field.name] = cell.value;
          }
        });
        return row;
      }),
    );
  }

  const isLoading = isFieldsLoading || isRecordsLoading || isTableLoading;

  const handleCellEdit = async (
    row: Row,
    field: Field,
    newValue: string,
    tempId?: string,
  ) => {
    if (tempId) {
      await enqueueMutation(createRecordMutation, {
        field,
        value: newValue,
        tempId,
      });
    } else {
      await enqueueMutation(updateRecordMutation, {
        recordId: row.id,
        request: {
          tableId: tableId!,
          cells: [
            {
              key: field.name,
              value: newValue,
            },
          ],
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="flex flex-col gap-4 ml-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="p-2"
              onClick={() => navigate('/tables')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <LoadingSpinner />
              <span className="text-muted-foreground">{t('Loading...')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex flex-col gap-4 ml-3 pt-4 flex-none">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="p-2"
            onClick={() => navigate('/tables')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl">{tableData?.name}</span>

          {saving && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('Saving...')}</span>
            </div>
          )}
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('Loading more...')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground ml-2">
              {t('Row Height')}
            </span>
            <RadioGroup
              value={rowHeight}
              onValueChange={(value) => setRowHeight(value as RowHeight)}
              className="flex items-center gap-1 bg-muted p-1 rounded-md"
            >
              <div className="flex items-center">
                <RadioGroupItem
                  value={RowHeight.COMPACT}
                  id={RowHeight.COMPACT}
                  className="sr-only"
                />
                <label
                  htmlFor={RowHeight.COMPACT}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-sm cursor-pointer hover:bg-background transition-colors',
                    rowHeight === RowHeight.COMPACT ? 'bg-background' : '',
                  )}
                >
                  <Rows4
                    className={cn(
                      'h-4 w-4',
                      rowHeight === RowHeight.COMPACT
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  />
                </label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem
                  value={RowHeight.DEFAULT}
                  id={RowHeight.DEFAULT}
                  className="sr-only"
                />
                <label
                  htmlFor={RowHeight.DEFAULT}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-sm cursor-pointer hover:bg-background transition-colors',
                    rowHeight === RowHeight.DEFAULT ? 'bg-background' : '',
                  )}
                >
                  <Rows3
                    className={cn(
                      'h-4 w-4',
                      rowHeight === RowHeight.DEFAULT
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  />
                </label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem
                  value={RowHeight.RELAXED}
                  id={RowHeight.RELAXED}
                  className="sr-only"
                />
                <label
                  htmlFor={RowHeight.RELAXED}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-sm cursor-pointer hover:bg-background transition-colors',
                    rowHeight === RowHeight.RELAXED ? 'bg-background' : '',
                  )}
                >
                  <Rows2
                    className={cn(
                      'h-4 w-4',
                      rowHeight === RowHeight.RELAXED
                        ? 'text-primary'
                        : 'text-muted-foreground',
                    )}
                  />
                </label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex items-center gap-2 mr-2">
            {selectedRows.size > 0 && (
              <div onClick={(e) => e.stopPropagation()}>
                <ConfirmationDeleteDialog
                  title={t('Delete Records')}
                  message={t(
                    'Are you sure you want to delete the selected records? This action cannot be undone.',
                  )}
                  entityName={
                    selectedRows.size === 1 ? t('record') : t('records')
                  }
                  mutationFn={async () => {
                    await enqueueMutation(
                      deleteRecordsMutation,
                      Array.from(selectedRows),
                    );
                    setSelectedRows(new Set());
                  }}
                >
                  <Button
                    className="w-full mr-2"
                    size="sm"
                    variant="destructive"
                    loading={false}
                  >
                    <Trash2 className="mr-2 w-4" />
                    {`${t('Delete')} (${selectedRows.size})`}
                  </Button>
                </ConfirmationDeleteDialog>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-4 grid-wrapper">
        <DataGrid
          ref={gridRef}
          columns={columns}
          rows={mapRecordsToRows(recordsPages, fieldsData ?? [])}
          rowKeyGetter={(row: Row) => row.id}
          selectedRows={selectedRows}
          onSelectedRowsChange={onSelectedRowsChange}
          className={cn('h-full', theme === 'dark' ? 'rdg-dark' : 'rdg-light')}
          bottomSummaryRows={[{ id: 'new-record' }]}
          rowHeight={getRowHeight(rowHeight)}
          headerRowHeight={getRowHeight()}
          summaryRowHeight={getRowHeight()}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
}

export { TablePage };
