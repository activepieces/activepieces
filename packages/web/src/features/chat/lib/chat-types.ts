import {
  BatchProgressData,
  ChatToolName,
  ChatToolOutputs,
  isObject,
  parseToJsonIfPossible,
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
  'ap_update_brief',
  'ap_load_guide',
  'ap_set_phase',
  'ap_remember',
]);

const DISPLAY_TOOL_NAMES = new Set([
  'ap_show_connection_required',
  'ap_show_connection_picker',
  'ap_show_project_picker',
  'ap_show_questions',
  'ap_show_quick_replies',
]);

function isDisplayTool(name: string): boolean {
  return DISPLAY_TOOL_NAMES.has(name);
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

function extractQuickRepliesFromParts(message: ChatUIMessage | null): string[] {
  if (!message || message.role !== 'assistant') return [];
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const p = message.parts[i];
    if (
      isAnyToolPart(p) &&
      getToolPartName(p) === 'ap_show_quick_replies' &&
      (p.state === 'output-available' || p.state === 'input-available')
    ) {
      const input = p.input as { replies?: string[] } | undefined;
      return input?.replies ?? [];
    }
  }
  return [];
}

export const chatPartUtils = {
  isAnyToolPart,
  getToolPartName,
  getToolCallId,
  isReady,
  isDisplayTool,
  isThinkingStatusTool,
  deriveToolStatus,
  extractToolOutputText,
  extractToolTitles,
  extractPieceNames,
  parseToolOutput,
  parseTypedToolOutput,
  findLastToolPart,
  extractBatchProgressFromOutput,
  extractQuickRepliesFromParts,
  HIDDEN_TOOL_NAMES,
  DISPLAY_TOOL_NAMES,
};

export type ThinkingStep =
  | { kind: 'reasoning'; text: string }
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
