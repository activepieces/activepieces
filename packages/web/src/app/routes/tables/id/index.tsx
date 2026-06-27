import { Permission } from '@activepieces/core-utils';
import { ApFlagId, LockerKind } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { nanoid } from 'nanoid';
import { useCallback, useRef, useEffect } from 'react';
import DataGrid, { DataGridHandle } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { ResourceLockWidget } from '@/components/custom/resource-lock-widget';
import { useTheme } from '@/components/providers/theme-provider';
import {
  ApTableFooter,
  ApTableHeader,
  useTableState,
  useTableColumns,
  mapRecordsToRows,
  Row,
  ROW_HEIGHT_MAP,
  RowHeight,
} from '@/features/tables';
import { useTableRealtime } from '@/features/tables/hooks/use-table-realtime';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useResourceLock } from '@/hooks/use-resource-lock';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { useReportTableExcerpt } from './use-report-table-excerpt';
import { useReportTableFocus } from './use-report-table-focus';

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
    table,
    setLockedByOtherUser,
  ] = useTableState((state) => [
    state.selectedRecords,
    state.setSelectedRecords,
    state.selectedCell,
    state.setSelectedCell,
    state.createRecord,
    state.fields,
    state.records,
    state.table,
    state.setLockedByOtherUser,
  ]);

  const queryClient = useQueryClient();
  const handleUnlocked = useCallback(
    ({ lockerKind }: { lockerKind?: LockerKind }) => {
      if (lockerKind !== LockerKind.AI) {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['fields', table.id] });
      void queryClient.invalidateQueries({ queryKey: ['records', table.id] });
      void queryClient.invalidateQueries({ queryKey: ['table', table.id] });
    },
    [queryClient, table.id],
  );

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: table.id,
    onUnlocked: handleUnlocked,
  });

  useEffect(() => {
    setLockedByOtherUser(!!lockedBy);
  }, [lockedBy, setLockedByOtherUser]);

  const isAiActive = lockedBy?.lockerKind === LockerKind.AI;
  useTableRealtime({ tableId: table.id, isAiActive });
  useReportTableFocus();
  useReportTableExcerpt();

  const recentRecords = useTableState((state) => state.recentlyChanged.records);
  const recentCells = useTableState((state) => state.recentlyChanged.cells);
  const clearExpiredHighlights = useTableState(
    (state) => state.clearExpiredHighlights,
  );

  const gridRef = useRef<DataGridHandle>(null);
  const previousRecordCount = useRef(records.length);

  useEffect(() => {
    if (
      Object.keys(recentRecords).length === 0 &&
      Object.keys(recentCells).length === 0
    ) {
      return;
    }
    const timer = setTimeout(clearExpiredHighlights, 1600);
    return () => clearTimeout(timer);
  }, [recentRecords, recentCells, clearExpiredHighlights]);

  useEffect(() => {
    const grew = records.length > previousRecordCount.current;
    previousRecordCount.current = records.length;
    if (!grew || !isAiActive) {
      return;
    }
    // While the agent streams rows in, follow the newest one so it's visible even
    // when it lands under the fold (tail behavior) — the whole point is to watch it fill.
    requestAnimationFrame(() => {
      gridRef.current?.scrollToCell({ rowIdx: records.length - 1, idx: 0 });
    });
  }, [records.length, isAiActive]);
  const { theme } = useTheme();
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    ApFlagId.MAX_RECORDS_PER_TABLE,
  );
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const canEdit = userHasTableWritePermission && !lockedBy;
  const isAllowedToCreateRecord =
    canEdit && maxRecords && records.length < maxRecords;
  const isCompactStage = useStageOptional()?.isCompact ?? false;
  const rowHeight = isCompactStage ? RowHeight.COMPACT : RowHeight.DEFAULT;

  const createEmptyRecord = () => {
    createRecord({
      uuid: nanoid(),
      recordId: null,
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
      if (!selectedCell) {
        return;
      }
      const target = event.target as HTMLElement;
      // The Stage panel owns its own selection — clicks outside it (e.g. into
      // the chat panel) must not clear the selected cell, so the user can pick
      // a cell and then go chat about it. Only deselect when the click lands
      // inside the Stage content but outside the selected cell.
      if (!target.closest('#dashboard-content-container')) {
        return;
      }
      if (
        !target.closest(
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

  const rowClass = (row: Row) => {
    if (!row.recordId) {
      return undefined;
    }
    const expiry = recentRecords[row.recordId];
    return expiry && expiry > Date.now() ? 'ap-row-enter' : undefined;
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}/automations`);
  };

  return (
    <div className="relative w-full flex flex-col justify-start items-start h-full">
      {isAiActive && lockedBy && (
        <ResourceLockWidget
          lockedBy={lockedBy}
          takeOver={takeOver}
          resourceLabel={t('table')}
        />
      )}
      <div className="flex items-center justify-between w-full pr-4 border-b">
        <ApTableHeader
          onBack={handleBack}
          lockedBy={isAiActive ? null : lockedBy}
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
              rowClass={rowClass}
              rowKeyGetter={(row: Row) => row.id}
              selectedRows={selectedRecords}
              onSelectedRowsChange={setSelectedRecords}
              className={cn(
                'scroll-smooth w-full !h-full bg-muted/30 !border-0',
                theme === 'dark' ? 'rdg-dark' : 'rdg-light',
              )}
              bottomSummaryRows={canEdit ? [{ id: 'new-record' }] : []}
              rowHeight={ROW_HEIGHT_MAP[rowHeight]}
              headerRowHeight={ROW_HEIGHT_MAP[rowHeight]}
              summaryRowHeight={
                isAllowedToCreateRecord ? ROW_HEIGHT_MAP[rowHeight] : 0
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

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
