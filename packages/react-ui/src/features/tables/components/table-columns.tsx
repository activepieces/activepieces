import { Plus } from 'lucide-react';
import { Column, RenderCellProps } from 'react-data-grid';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, Permission } from '@activepieces/shared';

import { ApFieldHeader } from './ap-field-header';
import { EditableCell } from './editable-cell';
import { NewFieldPopup } from './new-field-popup';
import { SelectColumn } from './select-column';
import { Row } from '../lib/types';
import { ClientRecordData } from '../lib/store/ap-tables-client-state';
import { useTableState } from './ap-table-state-provider';

export function useTableColumns(createEmptyRecord: () => void) {
  const [
    fields,
    updateRecord,
  ] = useTableState((state) => [
    state.fields,
    state.updateRecord,
  ]);

  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const isAllowedToCreateField =
    userHasTableWritePermission && maxFields && fields.length < maxFields;

  const newFieldColumn = {
    key: 'new-field',
    minWidth: 67,
    maxWidth: 67,
    width: 67,
    name: '',
    renderHeaderCell: () => (
      <NewFieldPopup>
        <div className="w-full h-full flex items-center justify-center cursor-pointer new-field">
          <Plus className="h-4 w-4" />
        </div>
      </NewFieldPopup>
    ),
    renderCell: () => <div className="empty-cell"></div>,
  };

  const columns: Column<Row, { id: string }>[] = [
    {
      ...SelectColumn,
      renderSummaryCell: () => (
        <div
          className="w-full h-full border-t border-border  flex items-center justify-start cursor-pointer pl-4"
          onClick={createEmptyRecord}
        >
          <Plus className="h-4 w-4" />
        </div>
      ),
    },
    ...(fields.map((field, index) => ({
      key: field.uuid,
      minWidth: 207,
      width: 207,
      minHeight: 37,
      resizable: true,
      name: '',
      renderHeaderCell: () => <ApFieldHeader field={{ ...field, index }} />,
      renderCell: ({
        row,
        column,
        rowIdx,
      }: RenderCellProps<Row, { id: string }>) => (
        <EditableCell
          key={row.id + '_' + field.uuid}
          field={field}
          value={row[field.uuid]}
          row={row}
          column={column}
          rowIdx={rowIdx}
          disabled={!userHasTableWritePermission}
          onRowChange={(newRow) => {
            updateRecord(rowIdx, {
              values: fields.map((field, fIndex) => ({
                fieldIndex: fIndex,
                value: newRow[field.uuid] ?? '',
              })),
            });
          }}
        />
      ),
      renderSummaryCell: () => (
        <div
          className="w-full h-full flex border-t border-border  items-center justify-start cursor-pointer pl-4"
          onClick={createEmptyRecord}
        ></div>
      ),
    })) ?? []),
  ];

  if (isAllowedToCreateField) {
    columns.push(newFieldColumn);
  }

  return columns;
}

export function mapRecordsToRows(records: ClientRecordData[], fields: any[]): Row[] {
  if (!records || records.length === 0) return [];
  return records.map((record: ClientRecordData) => {
    const row: Row = { id: record.uuid };
    record.values.forEach((cell) => {
      const field = fields[cell.fieldIndex];
      if (field) {
        row[field.uuid] = cell.value;
      }
    });
    return row;
  });
} 