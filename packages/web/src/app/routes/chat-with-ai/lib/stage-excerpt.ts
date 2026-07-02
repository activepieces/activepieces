import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import type { FlowVersion, Step } from '@activepieces/shared';

import type { ClientField, ClientRecordData } from '@/features/tables';

const MAX_STEPS = 30;
const MAX_CHARS = 1500;
const MAX_TABLE_ROWS = 15;
const MAX_TABLE_CHARS = 2000;
const CELL_PREVIEW_MAX = 60;
const STEP_DETAIL_MAX_CHARS = 800;
const STEP_INPUT_PREVIEW_MAX = 100;
const MAX_STEP_INPUTS = 12;
const MAX_OBJECT_KEYS = 5;

function pieceShortName(pieceName: string): string {
  return pieceName.replace('@activepieces/piece-', '');
}

// A compact, one-line preview of a single input value. Long strings are
// truncated and containers are summarized (not expanded) so a "big" step —
// many inputs, long text/content — stays small in the prompt.
function inputValuePreview(value: unknown): string {
  if (isNil(value) || value === '') {
    return '(empty)';
  }
  if (typeof value === 'string') {
    return value.length > STEP_INPUT_PREVIEW_MAX
      ? `${value.slice(0, STEP_INPUT_PREVIEW_MAX)}…`
      : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    const shown = keys.slice(0, MAX_OBJECT_KEYS).join(', ');
    return `{${shown}${keys.length > MAX_OBJECT_KEYS ? ', …' : ''}}`;
  }
  return String(value);
}

function inputLines(input: Record<string, unknown> | undefined): string[] {
  if (isNil(input)) {
    return [];
  }
  const entries = Object.entries(input);
  if (entries.length === 0) {
    return [];
  }
  const shown = entries.slice(0, MAX_STEP_INPUTS);
  const lines = shown.map(
    ([key, value]) => `  - ${key}: ${inputValuePreview(value)}`,
  );
  if (entries.length > shown.length) {
    lines.push(`  (+${entries.length - shown.length} more inputs)`);
  }
  return lines;
}

// A short, clean snapshot of the selected step's configuration so the agent
// knows what's inside it (and what to change) without first calling
// ap_flow_structure. Mirrors the shape of the backend formatStepSettings.
function selectedStepDetail(step: Step): string {
  const statusHint = step.valid ? '' : ' — needs setup';
  const header = `Selected step "${step.displayName}"${statusHint}:`;
  const lines: string[] = [header];
  switch (step.type) {
    case FlowTriggerType.PIECE:
    case FlowActionType.PIECE: {
      const { pieceName, input } = step.settings;
      const actionName =
        step.type === FlowActionType.PIECE
          ? step.settings.actionName
          : step.settings.triggerName;
      lines.push(
        `  piece: ${pieceShortName(pieceName)} · action: ${
          actionName ?? 'not set'
        }`,
      );
      lines.push(...inputLines(input));
      break;
    }
    case FlowActionType.CODE: {
      const code = step.settings.sourceCode?.code ?? '';
      const lineCount = code === '' ? 0 : code.split('\n').length;
      lines.push(`  code (${lineCount} line${lineCount === 1 ? '' : 's'})`);
      const firstLine = code.split('\n').find((l) => l.trim() !== '');
      if (firstLine) {
        lines.push(`  first line: ${inputValuePreview(firstLine)}`);
      }
      lines.push(...inputLines(step.settings.input));
      break;
    }
    case FlowActionType.LOOP_ON_ITEMS:
      lines.push(`  loop over: ${inputValuePreview(step.settings.items)}`);
      break;
    case FlowActionType.ROUTER: {
      const count = step.settings.branches?.length ?? 0;
      lines.push(`  router · ${count} branch${count === 1 ? '' : 'es'}`);
      break;
    }
    case FlowTriggerType.EMPTY:
      lines.push('  (no trigger configured)');
      break;
    default:
      break;
  }
  const detail = lines.join('\n');
  return detail.length > STEP_DETAIL_MAX_CHARS
    ? `${detail.slice(0, STEP_DETAIL_MAX_CHARS)}\n(truncated)`
    : detail;
}

function stepLine(step: Step): string {
  const { displayName } = step;
  switch (step.type) {
    case FlowTriggerType.PIECE:
      return `Trigger: ${displayName} (${pieceShortName(
        step.settings.pieceName,
      )})`;
    case FlowTriggerType.EMPTY:
      return `Trigger: ${displayName}`;
    case FlowActionType.LOOP_ON_ITEMS:
      return `Loop: ${displayName}`;
    case FlowActionType.ROUTER:
      return `Router: ${displayName}`;
    case FlowActionType.CODE:
      return `Code: ${displayName}`;
    case FlowActionType.PIECE:
      return `Action: ${displayName} (${pieceShortName(
        step.settings.pieceName,
      )})`;
    default:
      return displayName;
  }
}

function flowOutline(
  flowVersion: FlowVersion,
  options?: { selectedStepName?: string },
): string {
  const selectedStepName = options?.selectedStepName;
  const steps = flowStructureUtil.getAllSteps(flowVersion.trigger);
  const shown = steps.slice(0, MAX_STEPS);
  const lines = shown.map((step, index) => {
    const marker = step.name === selectedStepName ? '  ← selected' : '';
    return `${index + 1}. ${stepLine(step)}${marker}`;
  });
  if (steps.length > shown.length) {
    lines.push(`(+${steps.length - shown.length} more steps)`);
  }
  const outlineRaw = lines.join('\n');
  const outline =
    outlineRaw.length > MAX_CHARS
      ? `${outlineRaw.slice(0, MAX_CHARS)}\n(truncated)`
      : outlineRaw;
  const selectedStep = selectedStepName
    ? steps.find((step) => step.name === selectedStepName)
    : undefined;
  return selectedStep
    ? `${outline}\n\n${selectedStepDetail(selectedStep)}`
    : outline;
}

function pieceShort(pieceName: string | undefined): string {
  return pieceName ? pieceName.replace('@activepieces/piece-', '') : 'unknown';
}

function connectionsOutline({
  connections,
  total,
}: {
  connections: ConnectionExcerptRow[];
  total: number;
}): string {
  const shown = connections.slice(0, MAX_STEPS);
  const header =
    `Connections page — ${total} connection${total === 1 ? '' : 's'}` +
    (total > shown.length ? ` (showing first ${shown.length})` : '') +
    `. Columns: Name · App · Status · Flows (how many automations use it).`;
  const lines = shown.map((c, index) => {
    const flows = c.flowCount ?? 0;
    return `${index + 1}. ${c.displayName} — ${pieceShort(c.pieceName)} — ${
      c.status
    } — ${flows} flow${flows === 1 ? '' : 's'}`;
  });
  const outline = [header, ...lines].join('\n');
  return outline.length > MAX_CHARS
    ? `${outline.slice(0, MAX_CHARS)}\n(truncated)`
    : outline;
}

function cellPreview(value: unknown): string {
  if (isNil(value) || value === '') {
    return '(empty)';
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > CELL_PREVIEW_MAX
    ? `${text.slice(0, CELL_PREVIEW_MAX)}…`
    : text;
}

function tableOutline({
  tableName,
  fields,
  records,
  selectedCell,
  selectedRange,
  selectedRecords,
}: {
  tableName: string;
  fields: ClientField[];
  records: ClientRecordData[];
  selectedCell: { rowIdx: number; columnIdx: number } | null;
  selectedRange?: { x: number; y: number; x1: number; y1: number } | null;
  selectedRecords: ReadonlySet<string>;
}): string {
  const columnList = fields.map((field) => field.name).join(' · ');
  const header =
    `Table "${tableName}" — ${records.length} row${
      records.length === 1 ? '' : 's'
    }. Columns: ${columnList || '(none)'}.` +
    ` Each row below reads "N. [id …] col=val …"; the bracketed id is that row's record id and is the authoritative way to address the row — pass those ids straight to ap_update_records / ap_delete_records, no need to re-fetch with ap_find_records.`;
  // The grid's leading column (idx 0) is the row-select checkbox, so data field
  // N sits at grid columnIdx N+1 (see use-report-table-focus.ts). Range coords
  // are already 0-based over data fields (no checkbox offset).
  const selectedFieldIndex = selectedCell ? selectedCell.columnIdx - 1 : -1;
  const range = selectedRange
    ? {
        rowStart: Math.min(selectedRange.y, selectedRange.y1),
        rowEnd: Math.max(selectedRange.y, selectedRange.y1),
        colStart: Math.min(selectedRange.x, selectedRange.x1),
        colEnd: Math.max(selectedRange.x, selectedRange.x1),
      }
    : null;
  const rangeColumnNames = range
    ? fields
        .slice(range.colStart, range.colEnd + 1)
        .map((field) => field?.name)
        .filter((name): name is string => !isNil(name))
        .join(', ')
    : '';
  const shown = records.slice(0, MAX_TABLE_ROWS);
  const lines = shown.map((record, index) => {
    const cells = fields.map((field, fieldIndex) => {
      const value = record.values.find(
        (cell) => cell.fieldIndex === fieldIndex,
      )?.value;
      return `${field.name}=${cellPreview(value)}`;
    });
    const isInRange =
      !isNil(range) && index >= range.rowStart && index <= range.rowEnd;
    const isSelectedRow =
      selectedCell?.rowIdx === index ||
      (!isNil(record.recordId) && selectedRecords.has(record.recordId));
    const selectedColumnName =
      selectedFieldIndex >= 0
        ? fields[selectedFieldIndex]?.name ?? `column ${selectedFieldIndex + 1}`
        : undefined;
    const marker = isInRange
      ? `  ← selected (range: ${rangeColumnNames || 'cells'})`
      : isSelectedRow
      ? selectedCell && selectedColumnName
        ? `  ← selected (${selectedColumnName})`
        : '  ← selected'
      : '';
    const idTag = record.recordId ? `[id ${record.recordId}] ` : '';
    return `${index + 1}. ${idTag}${cells.join(' · ')}${marker}`;
  });
  if (records.length > shown.length) {
    lines.push(`(+${records.length - shown.length} more rows)`);
  }
  const outline = [header, ...lines].join('\n');
  return outline.length > MAX_TABLE_CHARS
    ? `${outline.slice(0, MAX_TABLE_CHARS)}\n(truncated)`
    : outline;
}

export const stageExcerptUtils = {
  flowOutline,
  connectionsOutline,
  tableOutline,
};

export type ConnectionExcerptRow = {
  displayName: string;
  pieceName?: string;
  status: string;
  flowCount?: number;
};
