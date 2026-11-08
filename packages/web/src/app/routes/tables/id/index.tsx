import { Permission } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useRef, useEffect, useMemo } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { FollowEmptyState } from '@/app/components/chat-panel/follow-bar';
import { useTheme } from '@/components/providers/theme-provider';
import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import { aiHighlight } from '@/features/chat/lib/follow/use-ai-highlight';
import { useReportPageSelection } from '@/features/chat/lib/page-context';
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

  useReportPageSelection({ recordIds: [...selectedRecords] });

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
  const flash = useAiTableHighlights(gridRef);
  const columns = useMemo(
    () =>
      baseColumns.map((column) => ({
        ...column,
        cellClass: (row: Row) =>
          cn(
            typeof column.cellClass === 'function'
              ? column.cellClass(row)
              : column.cellClass,
            flash.cell(row.id, column.key) && 'ap-ai-glow',
          ),
        headerCellClass: cn(
          column.headerCellClass,
          flash.field(column.key) && 'ap-ai-glow',
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
          <div className="relative flex-1 min-h-0">
            <DataGrid
              ref={gridRef}
              columns={columns}
              rows={rows}
              rowKeyGetter={(row: Row) => row.id}
              rowClass={(row: Row) => flash.rowClass(row.id)}
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
            {rows.length === 0 && (
              <FollowEmptyState
                kind="table"
                className="pointer-events-none absolute inset-x-0 bottom-0 top-10"
              />
            )}
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

function useAiTableHighlights(gridRef: React.RefObject<DataGridHandle | null>) {
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
    const rows = new Map<string, string>();
    const cells = new Set<string>();
    const columns = new Set<string>();
    let firstRowIdx: number | null = null;
    serverFields.forEach((field, fieldIndex) => {
      const column = fields[fieldIndex]?.uuid;
      if (column && `table-field:${field.id}` in flashes) columns.add(column);
    });
    records.forEach((record, index) => {
      const recordId = serverRecords[index]?.id;
      if (!recordId) return;
      let touched = false;
      if (`table-row-deleted:${recordId}` in flashes) {
        rows.set(record.uuid, 'ap-ai-fade-out');
        touched = true;
      } else if (`table-row:${recordId}` in flashes) {
        rows.set(record.uuid, 'ap-ai-glow-row');
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
      rowClass: (rowId: string) => rows.get(rowId),
      cell: (rowId: string, columnKey: string) =>
        cells.has(`${rowId}:${columnKey}`),
      field: (columnKey: string) => columns.has(columnKey),
      firstRowIdx,
    };
  }, [flashes, records, fields, serverRecords, serverFields]);

  useEffect(() => {
    const rowIdx = lit.firstRowIdx;
    if (rowIdx === null || !aiHighlight.mayScroll()) return;
    const frame = requestAnimationFrame(() =>
      gridRef.current?.scrollToCell({ rowIdx, idx: 0 }),
    );
    return () => cancelAnimationFrame(frame);
  }, [lit.firstRowIdx, gridRef]);

  return lit;
}

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
