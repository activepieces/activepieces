import { Permission } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useCallback, useRef, useEffect, useState } from 'react';
import DataGrid, {
  DataGridHandle,
  RenderRowProps,
  Row as GridRow,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/components/providers/theme-provider';
import { aiSheen } from '@/features/chat/lib/follow/ai-sheen';
import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import { aiHighlight } from '@/features/chat/lib/follow/use-ai-highlight';
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
  const rowSheen = useRowSheen(records);
  const renderRow = (
    key: React.Key,
    rowProps: RenderRowProps<Row, { id: string }>,
  ) => (
    <SheenRow
      key={key}
      {...rowProps}
      rowId={rowProps.row.id}
      sheenToken={rowSheen.pendingToken(rowProps.row.id)}
      onSheen={rowSheen.played}
    />
  );

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

  const firstSheenRow = rowSheen.firstRow;
  useEffect(() => {
    if (firstSheenRow === null || !aiHighlight.claimScroll()) return;
    gridRef.current?.scrollToCell({ rowIdx: firstSheenRow.index, idx: 0 });
  }, [firstSheenRow?.token, firstSheenRow?.index]);

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
              renderers={{ renderRow }}
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

function SheenRow({
  rowId,
  sheenToken,
  onSheen,
  ...props
}: RenderRowProps<Row, { id: string }> & {
  rowId: string;
  sheenToken: number | null;
  onSheen: (sheen: RowSheen) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = ref.current;
    if (sheenToken === null || !row) return;
    aiSheen.play([...row.querySelectorAll(':scope > .rdg-cell')]);
    onSheen({ rowId, token: sheenToken });
  }, [sheenToken, rowId, onSheen]);
  return <GridRow ref={ref} {...props} />;
}

function useRowSheen(records: { uuid: string }[]) {
  const flashes = useFollowAlong((state) => state.flashes);
  const [shown, setShown] = useState<ReadonlyMap<string, number>>(new Map());
  const played = useCallback(
    ({ rowId, token }: RowSheen) =>
      setShown((previous) => new Map(previous).set(rowId, token)),
    [],
  );
  const pendingToken = (rowId: string): number | null => {
    const token = flashes[`table-row:${rowId}`];
    return token === undefined || shown.get(rowId) === token ? null : token;
  };
  const firstIndex = records.findIndex(
    (record) => pendingToken(record.uuid) !== null,
  );
  const firstToken =
    firstIndex === -1 ? null : pendingToken(records[firstIndex].uuid);
  return {
    firstRow:
      firstToken === null ? null : { index: firstIndex, token: firstToken },
    pendingToken,
    played,
  };
}

ApTableEditorPage.displayName = 'ApTableEditorPage';

type RowSheen = { rowId: string; token: number };

export { ApTableEditorPage };
