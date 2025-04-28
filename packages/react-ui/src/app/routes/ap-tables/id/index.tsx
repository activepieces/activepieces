import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useRef, useEffect } from 'react';
import DataGrid, {
  Column,
  RenderCellProps,
  DataGridHandle,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

import { useTheme } from '@/components/theme-provider';
import { ApFieldHeader } from '@/features/tables/components/ap-field-header';
import { ApTableFooter } from '@/features/tables/components/ap-table-footer';
import ApTableHeader from '@/features/tables/components/ap-table-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { SelectColumn } from '@/features/tables/components/select-column';
import { Row, ROW_HEIGHT_MAP, RowHeight } from '@/features/tables/lib/types';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';
import { ApFlagId, Permission } from '@activepieces/shared';

import './react-data-grid.css';
import { useTableState } from '../../../../features/tables/components/ap-table-state-provider';
import { ClientRecordData } from '../../../../features/tables/lib/store/ap-tables-client-state';

const ApTableEditorPage = () => {
  const [
    selectedRecords,
    setSelectedRecords,
    selectedCell,
    setSelectedCell,
    createRecord,
    updateRecord,
    fields,
    records,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.updateRecord,
    state.fields,
    state.records,
  ]);

  const gridRef = useRef<DataGridHandle>(null);
  const { theme } = useTheme();
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const { data: maxFields } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_FIELDS_PER_TABLE,
  );

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const isAllowedToCreateRecord =
    userHasTableWritePermission && maxRecords && records.length < maxRecords;
  const isAllowedToCreateField =
    userHasTableWritePermission && maxFields && fields.length < maxFields;

  const createEmptyRecord = () => {
    createRecord({
      uuid: nanoid(),
      values: [],
    });
    requestAnimationFrame(() => {
      gridRef.current?.scrollToCell({
        rowIdx: records.length,
        idx: 0,
      });
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectedCell &&
        !(event.target as HTMLElement).closest(
          `#editable-cell-${selectedCell.rowIdx}-${selectedCell.columnIdx}`,
        )
      ) {
        setSelectedCell(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedCell]);
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

  function mapRecordsToRows(records: ClientRecordData[]): Row[] {
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
  const rows = mapRecordsToRows(records);
  return (
    <div className="w-full h-full">
      <ApTableHeader isFetchingNextPage={false}></ApTableHeader>
      <div className="flex-1 flex flex-col mt-8 overflow-hidden">
        <DataGrid
          ref={gridRef}
          columns={columns}
          rows={rows}
          rowKeyGetter={(row: Row) => row.id}
          selectedRows={selectedRecords}
          onSelectedRowsChange={setSelectedRecords}
          className={cn(
            'scroll-smooth  w-[calc(100vw-256px)] h-[calc(100vh-92px-20px-22px)] bg-muted/30',
            theme === 'dark' ? 'rdg-dark' : 'rdg-light',
          )}
          bottomSummaryRows={
            userHasTableWritePermission ? [{ id: 'new-record' }] : []
          }
          rowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          headerRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          summaryRowHeight={
            isAllowedToCreateRecord ? ROW_HEIGHT_MAP[RowHeight.DEFAULT] : 0
          }
        />
      </div>
      <ApTableFooter
        fieldsCount={fields.length}
        recordsCount={records.length}
      />
    </div>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
