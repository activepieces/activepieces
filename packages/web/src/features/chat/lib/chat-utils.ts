import { isObject } from '@activepieces/core-utils';
import {
  ActionReceiptEvent,
  BuildPlanEvent,
  BuildPlanStep,
  ChatHistoryMessage,
  FileProducedEvent,
  ImageGeneratedEvent,
  PersistedChatMessage,
  PersistedChatPart,
  PersistedChatPartType,
  PersistedToolCallStatus,
} from '@activepieces/shared';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

import {
  AnyToolPart,
  ChatUIMessage,
  EMPTY_QUICK_REPLIES_DATA,
  QuickRepliesData,
  chatPartUtils,
} from './chat-types';

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
  ap_show_mcp_reconnect: {
    active: 'Reconnecting integration',
    done: 'Reconnected integration',
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
  ap_generate_image: { active: 'Generating image', done: 'Generated image' },
  ap_run_code: { active: 'Writing code', done: 'Ran code' },
  ap_web_search: { active: 'Searching the web', done: 'Searched the web' },
  ap_fetch_url: { active: 'Reading the page', done: 'Read the page' },
  ap_scrape_url: { active: 'Reading the page', done: 'Read the page' },
  ap_explore_data: {
    active: 'Exploring your data',
    done: 'Explored your data',
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
    case PersistedChatPartType.SOURCE_URL:
      return {
        type: 'source-url',
        sourceId: part.sourceId,
        url: part.url,
        title: part.title,
      };
    case PersistedChatPartType.SOURCE_DOCUMENT:
      return {
        type: 'source-document',
        sourceId: part.sourceId,
        mediaType: part.mediaType,
        title: part.title,
        filename: part.filename,
      };
    case PersistedChatPartType.BUILD_PLAN:
      return {
        type: 'dynamic-tool',
        toolCallId: `build-plan-${part.buildId}-${idx}`,
        toolName: 'ap_set_build_plan',
        title: 'ap_set_build_plan',
        state: 'output-available',
        input:
          typeof part.data['phase'] === 'string'
            ? { phase: part.data['phase'] }
            : {},
        output: JSON.stringify({ ok: true, buildId: part.buildId }),
      };
    case PersistedChatPartType.BATCH_PROGRESS:
    case PersistedChatPartType.ACTION_RECEIPT:
    case PersistedChatPartType.IMAGE:
    case PersistedChatPartType.FILE:
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

function extractQuickRepliesFromHistory(
  messages: ChatUIMessage[],
): QuickRepliesData {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'assistant') {
    return EMPTY_QUICK_REPLIES_DATA;
  }

  for (let i = lastMessage.parts.length - 1; i >= 0; i--) {
    const p = lastMessage.parts[i];
    if (
      chatPartUtils.isAnyToolPart(p) &&
      chatPartUtils.getToolPartName(p) === 'ap_show_quick_replies'
    ) {
      return chatPartUtils.readQuickRepliesInput(p.input);
    }
  }
  return EMPTY_QUICK_REPLIES_DATA;
}

function formatToolActiveTitle({ part }: { part: AnyToolPart }): string {
  const input = isObject(part.input) ? part.input : undefined;
  if (input && typeof input.activeTitle === 'string' && input.activeTitle) {
    return input.activeTitle;
  }
  const raw = chatPartUtils.getToolPartName(part);
  if (raw.startsWith('mcp__')) {
    return cleanMcpToolName(raw);
  }
  return (
    TOOL_LABELS[raw]?.active ??
    formatUtils.convertEnumToHumanReadable(raw.replace(/^ap_/, ''))
  );
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

function extractImagesFromHistory(
  data: PersistedChatMessage[] | ChatHistoryMessage[],
): Record<string, ImageGeneratedEvent> {
  const images: Record<string, ImageGeneratedEvent> = {};
  if (data.length === 0 || !isPersistedFormat(data)) return images;
  for (const msg of data) {
    for (const part of msg.parts) {
      if (part.type === PersistedChatPartType.IMAGE) {
        const { type: _type, ...rest } = part;
        images[part.toolCallId] = rest;
      }
    }
  }
  return images;
}

function extractFilesFromHistory(
  data: PersistedChatMessage[] | ChatHistoryMessage[],
): Record<string, FileProducedEvent[]> {
  const files: Record<string, FileProducedEvent[]> = {};
  if (data.length === 0 || !isPersistedFormat(data)) return files;
  for (const msg of data) {
    for (const part of msg.parts) {
      if (part.type === PersistedChatPartType.FILE) {
        const { type: _type, ...rest } = part;
        const existing = files[part.toolCallId] ?? [];
        existing.push(rest);
        files[part.toolCallId] = existing;
      }
    }
  }
  return files;
}

function extractBuildsFromHistory(
  data: PersistedChatMessage[] | ChatHistoryMessage[],
): Record<string, BuildPlanEvent> {
  const builds: Record<string, BuildPlanEvent> = {};
  if (data.length === 0) return builds;

  if (isPersistedFormat(data)) {
    for (const msg of data) {
      for (const part of msg.parts) {
        if (part.type !== PersistedChatPartType.BUILD_PLAN) continue;
        const event = toBuildPlanEvent({
          buildId: part.buildId,
          data: part.data,
        });
        if (event && shouldReplaceBuild(builds[event.buildId], event)) {
          builds[event.buildId] = event;
        }
      }
    }
    return builds;
  }

  for (const msg of data) {
    if (msg.role !== 'assistant' || !msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      if (
        tc.title !== 'ap_set_build_plan' ||
        tc.status !== 'completed' ||
        !tc.input
      ) {
        continue;
      }
      const buildId = extractBuildIdFromToolOutput(tc.output);
      if (!buildId) continue;
      const event = toBuildPlanEvent({ buildId, data: tc.input });
      if (event && shouldReplaceBuild(builds[buildId], event)) {
        builds[buildId] = event;
      }
    }
  }
  return builds;
}

const BUILD_PLAN_PHASES: BuildPlanEvent['phase'][] = [
  'detecting',
  'building',
  'testing',
  'done',
  'failed',
];
const BUILD_PLAN_STEP_STATUSES: BuildPlanStep['status'][] = [
  'pending',
  'in_progress',
  'done',
  'failed',
];

function parsePhase(value: unknown): BuildPlanEvent['phase'] | null {
  return BUILD_PLAN_PHASES.find((phase) => phase === value) ?? null;
}

function buildPlanPhaseRank(phase: BuildPlanEvent['phase']): number {
  const idx = BUILD_PLAN_PHASES.indexOf(phase);
  return idx === -1 ? 0 : idx;
}

// A single build emits many plan updates (detecting → building → done), and the
// persisted history can replay them out of order, so we keep the most advanced
// phase rather than the last one seen.
function shouldReplaceBuild(
  existing: BuildPlanEvent | undefined,
  candidate: BuildPlanEvent,
): boolean {
  if (!existing) return true;
  return (
    buildPlanPhaseRank(candidate.phase) >= buildPlanPhaseRank(existing.phase)
  );
}

function extractBuildIdFromToolOutput(
  output: string | undefined,
): string | null {
  if (!output) return null;
  try {
    const parsed: unknown = JSON.parse(output);
    if (isObject(parsed) && typeof parsed['buildId'] === 'string') {
      return parsed['buildId'];
    }
  } catch {
    return null;
  }
  return null;
}

function parseSteps(value: unknown): BuildPlanStep[] | null {
  if (!Array.isArray(value)) return null;
  const steps: BuildPlanStep[] = [];
  for (const item of value) {
    if (!isObject(item)) return null;
    const { id, label, status } = item;
    const validStatus = BUILD_PLAN_STEP_STATUSES.find((s) => s === status);
    if (typeof id !== 'string' || typeof label !== 'string' || !validStatus) {
      return null;
    }
    steps.push({ id, label, status: validStatus });
  }
  return steps;
}

function toBuildPlanEvent({
  buildId,
  data,
}: {
  buildId: string;
  data: Record<string, unknown>;
}): BuildPlanEvent | null {
  const phase = parsePhase(data['phase']);
  const steps = parseSteps(data['steps']);
  if (!phase || !steps) return null;
  return {
    buildId,
    phase,
    steps,
    flowName:
      typeof data['flowName'] === 'string' ? data['flowName'] : undefined,
    tagline: typeof data['tagline'] === 'string' ? data['tagline'] : undefined,
    iconName:
      typeof data['iconName'] === 'string' ? data['iconName'] : undefined,
    flowId: typeof data['flowId'] === 'string' ? data['flowId'] : undefined,
    projectId:
      typeof data['projectId'] === 'string' ? data['projectId'] : undefined,
    updatedAt: typeof data['updatedAt'] === 'string' ? data['updatedAt'] : '',
  };
}

function sanitizeTitle(title: string): string {
  return title.replace(/[*_`~#]/g, '').trim();
}

function formatKbBytes(bytes: number): string {
  if (bytes <= 0) return t('0 KB');
  const kb = bytes / 1024;
  if (kb < 1) return t('<1 KB');
  return t('{kb} KB', { kb: Math.round(kb) });
}

export const chatUtils = {
  newChatEvent: 'ap:new-chat',
  sanitizeTitle,
  formatToolLabel: ({ part }: { part: AnyToolPart }) =>
    formatToolName({ part }),
  formatToolActionName: formatToolActiveTitle,
  formatToolDoneTitle,
  mapHistoryToUIMessages,
  extractQuickRepliesFromHistory,
  extractReceiptsFromHistory,
  extractImagesFromHistory,
  extractFilesFromHistory,
  extractBuildsFromHistory,
  formatKbBytes,
};
