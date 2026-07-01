import { isNil } from '@activepieces/core-utils';
import { useEffect, useMemo } from 'react';

import {
  useStageOptional,
  StageFocus,
} from '@/app/components/workspace-shell/stage-context';
import { useTableState } from '@/features/tables';

const VALUE_PREVIEW_MAX = 120;
const RANGE_COLUMNS_PREVIEW = 4;
const SELECTED_IDS_MAX = 50;

// Publishes the table's selected cell / rows up to the Stage so the chat knows
// exactly where the user is inside the open table ("this cell", "this row").
// Cleared on unmount; the Stage also clears focus when it closes.
export function useReportTableFocus() {
  const stage = useStageOptional();
  const reportStageFocus = stage?.reportStageFocus;

  const [
    tableId,
    selectedCell,
    selectedRange,
    selectedRecords,
    fields,
    records,
  ] = useTableState((state) => [
    state.table.id,
    state.selectedCell,
    state.selectedRange,
    state.selectedRecords,
    state.fields,
    state.records,
  ]);

  const focus = useMemo<StageFocus | null>(() => {
    if (!isNil(selectedRange)) {
      const colStart = Math.min(selectedRange.x, selectedRange.x1);
      const colEnd = Math.max(selectedRange.x, selectedRange.x1);
      const rowStart = Math.min(selectedRange.y, selectedRange.y1);
      const rowEnd = Math.max(selectedRange.y, selectedRange.y1);
      const rowCount = rowEnd - rowStart + 1;
      const colCount = colEnd - colStart + 1;
      // Range column indices are 0-based over data fields (no checkbox offset,
      // unlike selectedCell.columnIdx — see onSetrange in tables/id/index.tsx).
      const columnNames = fields
        .slice(colStart, colEnd + 1)
        .map((field, i) => field?.name ?? `column ${colStart + i + 1}`);
      const shownColumns = columnNames.slice(0, RANGE_COLUMNS_PREVIEW);
      const columnSummary =
        shownColumns.join(', ') +
        (columnNames.length > shownColumns.length
          ? `, +${columnNames.length - shownColumns.length} more`
          : '');
      // The selected ROW record ids are what the agent needs to act (the grid
      // coords are meaningless to it); forward them so "these"/"update them"
      // resolves to exact ids with no value-matching or position guessing.
      const rangeRecordIds = records
        .slice(rowStart, rowEnd + 1)
        .map((record) => record.recordId)
        .filter((id): id is string => !isNil(id));
      const idList = formatIdList(rangeRecordIds);
      return {
        scopeType: 'table',
        scopeId: tableId,
        kind: 'table-range',
        label: `range · rows ${rowStart + 1}–${rowEnd + 1} · ${columnSummary}`,
        detail: `${rowCount}×${colCount} cells selected${
          idList ? ` · record ids: ${idList}` : ''
        }`,
      };
    }
    if (!isNil(selectedCell)) {
      const { rowIdx, columnIdx } = selectedCell;
      // The grid's leading column (idx 0) is the row-select checkbox, so data
      // field N sits at grid columnIdx N+1 (see table-columns.tsx). Map back to
      // the fields array, or the chip names the column to the right of the one
      // actually selected.
      const fieldIndex = columnIdx - 1;
      const field = fields[fieldIndex];
      const record = records[rowIdx];
      const fieldName = field?.name ?? `column ${fieldIndex + 1}`;
      const value = record?.values.find(
        (v) => v.fieldIndex === fieldIndex,
      )?.value;
      return {
        scopeType: 'table',
        scopeId: tableId,
        kind: 'table-cell',
        label: `row ${rowIdx + 1} · ${fieldName}`,
        ...(record?.recordId ? { ref: record.recordId } : {}),
        detail: `current value: ${previewValue(value)}`,
      };
    }
    if (selectedRecords.size > 0) {
      const count = selectedRecords.size;
      const ids = [...selectedRecords];
      return {
        scopeType: 'table',
        scopeId: tableId,
        kind: 'table-rows',
        label: `${count} row${count > 1 ? 's' : ''} selected`,
        ...(count === 1 ? { ref: ids[0] } : {}),
        detail: `record ids: ${formatIdList(ids)}`,
      };
    }
    return null;
  }, [tableId, selectedCell, selectedRange, selectedRecords, fields, records]);

  useEffect(() => {
    reportStageFocus?.(focus);
  }, [reportStageFocus, focus]);

  useEffect(() => {
    return () => reportStageFocus?.(null);
  }, [reportStageFocus]);
}

function previewValue(value: unknown): string {
  if (isNil(value) || value === '') {
    return '(empty)';
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > VALUE_PREVIEW_MAX
    ? `${text.slice(0, VALUE_PREVIEW_MAX)}…`
    : text;
}

function formatIdList(ids: string[]): string {
  const shown = ids.slice(0, SELECTED_IDS_MAX);
  const suffix =
    ids.length > shown.length ? `, +${ids.length - shown.length} more` : '';
  return shown.join(', ') + suffix;
}
