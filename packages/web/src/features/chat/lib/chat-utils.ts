import {
  ChatHistoryMessage,
  isObject,
  PersistedChatMessage,
  PersistedChatPart,
  PersistedChatPartType,
  PersistedToolCallStatus,
} from '@activepieces/shared';

import { formatUtils } from '@/lib/format-utils';

import { AnyToolPart, ChatUIMessage, chatPartUtils } from './chat-types';

function stripPiecePrefix(name: string): string {
  return name.replace(/^@activepieces\/piece-/, '');
}

function humanizePieceName(raw: string): string {
  return formatUtils.convertEnumToHumanReadable(
    stripPiecePrefix(raw).replace(/-/g, '_'),
  );
}

const TOOL_FALLBACK_LABELS: Record<string, string> = {
  ap_execute_action: 'Running Action',
  ap_discover_action_auth: 'Checking Connections',
  ap_list_across_projects: 'Listing Resources',
  ap_request_plan_approval: 'Requesting Approval',
};

function cleanMcpToolName(raw: string): string {
  const mcpMatch = /^mcp__[^_]+__(.+)$/.exec(raw);
  if (!mcpMatch) return raw;
  return formatUtils.convertEnumToHumanReadable(mcpMatch[1]);
}

function formatToolName({
  part,
  includeContext = true,
}: {
  part: AnyToolPart;
  includeContext?: boolean;
}): string {
  const input = isObject(part.input) ? part.input : undefined;

  if (input && typeof input.title === 'string' && input.title) {
    return input.title;
  }

  const raw = chatPartUtils.getToolPartName(part);

  if (raw.startsWith('mcp__')) {
    return cleanMcpToolName(raw);
  }

  const baseName =
    TOOL_FALLBACK_LABELS[raw] ??
    formatUtils.convertEnumToHumanReadable(raw.replace(/^ap_/, ''));

  if (!includeContext) return baseName;
  const context = extractToolContext({ input });
  return context ? `${baseName} — ${context}` : baseName;
}

function extractToolContext({
  input,
}: {
  input: Record<string, unknown> | undefined;
}): string | null {
  if (!input) return null;
  const parts: string[] = [];

  if (typeof input.pieceName === 'string') {
    parts.push(humanizePieceName(input.pieceName));
  }
  if (typeof input.actionName === 'string' && input.actionName) {
    parts.push(formatUtils.convertEnumToHumanReadable(input.actionName));
  } else if (typeof input.displayName === 'string' && input.displayName) {
    parts.push(input.displayName);
  }
  if (typeof input.triggerName === 'string' && input.triggerName) {
    parts.push(formatUtils.convertEnumToHumanReadable(input.triggerName));
  }
  if (typeof input.flowId === 'string' && parts.length === 0) {
    parts.push(input.flowId.slice(0, 8));
  }
  if (typeof input.query === 'string' && parts.length === 0) {
    parts.push(
      `"${input.query.slice(0, 30)}${input.query.length > 30 ? '…' : ''}"`,
    );
  }
  if (
    isObject(input.settings) &&
    typeof input.settings.pieceName === 'string' &&
    parts.length === 0
  ) {
    parts.push(humanizePieceName(input.settings.pieceName));
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

function historyMsgToParts(msg: ChatHistoryMessage): ChatUIMessage['parts'] {
  const parts: ChatUIMessage['parts'] = [];
  if (msg.thoughts) {
    parts.push({ type: 'reasoning', text: msg.thoughts });
  }
  if (msg.content) {
    parts.push({ type: 'text', text: msg.content });
  }
  if (msg.toolCalls) {
    for (const tc of msg.toolCalls) {
      if (tc.status === 'completed') {
        parts.push({
          type: 'dynamic-tool',
          toolCallId: tc.toolCallId,
          toolName: tc.title,
          title: tc.title,
          state: 'output-available',
          input: tc.input ?? {},
          output: tc.output,
        });
      } else {
        parts.push({
          type: 'dynamic-tool',
          toolCallId: tc.toolCallId,
          toolName: tc.title,
          title: tc.title,
          state: 'output-error',
          input: tc.input ?? {},
          errorText:
            typeof tc.output === 'string' ? tc.output : 'Tool call failed',
        });
      }
    }
  }
  return parts;
}

function isPersistedFormat(data: unknown[]): data is PersistedChatMessage[] {
  if (data.length === 0) return false;
  const first = data[0] as Record<string, unknown>;
  return Array.isArray(first.parts) && !('content' in first);
}

function persistedPartToUIPart(
  part: PersistedChatPart,
  idx: number,
): ChatUIMessage['parts'][number] {
  switch (part.type) {
    case PersistedChatPartType.TEXT:
      return { type: 'text', text: part.text };
    case PersistedChatPartType.REASONING:
      return { type: 'reasoning', text: part.text };
    case PersistedChatPartType.THINKING_STATUS:
      return {
        type: 'dynamic-tool',
        toolCallId: `thinking-status-${idx}`,
        toolName: 'ap_update_thinking_status',
        title: 'ap_update_thinking_status',
        state: 'output-available' as const,
        input: { status: part.text },
        output: JSON.stringify({ success: true }),
      };
    case PersistedChatPartType.TOOL_CALL: {
      const toolTitle = part.title ?? part.toolName;
      if (part.status === PersistedToolCallStatus.COMPLETED) {
        return {
          type: 'dynamic-tool',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          title: toolTitle,
          state: 'output-available',
          input: part.input,
          output:
            typeof part.output === 'string'
              ? part.output
              : JSON.stringify(part.output),
        };
      }
      return {
        type: 'dynamic-tool',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        title: toolTitle,
        state: 'output-error',
        input: part.input,
        errorText: part.errorText ?? 'Tool call failed',
      };
    }
    case PersistedChatPartType.BATCH_PROGRESS:
      return { type: 'text', text: '' } as ChatUIMessage['parts'][number];
    default: {
      const _exhaustive: never = part;
      throw new Error(
        `Unknown persisted part type: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

function mapPersistedToUIMessages(
  data: PersistedChatMessage[],
): ChatUIMessage[] {
  return data.map((msg, idx) => ({
    id: `hist-${idx}`,
    role: msg.role,
    parts: msg.parts.map((p, i) => persistedPartToUIPart(p, i)),
    ...(msg.thinkingDurationMs !== undefined && {
      thinkingDurationMs: msg.thinkingDurationMs,
    }),
  }));
}

function mapHistoryToUIMessages(
  data: PersistedChatMessage[] | ChatHistoryMessage[],
): ChatUIMessage[] {
  if (data.length === 0) return [];
  if (isPersistedFormat(data)) {
    return mapPersistedToUIMessages(data);
  }

  const legacyData = data as ChatHistoryMessage[];
  const result: ChatUIMessage[] = [];
  for (let i = 0; i < legacyData.length; i++) {
    const msg = legacyData[i];
    const parts = historyMsgToParts(msg);
    const lastResult = result[result.length - 1];
    if (msg.role === 'assistant' && lastResult?.role === 'assistant') {
      lastResult.parts.push(...parts);
    } else {
      result.push({ id: `hist-${i}`, role: msg.role, parts });
    }
  }
  return result;
}

function extractQuickRepliesFromHistory(messages: ChatUIMessage[]): string[] {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'assistant') return [];

  for (let i = lastMessage.parts.length - 1; i >= 0; i--) {
    const p = lastMessage.parts[i];
    if (
      chatPartUtils.isAnyToolPart(p) &&
      chatPartUtils.getToolPartName(p) === 'ap_show_quick_replies'
    ) {
      const input = p.input as { replies?: string[] } | undefined;
      if (input?.replies) {
        return input.replies;
      }
    }
  }
  return [];
}

export const chatUtils = {
  formatToolLabel: ({ part }: { part: AnyToolPart }) =>
    formatToolName({ part }),
  formatToolActionName: ({ part }: { part: AnyToolPart }) =>
    formatToolName({ part, includeContext: false }),
  mapHistoryToUIMessages,
  extractQuickRepliesFromHistory,
};
