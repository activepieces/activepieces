import { describe, expect, it, vi } from 'vitest';

// i18next must be mocked before importing tool-call-group since it calls t() at module level
vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string, opts?: Record<string, unknown>) => {
    if (!opts) return key;
    return key.replace(/\{(\w+)\}/g, (_: string, k: string) =>
      String(opts[k] ?? `{${k}}`),
    );
  },
}));

// tool-call-card imports React components; mock the whole module to avoid DOM deps
vi.mock('@/features/chat/components/tool-call-card', () => ({
  ToolCallCard: () => null,
  extractToolContext: (tc: { input?: Record<string, unknown> }) => {
    if (!tc.input) return null;
    const parts: string[] = [];
    if (typeof tc.input['pieceName'] === 'string') {
      const raw = (tc.input['pieceName'] as string)
        .replace(/^@activepieces\/piece-/, '')
        .replace(/-/g, '_');
      const words = raw.split(/[_.]/);
      parts.push(
        words
          .map(
            (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
          )
          .join(' '),
      );
    }
    if (typeof tc.input['displayName'] === 'string' && tc.input['displayName']) {
      parts.push(tc.input['displayName'] as string);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  },
}));

// Chain-of-thought components are React; mock them to keep test environment node-only
vi.mock('@/components/prompt-kit/chain-of-thought', () => ({
  ChainOfThought: () => null,
  ChainOfThoughtContent: () => null,
  ChainOfThoughtStep: () => null,
  ChainOfThoughtTrigger: () => null,
}));

import {
  describeToolCalls,
  groupToolCallsByPhase,
  isUtilityTool,
} from '@/app/routes/chat-with-ai/components/tool-call-group';

import type { ToolCallItem } from '@activepieces/shared';

function makeToolCall(
  name: string,
  overrides: Partial<ToolCallItem> = {},
): ToolCallItem {
  return {
    id: `id-${name}`,
    name,
    title: name,
    status: 'completed',
    ...overrides,
  };
}

describe('isUtilityTool', () => {
  it('matches "toolsearch" (exact)', () => {
    expect(isUtilityTool('toolsearch')).toBe(true);
  });

  it('matches "tool_search" (with underscore)', () => {
    expect(isUtilityTool('tool_search')).toBe(true);
  });

  it('matches regardless of case', () => {
    expect(isUtilityTool('ToolSearch')).toBe(true);
    expect(isUtilityTool('TOOL_SEARCH')).toBe(true);
  });

  it('matches when "toolsearch" appears as substring', () => {
    expect(isUtilityTool('ap_toolsearch_v2')).toBe(true);
  });

  it('does not match unrelated tool names', () => {
    expect(isUtilityTool('build_flow')).toBe(false);
    expect(isUtilityTool('add_step')).toBe(false);
    expect(isUtilityTool('list_pieces')).toBe(false);
    expect(isUtilityTool('')).toBe(false);
  });
});

describe('groupToolCallsByPhase', () => {
  it('returns empty array for empty input', () => {
    expect(groupToolCallsByPhase([])).toEqual([]);
  });

  it('returns empty array when all tools are utility tools', () => {
    const tools = [
      makeToolCall('toolsearch'),
      makeToolCall('tool_search'),
    ];
    expect(groupToolCallsByPhase(tools)).toEqual([]);
  });

  it('places 4 or fewer visible tools in a single group', () => {
    const tools = [
      makeToolCall('build_flow'),
      makeToolCall('update_trigger'),
      makeToolCall('add_step'),
      makeToolCall('test_flow'),
    ];
    const result = groupToolCallsByPhase(tools);
    expect(result).toHaveLength(1);
    expect(result[0].tools).toHaveLength(4);
  });

  it('places 1 visible tool in a single group', () => {
    const tools = [makeToolCall('build_flow')];
    const result = groupToolCallsByPhase(tools);
    expect(result).toHaveLength(1);
    expect(result[0].tools).toHaveLength(1);
  });

  it('batches more than 4 visible tools into groups of 4', () => {
    const tools = [
      makeToolCall('build_flow'),
      makeToolCall('update_trigger'),
      makeToolCall('add_step'),
      makeToolCall('test_flow'),
      makeToolCall('list_pieces'),
    ];
    const result = groupToolCallsByPhase(tools);
    // First group has 4, second group has 1
    const totalTools = result.reduce((sum, g) => sum + g.tools.length, 0);
    expect(totalTools).toBe(5);
    expect(result[0].tools).toHaveLength(4);
    expect(result[1].tools).toHaveLength(1);
  });

  it('merges consecutive groups with identical labels', () => {
    // 8 tools with the same action type → all get the same label → merged to 1 group
    const tools = Array.from({ length: 8 }, (_, i) =>
      makeToolCall('add_step', { id: `id-${i}`, name: 'add_step', title: 'add_step' }),
    );
    const result = groupToolCallsByPhase(tools);
    expect(result).toHaveLength(1);
    expect(result[0].tools).toHaveLength(8);
  });

  it('excludes utility tools but keeps non-utility tools', () => {
    const tools = [
      makeToolCall('toolsearch'),
      makeToolCall('build_flow'),
      makeToolCall('tool_search'),
    ];
    const result = groupToolCallsByPhase(tools);
    expect(result).toHaveLength(1);
    expect(result[0].tools).toHaveLength(1);
    expect(result[0].tools[0].name).toBe('build_flow');
  });
});

describe('describeToolCalls', () => {
  it('returns "Working on it" as fallback when no known action matches', () => {
    const tools = [makeToolCall('unknown_action')];
    expect(describeToolCalls(tools)).toBe('Working on it');
  });

  it('returns "Creating the flow" for build_flow without context', () => {
    const tools = [makeToolCall('build_flow')];
    expect(describeToolCalls(tools)).toBe('Creating the flow');
  });

  it('returns "Creating {subject} flow" for build_flow with context', () => {
    const tools = [
      makeToolCall('build_flow', {
        input: { pieceName: '@activepieces/piece-slack' },
      }),
    ];
    const result = describeToolCalls(tools);
    expect(result).toContain('Slack');
    expect(result).toContain('flow');
  });

  it('returns "Setting up the trigger" for update_trigger without context', () => {
    const tools = [makeToolCall('update_trigger')];
    expect(describeToolCalls(tools)).toBe('Setting up the trigger');
  });

  it('returns trigger label with subject when context is available', () => {
    const tools = [
      makeToolCall('update_trigger', {
        input: { displayName: 'Gmail Trigger' },
      }),
    ];
    const result = describeToolCalls(tools);
    expect(result).toContain('trigger');
    expect(result).toContain('Gmail Trigger');
  });

  it('returns "Adding a new step" for add_step without context', () => {
    const tools = [makeToolCall('add_step')];
    expect(describeToolCalls(tools)).toBe('Adding a new step');
  });

  it('returns "Wiring up the steps" for update_step without context', () => {
    const tools = [makeToolCall('update_step')];
    expect(describeToolCalls(tools)).toBe('Wiring up the steps');
  });

  it('returns "Running tests" for test_flow without context', () => {
    const tools = [makeToolCall('test_flow')];
    expect(describeToolCalls(tools)).toBe('Running tests');
  });

  it('returns "Exploring integrations" for list_pieces without context', () => {
    const tools = [makeToolCall('list_pieces')];
    expect(describeToolCalls(tools)).toBe('Exploring integrations');
  });

  it('returns "Checking connections" for list_connections', () => {
    const tools = [makeToolCall('list_connections')];
    expect(describeToolCalls(tools)).toBe('Checking connections');
  });

  it('returns "Reviewing your flows" for list_flows', () => {
    const tools = [makeToolCall('list_flows')];
    expect(describeToolCalls(tools)).toBe('Reviewing your flows');
  });

  it('returns "Querying your data" for list_tables', () => {
    const tools = [makeToolCall('list_tables')];
    expect(describeToolCalls(tools)).toBe('Querying your data');
  });

  it('returns "Publishing the flow" for lock_and_publish', () => {
    const tools = [makeToolCall('lock_and_publish')];
    expect(describeToolCalls(tools)).toBe('Publishing the flow');
  });

  it('returns "Publishing the flow" for change_flow_status', () => {
    const tools = [makeToolCall('change_flow_status')];
    expect(describeToolCalls(tools)).toBe('Publishing the flow');
  });

  it('uses the first tool to determine primary action', () => {
    const tools = [makeToolCall('build_flow'), makeToolCall('add_step')];
    expect(describeToolCalls(tools)).toBe('Creating the flow');
  });

  it('deduplicates context entries', () => {
    const tools = [
      makeToolCall('build_flow', { input: { displayName: 'Slack' } }),
      makeToolCall('add_step', { input: { displayName: 'Slack' } }),
    ];
    const result = describeToolCalls(tools);
    // "Slack" should appear only once
    expect(result.split('Slack').length - 1).toBe(1);
  });
});
