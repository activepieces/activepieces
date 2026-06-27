import { isNil } from '@activepieces/core-utils';
import { useEffect, useMemo } from 'react';

import {
  useStageOptional,
  StageFocus,
} from '@/app/components/workspace-shell/stage-context';
import { useTableState } from '@/features/tables';

const VALUE_PREVIEW_MAX = 120;

// Publishes the table's selected cell / rows up to the Stage so the chat knows
// exactly where the user is inside the open table ("this cell", "this row").
// Cleared on unmount; the Stage also clears focus when it closes.
export function useReportTableFocus() {
  const stage = useStageOptional();
  const reportStageFocus = stage?.reportStageFocus;

  const [tableId, selectedCell, selectedRecords, fields, records] =
    useTableState((state) => [
      state.table.id,
      state.selectedCell,
      state.selectedRecords,
      state.fields,
      state.records,
    ]);

  const focus = useMemo<StageFocus | null>(() => {
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
      return {
        scopeType: 'table',
        scopeId: tableId,
        kind: 'table-rows',
        label: `${count} row${count > 1 ? 's' : ''} selected`,
        ...(count === 1 ? { ref: [...selectedRecords][0] } : {}),
      };
    }
    return null;
  }, [tableId, selectedCell, selectedRecords, fields, records]);

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
