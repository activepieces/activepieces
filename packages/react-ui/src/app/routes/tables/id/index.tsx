import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Calendar, Hash, Plus, Trash, Type } from 'lucide-react';
import { useState } from 'react';
import DataGrid, {
  SelectColumn,
  Column,
  RowsChangeData,
  RenderCellProps,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TableTitle } from '@/components/ui/table-title';
import { toast } from '@/components/ui/use-toast';
import { ColumnHeader } from '@/features/tables/components/column-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldDialog } from '@/features/tables/components/new-field-dialog';
import { NewRecordDialog } from '@/features/tables/components/new-record-dialog';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { recordsApi } from '@/features/tables/lib/records-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import {
  Field,
  FieldType,
  PopulatedRecord,
  UpdateRecordRequest,
} from '@activepieces/shared';
import './react-data-grid.css';

type Row = {
  id: string;
  [key: string]: any;
};

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
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: string) => {
      return fieldsApi.delete(fieldId);
    },
    onSuccess: () => {
      refetchFields();
      toast({
        title: t('Success'),
        description: t('Field has been deleted.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to delete field.'),
        duration: 3000,
      });
    },
  });

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case FieldType.TEXT:
        return <Type className="h-4 w-4 text-muted-foreground" />;
      case FieldType.DATE:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case FieldType.NUMBER:
        return <Hash className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const columns: readonly Column<Row, { id: string }>[] = [
    {
      ...SelectColumn,
      renderSummaryCell: () => (
        <NewRecordDialog
          fields={fieldsData ?? []}
          tableId={tableId!}
          onRecordCreated={() => refetchRecords()}
        >
          <div className="flex items-center justify-center cursor-pointer">
            <Plus className="h-4 w-4" />
          </div>
        </NewRecordDialog>
      ),
    },
    ...(fieldsData?.map((field) => ({
      key: field.name,
      minWidth: 207,
      minHeight: 37,
      name: (
        <ColumnHeader
          label={field.name}
          icon={getFieldIcon(field.type)}
          actions={[
            {
              label: t('Delete Field'),
              content: (
                <ConfirmationDeleteDialog
                  title={t('Delete Field')}
                  message={t(
                    'Are you sure you want to delete this field? This action cannot be undone.',
                  )}
                  mutationFn={async () => {
                    await deleteFieldMutation.mutateAsync(field.id);
                  }}
                  entityName={t('field')}
                >
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{t('Delete')}</span>
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              ),
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
      name: (
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
      width: 40,
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
