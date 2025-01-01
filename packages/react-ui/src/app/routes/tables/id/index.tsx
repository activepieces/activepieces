import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import DataGrid, {
  Column,
  RowsChangeData,
  RenderCellProps,
} from 'react-data-grid';
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

function rowKeyGetter(record: Row) {
  return record.id;
}

function TablePage() {
  const { tableId } = useParams();
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const { data: fieldsData, refetch: refetchFields } = useQuery({
    queryKey: ['fields', tableId],
    queryFn: () => fieldsApi.list(tableId!),
  });

  const { data: recordsData, refetch: refetchRecords } = useQuery({
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
      refetchRecords();
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
    onSuccess: () => {
      refetchFields();
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to delete field.'),
        duration: 3000,
      });
    },
  });

  const columns: readonly Column<Row, { id: string }>[] = [
    {
      ...SelectColumn,
      renderSummaryCell: () => (
        <NewRecordDialog
          fields={fieldsData ?? []}
          tableId={tableId!}
          onRecordCreated={() => refetchRecords()}
        >
          <div className="flex items-center justify-start cursor-pointer pl-4">
            <Plus className="h-4 w-4" />
          </div>
        </NewRecordDialog>
      ),
    },
    ...(fieldsData?.map((field) => ({
      key: field.name,
      minWidth: 207,
      maxWidth: 207,
      width: 207,
      minHeight: 37,
      name: '',
      renderHeaderCell: () => (
        <ColumnHeader
          label={field.name}
          type={field.type}
          actions={[
            {
              type: ColumnActionType.DELETE,
              onClick: () => deleteFieldMutation.mutateAsync(field.id),
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
        <NewFieldDialog
          tableId={tableId!}
          onFieldCreated={() => {
            refetchFields();
          }}
        >
          <div className="flex items-center justify-center cursor-pointer new-field">
            <Plus className="h-4 w-4" />
          </div>
        </NewFieldDialog>
      ),
      renderCell: () => <div className="empty-cell"></div>,
    },
  ];

  const rows = recordsData?.data
    ? mapRecordsToRows(recordsData.data, fieldsData ?? [])
    : [];

  async function onRowsChange(
    rows: Row[],
    changeData: RowsChangeData<Row, { id: string }>,
  ) {
    const updatedRow = rows[changeData.indexes[0]];
    const cellValue = updatedRow[changeData.column.key];

    if (!tableId) return;

    updateRecordMutation.mutate({
      recordId: updatedRow.id,
      request: {
        tableId,
        cells: [
          {
            key: changeData.column.key,
            value: String(cellValue),
          },
        ],
      },
    });
  }

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
        rows={rows}
        rowKeyGetter={rowKeyGetter}
        onRowsChange={onRowsChange}
        selectedRows={selectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
        className="rdg-light mt-8"
        bottomSummaryRows={[{ id: 'new-record' }]}
      />
    </div>
  );
}

export { TablePage };
