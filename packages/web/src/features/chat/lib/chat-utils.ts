import {
  ActionReceiptEvent,
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

const TOOL_LABELS: Record<string, { active: string; done: string }> = {
  ap_execute_action: { active: 'Running action', done: 'Ran action' },
  ap_discover_action_auth: {
    active: 'Checking connections',
    done: 'Checked connections',
  },
  ap_list_across_projects: {
    active: 'Listing resources',
    done: 'Listed resources',
  },
  ap_research_pieces: {
    active: 'Searching integrations',
    done: 'Searched integrations',
  },
  ap_build_flow: { active: 'Building automation', done: 'Built automation' },
  ap_create_flow: { active: 'Creating automation', done: 'Created automation' },
  ap_validate_step_config: {
    active: 'Validating setup',
    done: 'Validated setup',
  },
  ap_validate_flow: {
    active: 'Validating automation',
    done: 'Validated automation',
  },
  ap_test_flow: { active: 'Testing automation', done: 'Tested automation' },
  ap_add_step: { active: 'Adding step', done: 'Added step' },
  ap_update_step: { active: 'Updating step', done: 'Updated step' },
  ap_update_trigger: {
    active: 'Updating starting event',
    done: 'Updated starting event',
  },
  ap_manage_notes: { active: 'Adding notes', done: 'Added notes' },
  ap_list_connections: {
    active: 'Checking connections',
    done: 'Checked connections',
  },
  ap_get_piece_props: { active: 'Loading settings', done: 'Loaded settings' },
  ap_resolve_property_options: {
    active: 'Loading options',
    done: 'Loaded options',
  },
  ap_resolve_property_chain: {
    active: 'Loading field options',
    done: 'Loaded field options',
  },
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
    TOOL_LABELS[raw]?.active ??
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
    case PersistedChatPartType.ACTION_RECEIPT:
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

function formatToolDoneTitle({ part }: { part: AnyToolPart }): string {
  const input = isObject(part.input) ? part.input : undefined;
  if (input && typeof input.doneTitle === 'string' && input.doneTitle) {
    return input.doneTitle;
  }
  const raw = chatPartUtils.getToolPartName(part);
  if (raw.startsWith('mcp__')) {
    return cleanMcpToolName(raw);
  }
  return (
    TOOL_LABELS[raw]?.done ??
    formatUtils.convertEnumToHumanReadable(raw.replace(/^ap_/, ''))
  );
}

function extractReceiptsFromHistory(
  data: PersistedChatMessage[] | ChatHistoryMessage[],
): Record<string, ActionReceiptEvent> {
  const receipts: Record<string, ActionReceiptEvent> = {};
  if (data.length === 0 || !isPersistedFormat(data)) return receipts;
  for (const msg of data) {
    for (const part of msg.parts) {
      if (part.type === PersistedChatPartType.ACTION_RECEIPT) {
        const { type: _, output, ...rest } = part;
        receipts[part.toolCallId] = { ...rest, output: output ?? null };
      }
    }
  }
  return receipts;
}

export const chatUtils = {
  formatToolLabel: ({ part }: { part: AnyToolPart }) =>
    formatToolName({ part }),
  formatToolActionName: ({ part }: { part: AnyToolPart }) =>
    formatToolName({ part, includeContext: false }),
  formatToolDoneTitle,
  mapHistoryToUIMessages,
  extractQuickRepliesFromHistory,
  extractReceiptsFromHistory,
};
