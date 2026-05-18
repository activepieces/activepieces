import { ChatToolName, ChatToolOutputs } from '@activepieces/shared';
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

const HIDDEN_TOOL_NAMES = new Set([
  'ap_set_session_title',
  'ap_select_project',
  'ap_deselect_project',
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

export const chatPartUtils = {
  isAnyToolPart,
  getToolPartName,
  isReady,
  isDisplayTool,
  parseToolOutput,
  parseTypedToolOutput,
  HIDDEN_TOOL_NAMES,
  DISPLAY_TOOL_NAMES,
};

export type ToolOutput =
  | { state: 'pending' }
  | { state: 'success'; data: unknown }
  | { state: 'error'; errorText: string };

export type TypedToolOutput<T> =
  | { state: 'pending' }
  | { state: 'success'; data: T }
  | { state: 'error'; errorText: string };
