import { isObject, parseToJsonIfPossible } from '@activepieces/core-utils';
import {
  BatchProgressData,
  ChatContextCompression,
  ChatToolName,
  ChatToolOutputs,
  chatPersistenceUtils,
  chatToolClassification,
} from '@activepieces/shared';
import {
  DynamicToolUIPart,
  getToolName,
  isToolUIPart,
  ToolUIPart,
  UIMessage,
} from 'ai';

export type ChatUIMessage = UIMessage;

export type AnyToolPart = ToolUIPart | DynamicToolUIPart;

function isAnyToolPart(p: ChatUIMessage['parts'][number]): p is AnyToolPart {
  return isToolUIPart(p);
}

function getToolPartName(part: AnyToolPart): string {
  try {
    return getToolName(part);
  } catch {
    const name = (part as Record<string, unknown>).toolName;
    return typeof name === 'string' ? name : 'unknown';
  }
}

function isReady(part: AnyToolPart): boolean {
  return part.state !== 'input-streaming' && part.input !== undefined;
}

const THINKING_STATUS_TOOL_NAME = 'ap_update_thinking_status';

const HIDDEN_TOOL_NAMES = new Set([
  'ap_select_project',
  'ap_deselect_project',
  'ap_load_guide',
  'ap_set_phase',
]);

const DISPLAY_TOOL_NAMES = new Set([
  'ap_show_connection_required',
  'ap_show_mcp_reconnect',
  'ap_show_connection_picker',
  'ap_show_project_picker',
  'ap_show_questions',
  'ap_show_quick_replies',
]);

function isDisplayTool(name: string): boolean {
  return DISPLAY_TOOL_NAMES.has(name);
}

// Tools whose result renders as a rich card AND that block on server-side
// execution, leaving a visible gap before the card appears. We render a
// shape-matched skeleton for these during that gap. Deliberately excludes:
// ap_run_code (its CodeRecipeReveal already fills the gap and it often produces
// no card), display tools (interactive, render instantly from input), and
// flow builds (stream progressively).
function getPendingCardKind(name: string): PendingCardKind | null {
  if (name === 'ap_execute_action') return 'action-receipt';
  if (name === 'ap_generate_image') return 'image';
  return null;
}

// A read-only ap_execute_action (read-verb action, or safe-method custom_api_call
// HTTP GET) is a lookup, not an outcome — it folds into the thinking accordion as a
// step and earns no card or skeleton. Mirrors the backend, which skips the receipt
// event for the same calls. Writes/outcomes still produce a card.
function isReadOnlyExecuteAction(part: AnyToolPart): boolean {
  if (getToolPartName(part) !== 'ap_execute_action') return false;
  const input = isObject(part.input) ? part.input : undefined;
  const actionName =
    input && typeof input.actionName === 'string'
      ? input.actionName
      : undefined;
  if (!actionName) return false;
  const actionInput = isObject(input?.input) ? input.input : undefined;
  return chatToolClassification.isReadOnlyActionCall({
    actionName,
    input: actionInput,
  });
}

function parseToolOutput(part: AnyToolPart): ToolOutput {
  if (part.state === 'output-error') {
    return {
      state: 'error',
      errorText:
        'errorText' in part && typeof part.errorText === 'string'
          ? part.errorText
          : 'Tool call failed',
    };
  }
  if (part.state !== 'output-available' || part.output == null) {
    return { state: 'pending' };
  }
  const raw = part.output;
  const parsed =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        })()
      : raw;
  return { state: 'success', data: parsed };
}

function parseTypedToolOutput<T extends ChatToolName>(
  part: AnyToolPart,
  _toolName: T,
): TypedToolOutput<ChatToolOutputs[T]> {
  return parseToolOutput(part) as TypedToolOutput<ChatToolOutputs[T]>;
}

// The "Context compression" metadata the worker rides on a reduced tool result's
// structuredContent. Code Mode (ap_run_tools) already shows its own savings line on
// its card, so it never double-badges here.
function extractContextCompression(
  part: AnyToolPart,
): ChatContextCompression | null {
  if (getToolPartName(part) === 'ap_run_tools') return null;
  const parsed = parseToolOutput(part);
  if (parsed.state !== 'success' || !isObject(parsed.data)) return null;
  const structured = (parsed.data as { structuredContent?: unknown })
    .structuredContent;
  return chatPersistenceUtils.readContextCompression(structured);
}

function isThinkingStatusTool(name: string): boolean {
  return name === THINKING_STATUS_TOOL_NAME;
}

function deriveToolStatus(part: AnyToolPart): ToolStatus {
  if (part.state === 'output-available') return 'completed';
  if (part.state === 'output-error') return 'failed';
  if (part.state === 'output-denied') return 'stopped';
  return 'running';
}

function extractToolOutputText(part: AnyToolPart): string | undefined {
  if (part.state === 'output-available' && part.output !== undefined) {
    return typeof part.output === 'string'
      ? part.output
      : JSON.stringify(part.output);
  }
  if (part.state === 'output-error' && part.errorText) {
    return part.errorText;
  }
  return undefined;
}

function normalizePieceName(name: string): string {
  if (name.startsWith('@')) return name;
  const stripped = name.startsWith('piece-')
    ? name.slice('piece-'.length)
    : name;
  return `@activepieces/piece-${stripped.replace(/_/g, '-')}`;
}

function extractPieceNames(
  input: Record<string, unknown> | undefined,
): string[] {
  if (!input) return [];
  const names: string[] = [];
  if (typeof input.pieceName === 'string') {
    names.push(input.pieceName);
  }
  if (Array.isArray(input.pieceNames)) {
    for (const n of input.pieceNames) {
      if (typeof n === 'string') names.push(n);
    }
  }
  if (
    isObject(input.settings) &&
    typeof input.settings.pieceName === 'string'
  ) {
    names.push(input.settings.pieceName);
  }
  return names.map(normalizePieceName);
}

function getToolCallId(part: AnyToolPart): string {
  return 'toolCallId' in part ? (part.toolCallId as string) : '';
}

function findLastToolPart({
  message,
  predicate,
}: {
  message: ChatUIMessage | undefined;
  predicate: (name: string, part: AnyToolPart) => boolean;
}): AnyToolPart | null {
  if (!message || message.role !== 'assistant') return null;
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const p = message.parts[i];
    if (!isAnyToolPart(p)) continue;
    if (predicate(getToolPartName(p), p)) return p;
  }
  return null;
}

function extractBatchProgressFromOutput(
  part: AnyToolPart,
): BatchProgressData | null {
  if (part.state !== 'output-available' || !part.output) return null;
  const output = parseToJsonIfPossible(part.output);
  if (!output || typeof output !== 'object') return null;
  const record = output as Record<string, unknown>;
  if (!record['batchProgress']) return null;
  return record['batchProgress'] as BatchProgressData;
}

function extractBuildIdFromOutput(part: AnyToolPart): string | null {
  if (part.state !== 'output-available' || !part.output) return null;
  const output = parseToJsonIfPossible(part.output);
  if (!output || typeof output !== 'object') return null;
  const buildId = (output as Record<string, unknown>)['buildId'];
  return typeof buildId === 'string' ? buildId : null;
}

function extractBuildPhaseFromInput(part: AnyToolPart): string | undefined {
  const input = isObject(part.input) ? part.input : undefined;
  return typeof input?.phase === 'string' ? input.phase : undefined;
}

function extractToolTitles(part: AnyToolPart): {
  title: string;
  activeTitle: string | undefined;
  doneTitle: string | undefined;
} {
  const input = isObject(part.input) ? part.input : undefined;
  const title =
    input && typeof input.title === 'string' && input.title
      ? input.title
      : getToolPartName(part);
  const activeTitle =
    input && typeof input.activeTitle === 'string'
      ? input.activeTitle
      : undefined;
  const doneTitle =
    input && typeof input.doneTitle === 'string' ? input.doneTitle : undefined;
  return { title, activeTitle, doneTitle };
}

function readQuickRepliesInput(input: unknown): QuickRepliesData {
  const typed = input as
    | { replies?: string[]; offerRecurringAutomation?: boolean }
    | undefined;
  return {
    replies: typed?.replies ?? [],
    offerRecurringAutomation: typed?.offerRecurringAutomation === true,
  };
}

function extractQuickRepliesFromParts(
  message: ChatUIMessage | null,
): QuickRepliesData {
  if (!message || message.role !== 'assistant') return EMPTY_QUICK_REPLIES_DATA;
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const p = message.parts[i];
    if (
      isAnyToolPart(p) &&
      getToolPartName(p) === 'ap_show_quick_replies' &&
      (p.state === 'output-available' || p.state === 'input-available')
    ) {
      return readQuickRepliesInput(p.input);
    }
  }
  return EMPTY_QUICK_REPLIES_DATA;
}

export const chatPartUtils = {
  isAnyToolPart,
  getToolPartName,
  getToolCallId,
  isReady,
  isDisplayTool,
  getPendingCardKind,
  isReadOnlyExecuteAction,
  isThinkingStatusTool,
  deriveToolStatus,
  extractToolOutputText,
  extractToolTitles,
  extractPieceNames,
  extractContextCompression,
  parseToolOutput,
  parseTypedToolOutput,
  findLastToolPart,
  extractBatchProgressFromOutput,
  extractBuildIdFromOutput,
  extractBuildPhaseFromInput,
  extractQuickRepliesFromParts,
  readQuickRepliesInput,
  HIDDEN_TOOL_NAMES,
  DISPLAY_TOOL_NAMES,
};

export type PendingCardKind = 'action-receipt' | 'image';

export type CardSkeletonPhase = 'pending' | 'failed';

export type ThinkingStep =
  | { kind: 'thinking-status'; text: string }
  | { kind: 'tool'; part: AnyToolPart; description: string | null };

export type ToolStatus = 'running' | 'completed' | 'failed' | 'stopped';

export type ToolOutput =
  | { state: 'pending' }
  | { state: 'success'; data: unknown }
  | { state: 'error'; errorText: string };

export type TypedToolOutput<T> =
  | { state: 'pending' }
  | { state: 'success'; data: T }
  | { state: 'error'; errorText: string };

export type CreditsWarning = {
  percentage: number;
};

export type QuickRepliesData = {
  replies: string[];
  offerRecurringAutomation: boolean;
};

export const EMPTY_QUICK_REPLIES_DATA: QuickRepliesData = {
  replies: [],
  offerRecurringAutomation: false,
};
