import { Permission } from '@activepieces/core-utils';
import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { nanoid } from 'nanoid';
import { useRef, useEffect, useState } from 'react';
import DataGrid, {
  DataGridHandle,
  RenderRowProps,
  Row as GridRow,
} from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/components/providers/theme-provider';
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
import { tableChanges } from '@/features/tables/utils/table-changes';
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
    serverRecords,
    serverFields,
    tableId,
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
    state.serverRecords,
    state.serverFields,
    state.table.id,
  ]);
  const sheen = useTableSheen({ records, serverRecords, fields, serverFields });
  const renderRow = (
    key: React.Key,
    props: RenderRowProps<Row, { id: string }>,
  ) => (
    <GridRow
      key={key}
      {...props}
      onAnimationEnd={(event) => {
        if (isSheen(event)) sheen.rowPlayed(String(key));
      }}
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

  const firstSheenRow = sheen.firstRow;
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

  const columns = useTableColumns(createEmptyRecord).map((column) => ({
    ...column,
    cellClass: (row: Row) =>
      sheen.cellClass({ rowId: row.id, fieldUuid: column.key }),
    headerCellClass: sheen.headerClass(column.key),
  }));
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
          <div
            className="relative flex-1 min-h-0"
            onAnimationEnd={(event) => {
              if (isSheen(event) && isHeader(event.target)) {
                sheen.headersPlayed();
              }
            }}
          >
            <DataGrid
              ref={gridRef}
              columns={columns}
              rows={rows}
              rowKeyGetter={(row: Row) => row.id}
              rowClass={(row: Row) => sheen.rowClass(row.id)}
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
            {rows.length === 0 && <FillingOverlay tableId={tableId} />}
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

function useTableSheen({
  records,
  serverRecords,
  fields,
  serverFields,
}: {
  records: { uuid: string }[];
  serverRecords: { id: string }[];
  fields: { uuid: string }[];
  serverFields: { id: string }[];
}) {
  const flashes = useFollowAlong((state) => state.flashes);
  const [played, setPlayed] = useState<ReadonlySet<string>>(new Set());
  const rowIndexById = new Map(
    serverRecords.map((record, index) => [record.id, index]),
  );
  const fieldUuidById = new Map(
    serverFields.flatMap((field, index) =>
      fields[index] ? [[field.id, fields[index].uuid]] : [],
    ),
  );
  const rows = new Map<number, LitRow>();
  const headers = new Map<string, string>();
  Object.entries(flashes).forEach(([key, value]) => {
    const token = `${key}:${value}`;
    const change = tableChanges.parse(key);
    if (!change || played.has(token)) return;
    if (change.type === 'field') {
      const fieldUuid = fieldUuidById.get(change.fieldId);
      if (fieldUuid) headers.set(fieldUuid, token);
      return;
    }
    const index = rowIndexById.get(change.recordId);
    if (index === undefined || !records[index]) return;
    const lit = rows.get(index) ?? { row: null, cells: new Map() };
    if (change.type === 'row') {
      rows.set(index, { ...lit, row: token });
      return;
    }
    const fieldUuid = fieldUuidById.get(change.fieldId);
    if (fieldUuid)
      rows.set(index, { ...lit, cells: lit.cells.set(fieldUuid, token) });
  });
  const litByUuid = new Map(
    [...rows].map(([index, lit]) => [records[index].uuid, lit]),
  );
  const firstIndex = rows.size === 0 ? null : Math.min(...rows.keys());
  const firstLit = firstIndex === null ? undefined : rows.get(firstIndex);
  const tokensOf = (lit: LitRow) => [
    ...(lit.row ? [lit.row] : []),
    ...lit.cells.values(),
  ];
  const markPlayed = (tokens: string[]) => {
    if (tokens.length === 0) return;
    setPlayed((previous) => new Set([...previous, ...tokens]));
  };
  return {
    firstRow:
      firstIndex !== null && firstLit
        ? { index: firstIndex, token: tokensOf(firstLit).join('|') }
        : null,
    rowClass: (uuid: string) =>
      litByUuid.get(uuid)?.row ? 'ap-ai-row-sheen' : undefined,
    cellClass: ({ rowId, fieldUuid }: { rowId: string; fieldUuid: string }) => {
      const lit = litByUuid.get(rowId);
      return lit && !lit.row && lit.cells.has(fieldUuid)
        ? 'ap-ai-cell-sheen'
        : undefined;
    },
    headerClass: (fieldUuid: string) =>
      headers.has(fieldUuid) ? 'ap-ai-cell-sheen' : undefined,
    rowPlayed: (uuid: string) => {
      const lit = litByUuid.get(uuid);
      if (lit) markPlayed(tokensOf(lit));
    },
    headersPlayed: () => markPlayed([...headers.values()]),
  };
}

function FillingOverlay({ tableId }: { tableId: string }) {
  const filling = useFollowAlong(
    (state) =>
      state.phase === 'editing' &&
      state.following &&
      state.target?.kind === 'table' &&
      state.target.id === tableId,
  );
  if (!filling) return null;
  return (
    <div
      role="status"
      style={{ top: ROW_HEIGHT_MAP[RowHeight.DEFAULT] }}
      className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 text-sm text-gray-11 animate-in fade-in duration-150 ease-move motion-reduce:animate-none"
    >
      <span className="size-2 shrink-0 rounded-full bg-accent-9" aria-hidden />
      {t('The AI is filling this table…')}
    </div>
  );
}

function isSheen(event: React.AnimationEvent): boolean {
  return event.animationName.startsWith('ap-ai-');
}

function isHeader(target: EventTarget): boolean {
  return (
    target instanceof Element &&
    target.closest('[role="columnheader"]') !== null
  );
}

ApTableEditorPage.displayName = 'ApTableEditorPage';

export { ApTableEditorPage };

type LitRow = { row: string | null; cells: Map<string, string> };
