import { isObject } from '@activepieces/shared';

import { formatUtils } from '@/lib/format-utils';

import { DynamicToolPart } from './chat-types';

function stripPiecePrefix(name: string): string {
  return name.replace(/^@activepieces\/piece-/, '');
}

function humanizePieceName(raw: string): string {
  return formatUtils.convertEnumToHumanReadable(
    stripPiecePrefix(raw).replace(/-/g, '_'),
  );
}

const BUILD_TOOL_NAMES = new Set([
  'ap_create_flow',
  'ap_build_flow',
  'ap_update_trigger',
  'ap_add_step',
  'ap_update_step',
  'ap_validate_step_config',
  'ap_validate_flow',
]);

function formatToolName({
  part,
  includeContext = true,
}: {
  part: DynamicToolPart;
  includeContext?: boolean;
}): string {
  const raw = part.title ?? part.toolName;
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

export const chatUtils = {
  formatToolLabel: ({ part }: { part: DynamicToolPart }) =>
    formatToolName({ part }),
  formatToolActionName: ({ part }: { part: DynamicToolPart }) =>
    formatToolName({ part, includeContext: false }),
  extractToolContext,
  stripPiecePrefix,
  humanizePieceName,
  BUILD_TOOL_NAMES,
};
