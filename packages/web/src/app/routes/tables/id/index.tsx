import { Permission } from '@activepieces/core-utils';
import { ApFlagId, LockerKind } from '@activepieces/shared';
import { RevoGrid } from '@revolist/react-datagrid';
import type {
  AfterEditEvent,
  FocusAfterRenderEvent,
  MultiDimensionType,
  RangeArea,
} from '@revolist/revogrid';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DetailPageBreadcrumb } from '@/app/components/project-layout/detail-page-breadcrumb';
import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { ResourceLockWidget } from '@/components/custom/resource-lock-widget';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  ApTableFooter,
  ApTableHeader,
  useTableState,
  useTableColumns,
  mapRecordsToRows,
} from '@/features/tables';
import type { ClientField } from '@/features/tables';
import { useOptionalTableStore } from '@/features/tables/components/ap-table-state-provider';
import { FieldActionsMenu } from '@/features/tables/components/field-actions-menu';
import { NewFieldPopup } from '@/features/tables/components/new-field-popup';
import { buildRowHeaders } from '@/features/tables/components/table-columns';
import { useTableGridDom } from '@/features/tables/hooks/use-table-grid-dom';
import { useTableRealtime } from '@/features/tables/hooks/use-table-realtime';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useResourceLock } from '@/hooks/use-resource-lock';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { useReportTableExcerpt } from './use-report-table-excerpt';
import { useReportTableFocus } from './use-report-table-focus';

import './revogrid.css';

type FieldMenuTarget = {
  field: ClientField & { index: number };
  anchor: DOMRect;
};

const ApTableEditorPage = () => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId();
  const [
    fields,
    records,
    table,
    createRecord,
    updateRecord,
    setSelectedCell,
    setSelectedRange,
    setLockedByOtherUser,
  ] = useTableState((state) => [
    state.fields,
    state.records,
    state.table,
    state.createRecord,
    state.updateRecord,
    state.setSelectedCell,
    state.setSelectedRange,
    state.setLockedByOtherUser,
  ]);
  const recentRecords = useTableState((state) => state.recentlyChanged.records);
  const recentCells = useTableState((state) => state.recentlyChanged.cells);
  const exitingRows = useTableState((state) => state.exitingRows);
  const clearExpiredHighlights = useTableState(
    (state) => state.clearExpiredHighlights,
  );

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

  const gridRef = useRef<HTMLRevoGridElement>(null);
  const previousRecordCount = useRef(records.length);
  useTableGridDom(gridRef);

  // RevoGrid only re-exposes a subset of its events as React props; these two are
  // emitted by inner elements and bubble up to the host, so we capture them
  // imperatively.
  //  - `setrange`: multi-cell RANGE selection → tell the chat which block of cells
  //    is selected. A 1×1 area is just a single-cell focus (handled by
  //    onAfterfocus) — only a real block counts as a range.
  //  - `beforekeydown`: RevoGrid handles keys off a *document* listener, so once we
  //    keep the selection alive on blur (onBeforefocuslost), Backspace/arrows typed
  //    in the chat would clear or move the grid selection — even delete cell data.
  //    Cancel its key handling whenever an editable element OUTSIDE the grid (the
  //    chat) is focused; grid nav and in-cell editing are unaffected.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    const onSetRange = (e: Event) => {
      if (!(e instanceof CustomEvent)) {
        return;
      }
      const detail: RangeArea & { type: MultiDimensionType } = e.detail;
      const { x, y, x1, y1 } = detail;
      setSelectedRange(x === x1 && y === y1 ? null : { x, y, x1, y1 });
    };
    const onBeforeKeyDown = (e: Event) => {
      const el = document.activeElement;
      const typingOutsideGrid =
        el instanceof HTMLElement &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable) &&
        !grid.contains(el);
      if (typingOutsideGrid) {
        e.preventDefault();
      }
    };
    grid.addEventListener('setrange', onSetRange);
    grid.addEventListener('beforekeydown', onBeforeKeyDown);
    return () => {
      grid.removeEventListener('setrange', onSetRange);
      grid.removeEventListener('beforekeydown', onBeforeKeyDown);
    };
  }, [setSelectedRange]);

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
  const rowHeightPx = isCompactStage ? 30 : 34;

  const [fieldMenuTarget, setFieldMenuTarget] =
    useState<FieldMenuTarget | null>(null);
  const onOpenFieldMenu = useCallback(
    (field: ClientField & { index: number }, anchor: DOMRect) => {
      setFieldMenuTarget({ field, anchor });
    },
    [],
  );

  const { columns, columnTypes } = useTableColumns({
    onOpenFieldMenu,
    canEdit,
  });
  const tableStore = useOptionalTableStore();
  const rowHeaders = useMemo(
    () => (tableStore ? buildRowHeaders(tableStore) : true),
    [tableStore],
  );
  // Selection is intentionally NOT part of the source — toggling a checkbox must
  // not replace the array, which would make RevoGrid recreate every cell's DOM
  // (visible flicker). The row highlight is driven from the store instead, via
  // `cellProperties` (re-render/scroll) + an imperative class toggle in
  // `useTableGridDom` (instant, no source change). So `rows` only re-derives when
  // the underlying records or fields actually change.
  const rows = useMemo(
    () => mapRecordsToRows(records, fields),
    [records, fields],
  );

  useEffect(() => {
    if (
      Object.keys(recentRecords).length === 0 &&
      Object.keys(recentCells).length === 0 &&
      Object.keys(exitingRows).length === 0
    ) {
      return;
    }
    const timer = setTimeout(clearExpiredHighlights, 1600);
    return () => clearTimeout(timer);
  }, [recentRecords, recentCells, exitingRows, clearExpiredHighlights]);

  useEffect(() => {
    const grew = records.length > previousRecordCount.current;
    previousRecordCount.current = records.length;
    if (!grew || !isAiActive) {
      return;
    }
    // While the agent adds rows, follow the newest one so it stays visible — the
    // whole point is to watch the table fill.
    requestAnimationFrame(() => {
      void gridRef.current?.scrollToRow(records.length - 1);
    });
  }, [records.length, isAiActive]);

  const applyEdit = useCallback(
    (detail: AfterEditEvent) => {
      if (!('prop' in detail)) {
        // Range paste/fill: detail.data is rowIndex -> full updated row model.
        Object.entries(detail.data).forEach(([rowIndexStr, model]) => {
          const recordIndex = Number(rowIndexStr);
          const values = fields.map((field, fieldIndex) => ({
            fieldIndex,
            value: model[field.uuid] ?? '',
          }));
          updateRecord(recordIndex, { values });
        });
        return;
      }
      const recordIndex = detail.rowIndex;
      const fieldIndex = fields.findIndex(
        (field) => field.uuid === detail.prop,
      );
      if (
        fieldIndex === -1 ||
        recordIndex < 0 ||
        recordIndex >= records.length
      ) {
        return;
      }
      const record = records[recordIndex];
      const existing = record.values.filter(
        (cell) => cell.fieldIndex !== fieldIndex,
      );
      updateRecord(recordIndex, {
        values: [...existing, { fieldIndex, value: detail.val }],
      });
    },
    [fields, records, updateRecord],
  );

  const createEmptyRecord = () => {
    createRecord({
      uuid: nanoid(),
      recordId: null,
      agentRunId: null,
      values: [],
    });
    requestAnimationFrame(() => {
      void gridRef.current?.scrollToRow(records.length);
    });
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
          renderTitle={(title) => (
            <DetailPageBreadcrumb section="automations">
              {title}
            </DetailPageBreadcrumb>
          )}
        />
      </div>

      <div className="flex w-full flex-col flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <div className="ap-grid-shell">
              <RevoGrid
                ref={gridRef}
                source={rows}
                columns={columns}
                columnTypes={columnTypes}
                rowHeaders={rowHeaders}
                theme={theme === 'dark' ? 'darkCompact' : 'compact'}
                rowSize={rowHeightPx}
                range={true}
                readonly={!canEdit}
                hideAttribution={true}
                className={cn('w-full h-full')}
                onAfteredit={(e: CustomEvent<AfterEditEvent>) =>
                  applyEdit(e.detail)
                }
                onAfterfocus={(e: CustomEvent<FocusAfterRenderEvent>) => {
                  setSelectedCell({
                    rowIdx: e.detail.rowIndex,
                    columnIdx: e.detail.colIndex + 1,
                  });
                  setSelectedRange(null);
                }}
                onBeforefocuslost={(e: CustomEvent) => {
                  // Keep the cell/range highlight when focus moves to the chat
                  // (the user selects a cell, then clicks the chat to ask about
                  // it). RevoGrid clears its selection on any outside click;
                  // cancelling this keeps it. Picking another cell still moves it.
                  e.preventDefault();
                }}
              />
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2 px-2 py-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={createEmptyRecord}
                disabled={!isAllowedToCreateRecord}
              >
                <Plus className="size-4" />
                {t('New Record')}
              </Button>
              <NewFieldPopup>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Plus className="size-4" />
                  {t('New Field')}
                </Button>
              </NewFieldPopup>
            </div>
          )}
          <ApTableFooter
            fieldsCount={fields.length}
            recordsCount={records.length}
          />
        </div>
      </div>

      <FieldActionsMenu
        target={fieldMenuTarget}
        onClose={() => setFieldMenuTarget(null)}
      />
    </div>
  );
};

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };
