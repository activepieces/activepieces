import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronLeft,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import DataGrid, {
  Column,
  RenderCellProps,
  DataGridHandle,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import {
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  ColumnHeader,
  ColumnActionType,
} from '@/features/tables/components/column-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { FiltersPopup } from '@/features/tables/components/filters-popup';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { SelectColumn } from '@/features/tables/components/select-column';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { tableHooks } from '@/features/tables/lib/tables-hooks';
import { Row } from '@/features/tables/lib/types';
import { cn } from '@/lib/utils';
import {
  Field,
  PopulatedRecord,
} from '@activepieces/shared';
import './react-data-grid.css';
import RowHeightToggle, { ROW_HEIGHT_MAP, RowHeight } from '@/features/tables/components/row-height-toggle';
import { useTableState } from './table-state-provider';
import { projectHooks } from '@/hooks/project-hooks';



const TablePage = ()=>{
  const { tableId } = useParams();
  if (!tableId) {
   console.error('Table ID is required');
   return null;
  }
  return <TablePageImplementation tableId={tableId} />
}
const TablePageImplementation = (
  {
    tableId
  } :
  {
    tableId: string;
  }
) => {
  const { data:project } = projectHooks.useCurrentProject();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isSaving, enqueueMutation] = useTableState((state) => [state.isSaving, state.enqueueMutation]);
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
  } =  tableHooks.useFetchRecords(tableId)

  useEffect(() => {
    if (recordsPages) {
      const totalRows = recordsPages.pages.reduce(
        (sum, page) => sum + page.data.length,
        0,
      );
      setLastRowIdx(totalRows);
    }
  }, [recordsPages]);

  const { data: tableData, isLoading: isTableLoading } = tableHooks.useFetchTable(tableId)

  const updateRecordMutation = tableHooks.useUpdateRecord({queryClient,tableId});

  const deleteFieldMutation =  tableHooks.useDeleteField({queryClient,tableId});

  const deleteRecordsMutation = tableHooks.useDeleteRecords({queryClient,tableId, onSuccess: () => {
    setSelectedRows(new Set());
  }});

  const createRecordMutation = tableHooks.useCreateRecord({queryClient,tableId});

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
              ['records', tableId, location.search],
              (old: { pages: { data: PopulatedRecord[] }[] }) => {
                console.log('old', old);
                if (!old) {
                  return { pages: [{ data: [emptyRecord] }] };
                }

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

  const handleScroll = ({ currentTarget }: React.UIEvent<HTMLDivElement>) => {
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
  };

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
    <div className=" overflow-hidden flex flex-col">
      <div className="flex flex-col gap-4 ml-3 pt-4 flex-none">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="p-2"
            onClick={() => navigate(`/projects/${project.id}/tables`)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl">{tableData?.name}</span>

          {isSaving && (
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
            {fieldsData && <FiltersPopup fields={fieldsData} />}
            <span className="text-sm text-muted-foreground ml-2">
              {t('Row Height')}
            </span>
           <RowHeightToggle rowHeight={rowHeight} setRowHeight={setRowHeight} />
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
      <div className="flex-1 min-h-0 mt-4 grid-wrapper overflow-hidden">
        <DataGrid
          ref={gridRef}
          columns={columns}
          rows={mapRecordsToRows(recordsPages, fieldsData ?? [])}
          rowKeyGetter={(row: Row) => row.id}
          selectedRows={selectedRows}
          onSelectedRowsChange={onSelectedRowsChange}
          className={cn( 'h-full max-w-full max-h-full', theme === 'dark' ? 'rdg-dark' : 'rdg-light')}
          bottomSummaryRows={[{ id: 'new-record' }]}
          rowHeight={ROW_HEIGHT_MAP[rowHeight]}
          headerRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          summaryRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
}

export { TablePage };
