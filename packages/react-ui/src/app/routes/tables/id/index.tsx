import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import DataGrid, { Column, RenderCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useParams } from 'react-router-dom';

import { TableTitle } from '@/components/ui/table-title';
import { toast } from '@/components/ui/use-toast';
import {
  ColumnHeader,
  ColumnActionType,
} from '@/features/tables/components/column-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldDialog } from '@/features/tables/components/new-field-dialog';
import { NewRecordDialog } from '@/features/tables/components/new-record-dialog';
import { SelectColumn } from '@/features/tables/components/select-column';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { Row } from '@/features/tables/lib/types';
import {
  Field,
  PopulatedRecord,
  UpdateRecordRequest,
} from '@activepieces/shared';
import './react-data-grid.css';

function TablePage() {
  const { tableId } = useParams();
  const queryClient = useQueryClient();
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

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
      // refetchRecords();
      toast({
        title: t('Success'),
        description: t('Record has been updated.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: t('Success'),
        description: t('Record has been updated.'),
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
        <NewFieldDialog tableId={tableId!}>
          <div className="w-full h-full flex items-center justify-center cursor-pointer new-field">
            <Plus className="h-4 w-4" />
          </div>
        </NewFieldDialog>
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
    <div className="flex-col w-full">
      <TableTitle>{tableData?.name}</TableTitle>
      <DataGrid
        columns={columns}
        rows={mapRecordsToRows(recordsData?.data ?? [], fieldsData ?? [])}
        rowKeyGetter={(row: Row) => row.id}
        selectedRows={selectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
        className="rdg-light mt-8"
        bottomSummaryRows={[{ id: 'new-record' }]}
      />
    </div>
  );
}

export { TablePage };
