import { useEffect, useMemo } from 'react';

import {
  useStageOptional,
  StageExcerpt,
} from '@/app/components/workspace-shell/stage-context';
import { stageExcerptUtils } from '@/app/routes/chat-with-ai/lib/stage-excerpt';
import { useTableState } from '@/features/tables';

// Publishes a compact snapshot of the open table — its columns and the first
// rows, with the selected cell/rows marked — up to the Stage, so the chat can
// resolve terse on-screen references against it: "impression is wrong" → the
// Impression column, a bare "adam" → the row whose name is Adam. Without this
// the agent only knows the table's id/name and has to blindly guess or hunt.
// Cleared on unmount; the Stage also clears the excerpt when it closes.
export function useReportTableExcerpt() {
  const stage = useStageOptional();
  const reportStageExcerpt = stage?.reportStageExcerpt;

  const [
    tableName,
    tableId,
    fields,
    records,
    selectedCell,
    selectedRange,
    selectedRecords,
  ] = useTableState((state) => [
    state.table.name,
    state.table.id,
    state.fields,
    state.records,
    state.selectedCell,
    state.selectedRange,
    state.selectedRecords,
  ]);

  const excerpt = useMemo<StageExcerpt | null>(() => {
    if (fields.length === 0) {
      return null;
    }
    return {
      scopeType: 'table',
      scopeId: tableId,
      text: stageExcerptUtils.tableOutline({
        tableName,
        fields,
        records,
        selectedCell,
        selectedRange,
        selectedRecords,
      }),
    };
  }, [
    tableName,
    tableId,
    fields,
    records,
    selectedCell,
    selectedRange,
    selectedRecords,
  ]);

  useEffect(() => {
    reportStageExcerpt?.(excerpt);
  }, [reportStageExcerpt, excerpt]);

  useEffect(() => {
    return () => reportStageExcerpt?.(null);
  }, [reportStageExcerpt]);
}
