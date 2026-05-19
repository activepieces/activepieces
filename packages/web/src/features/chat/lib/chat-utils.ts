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

function formatToolName({
  part,
  includeContext = true,
}: {
  part: AnyToolPart;
  includeContext?: boolean;
}): string {
  const raw = chatPartUtils.getToolPartName(part);
  const mcpMatch = /^mcp__[^_]+__(.+)$/.exec(raw);
  const name = mcpMatch ? mcpMatch[1] : raw;
  const baseName = formatUtils.convertEnumToHumanReadable(
    name.replace(/^ap_/, ''),
  );

  if (!includeContext) return baseName;

  const input = isObject(part.input) ? part.input : undefined;
  const context = extractToolContext({ input });
  if (!context) return baseName;
  return `${baseName} — ${context}`;
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
): ChatUIMessage['parts'][number] {
  switch (part.type) {
    case PersistedChatPartType.TEXT:
      return { type: 'text', text: part.text };
    case PersistedChatPartType.REASONING:
      return { type: 'reasoning', text: part.text };
    case PersistedChatPartType.TOOL_CALL:
      if (part.status === PersistedToolCallStatus.COMPLETED) {
        return {
          type: 'dynamic-tool',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          title: part.toolName,
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
        title: part.toolName,
        state: 'output-error',
        input: part.input,
        errorText: part.errorText ?? 'Tool call failed',
      };
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
    parts: msg.parts.map(persistedPartToUIPart),
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
  extractToolContext,
  stripPiecePrefix,
  humanizePieceName,
  mapHistoryToUIMessages,
  extractQuickRepliesFromHistory,
};
