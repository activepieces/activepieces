import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronLeft, Plus, Rows4, Rows3, Rows2 } from 'lucide-react';
import { useState } from 'react';
import DataGrid, { Column, RenderCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import {
  ColumnHeader,
  ColumnActionType,
} from '@/features/tables/components/column-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { NewRecordDialog } from '@/features/tables/components/new-record-dialog';
import { SelectColumn } from '@/features/tables/components/select-column';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { Row } from '@/features/tables/lib/types';
import { cn } from '@/lib/utils';
import {
  Field,
  PopulatedRecord,
  UpdateRecordRequest,
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
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [rowHeight, setRowHeight] = useState<RowHeight>(RowHeight.DEFAULT);

  const { data: fieldsData } = useQuery({
    queryKey: ['fields', tableId],
    queryFn: () => fieldsApi.list(tableId!),
  });

  const { data: recordsData } = useQuery({
    queryKey: ['records', tableId],
    queryFn: () =>
      recordsApi.list({ tableId: tableId!, cursor: undefined, limit: 10 }),
  });

  const { data: tableData } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tablesApi.getById(tableId!),
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({
      recordId,
      request,
    }: {
      recordId: string;
      request: UpdateRecordRequest;
    }) => {
      return recordsApi.update(recordId, request);
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Record has been updated.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to update record.'),
        duration: 3000,
      });
    },
  });

  const deleteFieldMutation = useMutation({
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
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Field has been deleted.'),
        duration: 3000,
      });
    },
  });

  const columns: readonly Column<Row, { id: string }>[] = [
    {
      ...SelectColumn,
      renderSummaryCell: () => (
        <NewRecordDialog fields={fieldsData ?? []} tableId={tableId!}>
          <div className="w-full h-full flex items-center justify-start cursor-pointer pl-4">
            <Plus className="h-4 w-4" />
          </div>
        </NewRecordDialog>
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
                await deleteFieldMutation.mutateAsync(field.id);
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
              updateRecordMutation.mutate({
                recordId: row.id,
                request: {
                  tableId: tableId!,
                  cells: [
                    {
                      key: field.name,
                      value: String(newRow[field.name]),
                    },
                  ],
                },
              });
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

  function mapRecordsToRows(
    records: PopulatedRecord[],
    fields: Field[],
  ): Row[] {
    return records.map((record) => {
      const row: Row = { id: record.id };
      record.cells.forEach((cell) => {
        const field = fields.find((f) => f.id === cell.fieldId);
        if (field) {
          row[field.name] = cell.value;
        }
      });
      return row;
    });
  }

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
          <span className="text-xl">{tableData?.name}</span>
        </div>
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
                className="peer sr-only"
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
                className="peer sr-only"
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
                className="peer sr-only"
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
      </div>
      <DataGrid
        columns={columns}
        rows={mapRecordsToRows(recordsData?.data ?? [], fieldsData ?? [])}
        rowKeyGetter={(row: Row) => row.id}
        selectedRows={selectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
        className="rdg-light mt-4"
        bottomSummaryRows={[{ id: 'new-record' }]}
        rowHeight={getRowHeight(rowHeight)}
        headerRowHeight={getRowHeight()}
        summaryRowHeight={getRowHeight()}
      />
    </div>
  );
}

export { TablePage };
