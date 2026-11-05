import { Permission } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useRef, useEffect, useMemo } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/components/providers/theme-provider';
import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import {
  ApTableFooter,
  ApTableHeader,
  useTableState,
  useTableLock,
  useTableColumns,
  mapRecordsToRows,
  Row,
  ROW_HEIGHT_MAP,
  RowHeight,
} from '@/features/tables';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import './react-data-grid.css';

const ApTableEditorPage = () => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId();
  const [
    selectedRecords,
    setSelectedRecords,
    selectedCell,
    setSelectedCell,
    createRecord,
    fields,
    records,
    setLockedByOtherUser,
    reorderField,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.fields,
    state.records,
    state.setLockedByOtherUser,
    state.reorderField,
  ]);

  // the lock lives in the table state provider, above the take-over refresh
  // remount boundary, so refreshing never releases the just-acquired lock
  const { lockedBy, acquiring, takeOver } = useTableLock();
  const blockedByLock = !!lockedBy || acquiring;

  useEffect(() => {
    setLockedByOtherUser(blockedByLock);
  }, [blockedByLock, setLockedByOtherUser]);

  const gridRef = useRef<DataGridHandle>(null);
  const { resolvedTheme } = useTheme();
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !blockedByLock;
  const isAllowedToCreateRecord =
    canEdit && maxRecords && records.length < maxRecords;

  const createEmptyRecord = () => {
    createRecord({
      uuid: nanoid(),
      agentRunId: null,
      values: [],
    });
    requestAnimationFrame(() => {
      gridRef.current?.scrollToCell({
        rowIdx: records.length,
        idx: 0,
      });
      setSelectedCell({
        rowIdx: records.length,
        columnIdx: 1,
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

  const baseColumns = useTableColumns(createEmptyRecord);
  const rows = mapRecordsToRows(records, fields);
  const flash = useFollowFlashes(gridRef);
  const columns = useMemo(
    () =>
      baseColumns.map((column) => ({
        ...column,
        cellClass: (row: Row) =>
          cn(
            typeof column.cellClass === 'function'
              ? column.cellClass(row)
              : column.cellClass,
            flash.cell(row.id, column.key) && 'ap-follow-flash',
          ),
      })),
    [baseColumns, flash],
  );

  const handleColumnsReorder = (sourceKey: string, targetKey: string) => {
    const sourceIndex = fields.findIndex((field) => field.uuid === sourceKey);
    const targetIndex = fields.findIndex((field) => field.uuid === targetKey);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }
    reorderField(sourceIndex, targetIndex);
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}/automations`);
  };

  return (
    <div className="w-full flex flex-col justify-start items-start h-full">
      <div className="flex items-center justify-between w-full pr-4 border-b">
        <ApTableHeader
          onBack={handleBack}
          lockedBy={lockedBy}
          takeOver={takeOver}
        />
      </div>

      <div className="flex w-full flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <DataGrid
              ref={gridRef}
              columns={columns}
              rows={rows}
              rowKeyGetter={(row: Row) => row.id}
              rowClass={(row: Row) =>
                flash.row(row.id) ? 'ap-follow-flash-row' : undefined
              }
              selectedRows={selectedRecords}
              onSelectedRowsChange={setSelectedRecords}
              onColumnsReorder={handleColumnsReorder}
              className={cn(
                'scroll-smooth w-full !h-full bg-gray-2 !border-0',
                resolvedTheme === 'dark' ? 'rdg-dark' : 'rdg-light',
              )}
              bottomSummaryRows={canEdit ? [{ id: 'new-record' }] : []}
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
      </div>
    </div>
  );
};

// What the chat just changed in this table (see useFollowTableUpdates), by
// grid row and column, and the first such row scrolled into view.
function useFollowFlashes(gridRef: React.RefObject<DataGridHandle | null>) {
  const flashes = useFollowAlong((state) => state.flashes);
  const [records, fields, serverRecords, serverFields] = useTableState(
    (state) => [
      state.records,
      state.fields,
      state.serverRecords,
      state.serverFields,
    ],
  );
  const lit = useMemo(() => {
    const rows = new Set<string>();
    const cells = new Set<string>();
    let firstRowIdx: number | null = null;
    records.forEach((record, index) => {
      const recordId = serverRecords[index]?.id;
      if (!recordId) return;
      let touched = false;
      if (`table-row:${recordId}` in flashes) {
        rows.add(record.uuid);
        touched = true;
      }
      serverFields.forEach((field, fieldIndex) => {
        const column = fields[fieldIndex]?.uuid;
        if (column && `table-cell:${recordId}:${field.id}` in flashes) {
          cells.add(`${record.uuid}:${column}`);
          touched = true;
        }
      });
      if (touched && firstRowIdx === null) firstRowIdx = index;
    });
    return {
      row: (rowId: string) => rows.has(rowId),
      cell: (rowId: string, columnKey: string) =>
        cells.has(`${rowId}:${columnKey}`),
      firstRowIdx,
    };
  }, [flashes, records, fields, serverRecords, serverFields]);

  // The grid is rebuilt on each update; scroll once it has laid out.
  useEffect(() => {
    const rowIdx = lit.firstRowIdx;
    if (rowIdx === null) return;
    const frame = requestAnimationFrame(() =>
      gridRef.current?.scrollToCell({ rowIdx, idx: 0 }),
    );
    return () => cancelAnimationFrame(frame);
  }, [lit.firstRowIdx, gridRef]);

  return lit;
}

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
