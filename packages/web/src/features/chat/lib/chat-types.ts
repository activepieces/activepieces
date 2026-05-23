import { ChatToolName, ChatToolOutputs, isObject } from '@activepieces/shared';
import {
  DynamicToolUIPart,
  getToolName,
  isToolUIPart,
  ToolUIPart,
  UIMessage,
} from 'ai';

export type ChatDataParts = {
  'session-title': { title: string };
};

export type ChatUIMessage = UIMessage<unknown, ChatDataParts>;

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
  'ap_update_plan',
  THINKING_STATUS_TOOL_NAME,
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

export const chatPartUtils = {
  isAnyToolPart,
  getToolPartName,
  isReady,
  isDisplayTool,
  isThinkingStatusTool,
  deriveToolStatus,
  extractToolOutputText,
  extractPieceNames,
  parseToolOutput,
  parseTypedToolOutput,
  HIDDEN_TOOL_NAMES,
  DISPLAY_TOOL_NAMES,
};

export type ThinkingStep =
  | { kind: 'reasoning'; text: string }
  | { kind: 'thinking-status'; text: string; toolPart?: AnyToolPart }
  | { kind: 'tool'; part: AnyToolPart };

export type ToolStatus = 'running' | 'completed' | 'failed' | 'stopped';

export type ToolOutput =
  | { state: 'pending' }
  | { state: 'success'; data: unknown }
  | { state: 'error'; errorText: string };

export type TypedToolOutput<T> =
  | { state: 'pending' }
  | { state: 'success'; data: T }
  | { state: 'error'; errorText: string };
