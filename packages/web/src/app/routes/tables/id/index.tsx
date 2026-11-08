import { Permission } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useRef, useEffect, useMemo, useCallback } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { FollowEmptyState } from '@/app/components/chat-panel/follow-bar';
import { useTheme } from '@/components/providers/theme-provider';
import { aiSheen } from '@/features/chat/lib/follow/ai-sheen';
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

  const columns = useTableColumns(createEmptyRecord);
  const rows = mapRecordsToRows(records, fields);
  const flash = useAiTableHighlights({ gridRef, columns });

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
      <div className="@container flex items-center justify-between w-full pr-4 border-b">
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
              onScroll={flash.replay}
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

function useAiTableHighlights({
  gridRef,
  columns,
}: {
  gridRef: React.RefObject<DataGridHandle | null>;
  columns: { key: string }[];
}) {
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
    const fadingRows = new Set<string>();
    const sheens: TableSheen[] = [];
    let firstRowIdx: number | null = null;
    const columnIdxOf = (fieldIndex: number) => {
      const key = fields[fieldIndex]?.uuid;
      const index = columns.findIndex((column) => column.key === key);
      return index === -1 ? null : index;
    };
    serverFields.forEach((field, fieldIndex) => {
      const key = `table-field:${field.id}`;
      const columnIdx = columnIdxOf(fieldIndex);
      if (columnIdx !== null && key in flashes) {
        sheens.push({
          id: `${key}:${flashes[key]}`,
          selector: `.rdg-header-row > [aria-colindex="${columnIdx + 1}"]`,
        });
      }
    });
    records.forEach((record, index) => {
      const recordId = serverRecords[index]?.id;
      if (!recordId) return;
      const row = `.rdg-row[aria-rowindex="${index + HEADER_ROWS + 1}"]`;
      const rowKey = `table-row:${recordId}`;
      let touched = false;
      if (`table-row-deleted:${recordId}` in flashes) {
        fadingRows.add(record.uuid);
        touched = true;
      } else if (rowKey in flashes) {
        sheens.push({
          id: `${rowKey}:${flashes[rowKey]}`,
          selector: `${row} > .rdg-cell`,
        });
        touched = true;
      } else {
        const cells = serverFields.flatMap((field, fieldIndex) => {
          const key = `table-cell:${recordId}:${field.id}`;
          const columnIdx = columnIdxOf(fieldIndex);
          if (columnIdx === null || !(key in flashes)) return [];
          return [
            {
              id: `${key}:${flashes[key]}`,
              selector: `${row} > [aria-colindex="${columnIdx + 1}"]`,
            },
          ];
        });
        if (cells.length > 0) {
          sheens.push({
            id: cells.map((cell) => cell.id).join('|'),
            selector: cells.map((cell) => cell.selector).join(', '),
          });
          touched = true;
        }
      }
      if (touched && firstRowIdx === null) firstRowIdx = index;
    });
    return { fadingRows, sheens, firstRowIdx };
  }, [flashes, records, fields, serverRecords, serverFields, columns]);

  const replay = useCallback(() => {
    const grid = gridRef.current?.element;
    if (!grid) return;
    lit.sheens.forEach(({ id, selector }) =>
      aiSheen.play({
        id,
        elements: [...grid.querySelectorAll(selector)],
        bounds: grid,
      }),
    );
  }, [lit, gridRef]);

  useEffect(() => {
    const frame = requestAnimationFrame(replay);
    return () => cancelAnimationFrame(frame);
  }, [replay]);

  useEffect(() => {
    const rowIdx = lit.firstRowIdx;
    if (rowIdx === null || !aiHighlight.claimScroll()) return;
    const frame = requestAnimationFrame(() =>
      gridRef.current?.scrollToCell({ rowIdx, idx: 0 }),
    );
    return () => cancelAnimationFrame(frame);
  }, [lit.firstRowIdx, gridRef]);

  return {
    rowClass: (rowId: string) =>
      lit.fadingRows.has(rowId) ? 'ap-ai-fade-out' : undefined,
    replay,
  };
}

ApTableEditorPage.displayName = 'ApTableEditorPage';

const HEADER_ROWS = 1;

export { ApTableEditorPage };

type TableSheen = { id: string; selector: string };
