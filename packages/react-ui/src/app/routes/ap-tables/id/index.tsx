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
import ApTableHeader from '@/features/tables/components/ap-table-header';
import { EditableCell } from '@/features/tables/components/editable-cell';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { SelectColumn } from '@/features/tables/components/select-column';
import { Row, ROW_HEIGHT_MAP, RowHeight } from '@/features/tables/lib/types';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { Permission } from '@activepieces/shared';

import './react-data-grid.css';
import { useTableState } from '../../../../features/tables/components/ap-table-state-provider';
import { ClientRecordData } from '../../../../features/tables/lib/store/ap-tables-client-state';

const ApTableEditorPage = () => {
  const [
    selectedRows,
    setSelectedRows,
    selectedCell,
    setSelectedCell,
    createRecord,
    updateRecord,
    fields,
    records,
  ] = useTableState((state) => [
    state.selectedRows,
    state.setSelectedRows,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.updateRecord,
    state.fields,
    state.records,
  ]);

  const gridRef = useRef<DataGridHandle>(null);
  const { theme } = useTheme();

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

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
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
      renderSummaryCell: userHasTableWritePermission
        ? () => (
            <div
              className="w-full h-full flex items-center justify-start cursor-pointer pl-4"
              onClick={createEmptyRecord}
            >
              <Plus className="h-4 w-4" />
            </div>
          )
        : undefined,
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
      renderSummaryCell: userHasTableWritePermission
        ? () => (
            <div
              className="w-full h-full flex items-center justify-start cursor-pointer pl-4"
              onClick={createEmptyRecord}
            ></div>
          )
        : undefined,
    })) ?? []),
  ];
  if (userHasTableWritePermission) {
    columns.push(newFieldColumn);
  }
  function onSelectedRowsChange(newSelectedRows: ReadonlySet<string>) {
    setSelectedRows(newSelectedRows);
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

  return (
    <div className="w-full h-full">
      <ApTableHeader isFetchingNextPage={false}></ApTableHeader>
      <div className="flex-1 flex flex-col mt-8 overflow-hidden">
        <DataGrid
          ref={gridRef}
          columns={columns}
          rows={mapRecordsToRows(records)}
          rowKeyGetter={(row: Row) => row.id}
          selectedRows={selectedRows}
          onSelectedRowsChange={onSelectedRowsChange}
          className={cn(
            'scroll-smooth  w-full h-[calc(100vh-7rem-92px)] bg-muted/30',
            theme === 'dark' ? 'rdg-dark' : 'rdg-light',
          )}
          bottomSummaryRows={
            userHasTableWritePermission ? [{ id: 'new-record' }] : []
          }
          rowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          headerRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
          summaryRowHeight={ROW_HEIGHT_MAP[RowHeight.DEFAULT]}
        />
      </div>
    </div>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
