import { describe, expect, it } from 'vitest';

import {
  buildMessageBlocks,
  getLastThinkingSegment,
  MessageBlock,
} from '@/app/routes/chat-with-ai/lib/message-blocks';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import {
  AnyToolPart,
  ChatUIMessage,
  ThinkingStep,
} from '@/features/chat/lib/chat-types';

type Part = ChatUIMessage['parts'][number];

function tool({
  name,
  id = 'tc',
  input = {},
  output,
  state = 'output-available',
}: {
  name: string;
  id?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state?: AnyToolPart['state'];
}): AnyToolPart {
  const base = {
    type: 'dynamic-tool' as const,
    toolName: name,
    toolCallId: id,
    input,
  };
  switch (state) {
    case 'output-available':
      return { ...base, state, output };
    case 'output-error':
      return {
        ...base,
        state,
        errorText: typeof output === 'string' ? output : '',
      };
    case 'approval-requested':
      return { ...base, state, approval: { id } };
    case 'approval-responded':
      return { ...base, state, approval: { id, approved: true } };
    case 'output-denied':
      return { ...base, state, approval: { id, approved: false } };
    default:
      return { ...base, state };
  }
}

function status(text: string, id = 'st'): AnyToolPart {
  return tool({
    name: 'ap_update_thinking_status',
    id,
    input: { status: text },
  });
}

function reasoning(text: string): Part {
  return { type: 'reasoning', text };
}

function text(value: string): Part {
  return { type: 'text', text: value };
}

function kinds(
  parts: Part[],
  opts?: Partial<Parameters<typeof buildMessageBlocks>[0]>,
) {
  return buildMessageBlocks({
    parts,
    isStreaming: false,
    toolCallMeta: {},
    claimedBuildIds: new Set(),
    ...opts,
  }).blocks.map((b) => b.kind);
}

const receiptMeta = (id: string): Record<string, ToolCallMeta> => ({
  [id]: {
    actionReceipt: {
      toolCallId: id,
      actionDisplayName: 'Send message',
      pieceName: 'slack',
      status: 'success',
      output: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    },
  },
});

describe('buildMessageBlocks — one accordion per segment', () => {
  it('merges think → tool → think → tool into a single thinking block', () => {
    const blocks = buildMessageBlocks({
      parts: [
        reasoning('first'),
        status('Looking things up'),
        tool({ name: 'ap_research_pieces', id: 'a' }),
        reasoning('second'),
        status('Checking connections'),
        tool({ name: 'ap_list_connections', id: 'b' }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(),
    }).blocks;

    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe('thinking');
    if (blocks[0].kind !== 'thinking') throw new Error('expected thinking');
    expect(blocks[0].reasoningText).toBe('firstsecond');
    // both rounds' tools live in one accordion; each carries the status that
    // immediately preceded it as its description.
    expect(blocks[0].steps).toHaveLength(2);
    expect(blocks[0].steps.every((s) => s.kind === 'tool')).toBe(true);
    expect(
      blocks[0].steps.map((s) => (s.kind === 'tool' ? s.description : null)),
    ).toEqual(['Looking things up', 'Checking connections']);
  });

  it('starts a new accordion only after a real text part', () => {
    expect(
      kinds([
        status('Researching'),
        tool({ name: 'ap_research_pieces', id: 'a' }),
        text('Here is what I found.'),
        status('Now building'),
        tool({ name: 'ap_get_piece_props', id: 'b' }),
      ]),
    ).toEqual(['thinking', 'text', 'thinking']);
  });

  it('keeps a single accordion when tools are interrupted only by cards, and coalesces adjacent receipts', () => {
    const id1 = 'exec1';
    const id2 = 'exec2';
    const blocks = buildMessageBlocks({
      parts: [
        status('Sending the first message', 's1'),
        tool({
          name: 'ap_execute_action',
          id: id1,
          input: { actionName: 'send_message' },
        }),
        status('Sending the second message', 's2'),
        tool({
          name: 'ap_execute_action',
          id: id2,
          input: { actionName: 'send_message' },
        }),
      ],
      isStreaming: false,
      toolCallMeta: { ...receiptMeta(id1), ...receiptMeta(id2) },
      claimedBuildIds: new Set(),
    }).blocks;

    // One accordion on top, the two receipts coalesced into one quiet group.
    expect(blocks.map((b) => b.kind)).toEqual(['thinking', 'card-group']);
    if (blocks[0].kind !== 'thinking') throw new Error('expected thinking');
    // the execute-action tool calls still appear as steps inside the accordion
    expect(blocks[0].steps.filter((s) => s.kind === 'tool')).toHaveLength(2);
    if (blocks[1].kind !== 'card-group') throw new Error('expected card-group');
    expect(blocks[1].cards).toHaveLength(2);
    expect(blocks[1].cards.every((c) => c.kind === 'action-receipt')).toBe(true);
  });

  it('folds read-only executions into the accordion with no card', () => {
    const blocks = buildMessageBlocks({
      parts: [
        status('Looking things up', 's1'),
        tool({
          name: 'ap_execute_action',
          id: 'read1',
          input: { actionName: 'list_records' },
        }),
        tool({
          name: 'ap_execute_action',
          id: 'read2',
          input: { actionName: 'custom_api_call', input: { method: 'GET' } },
        }),
      ],
      isStreaming: false,
      // receipts present, but read-only calls must NOT surface a card
      toolCallMeta: { ...receiptMeta('read1'), ...receiptMeta('read2') },
      claimedBuildIds: new Set(),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['thinking']);
    if (blocks[0].kind !== 'thinking') throw new Error('expected thinking');
    expect(blocks[0].steps.filter((s) => s.kind === 'tool')).toHaveLength(2);
  });

  it('renders ap_open_in_stage as a stage-open chip, not a thinking step or card', () => {
    const blocks = buildMessageBlocks({
      parts: [
        status('Finding your leads table', 's1'),
        tool({ name: 'ap_list_tables', id: 'list' }),
        tool({
          name: 'ap_open_in_stage',
          id: 'open',
          input: {
            resourceType: 'table',
            resourceId: 'tbl_123',
            displayName: 'Leads',
          },
        }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['thinking', 'stage-open']);
    // the open does NOT appear as a tool step in the accordion
    if (blocks[0].kind !== 'thinking') throw new Error('expected thinking');
    expect(blocks[0].steps.filter((s) => s.kind === 'tool')).toHaveLength(1);
    const chip = blocks[1];
    if (chip.kind !== 'stage-open') throw new Error('expected stage-open');
    expect(chip.resourceType).toBe('table');
    expect(chip.resourceId).toBe('tbl_123');
    expect(chip.displayName).toBe('Leads');
  });

  it('ignores an ap_open_in_stage call with an invalid resource type or missing id', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_open_in_stage',
          id: 'bad-type',
          input: { resourceType: 'project', resourceId: 'p1' },
        }),
        tool({
          name: 'ap_open_in_stage',
          id: 'no-id',
          input: { resourceType: 'flow' },
        }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(),
    }).blocks;

    expect(blocks.some((b) => b.kind === 'stage-open')).toBe(false);
  });

  it('renders a single write outcome as a lone card, not a group', () => {
    const blocks = buildMessageBlocks({
      parts: [
        status('Sending the message', 's1'),
        tool({
          name: 'ap_execute_action',
          id: 'w1',
          input: { actionName: 'send_message' },
        }),
      ],
      isStreaming: false,
      toolCallMeta: { ...receiptMeta('w1') },
      claimedBuildIds: new Set(),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['thinking', 'action-receipt']);
  });

  it('renders a card with no preceding thinking on its own', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_show_connection_picker',
          id: 'p',
          state: 'output-available',
        }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(),
    }).blocks;
    expect(blocks.map((b) => b.kind)).toEqual(['display-tool']);
  });

  it('drops an empty thinking segment that only produced cards', () => {
    const id = 'exec';
    const blocks = buildMessageBlocks({
      parts: [tool({ name: 'ap_execute_action', id })],
      isStreaming: false,
      toolCallMeta: receiptMeta(id),
      claimedBuildIds: new Set(),
    }).blocks;
    // the tool produced a receipt but is a real step, so the accordion stays;
    // it is non-empty (has the tool step) and must be kept above the receipt.
    expect(blocks.map((b) => b.kind)).toEqual(['thinking', 'action-receipt']);
  });

  it('emits a skeleton below the accordion while a card tool is still running', () => {
    const blocks = buildMessageBlocks({
      parts: [
        status('Sending your Slack message'),
        tool({
          name: 'ap_execute_action',
          id: 'exec',
          state: 'input-available',
        }),
      ],
      isStreaming: true,
      toolCallMeta: {},
      claimedBuildIds: new Set(),
    }).blocks;
    expect(blocks.map((b) => b.kind)).toEqual(['thinking', 'card-skeleton']);
  });

  it('keeps pre-build discovery above the build card', () => {
    const blocks = buildMessageBlocks({
      parts: [
        status('Setting up your automation'),
        tool({ name: 'ap_research_pieces', id: 'r' }),
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'detecting' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        status('Building the flow'),
        tool({ name: 'ap_build_flow', id: 'b' }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    // discovery thinking renders ABOVE the card; only the build activity that
    // streamed after the plan marker lives inside it.
    expect(blocks.map((b) => b.kind)).toEqual(['thinking', 'build-plan']);
    if (blocks[1].kind !== 'build-plan') throw new Error('expected build-plan');
    const thinking = (blocks[1].children ?? []).find(
      (c) => c.kind === 'thinking',
    );
    if (thinking?.kind !== 'thinking') throw new Error('expected thinking');
    expect(thinking.steps.filter((s) => s.kind === 'tool')).toHaveLength(1);
  });

  it('does not pull pre-build discovery text/thinking into the card', () => {
    const blocks = buildMessageBlocks({
      parts: [
        status('Looking at your setup'),
        tool({ name: 'ap_research_pieces', id: 'r' }),
        text("Here's the plan."),
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'detecting' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        status('Validating'),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual([
      'thinking',
      'text',
      'build-plan',
    ]);
    if (blocks[2].kind !== 'build-plan') throw new Error('expected build-plan');
    const children = blocks[2].children ?? [];
    expect(children.some((c) => c.kind === 'text')).toBe(false);
    const thinking = children.find((c) => c.kind === 'thinking');
    if (thinking?.kind !== 'thinking') throw new Error('expected thinking');
    // only the post-marker validate tool, not the discovery research tool
    expect(toolIds(thinking.steps.filter((s) => s.kind === 'tool'))).toEqual([
      'v',
    ]);
  });

  it('keeps inter-phase narration inside the card while still building', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'building' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
        text('wiring up the steps'),
      ],
      isStreaming: true,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    // mid-build the narration stays INSIDE the card — nothing renders below it.
    expect(blocks.map((b) => b.kind)).toEqual(['build-plan']);
    if (blocks[0].kind !== 'build-plan') throw new Error('expected build-plan');
    const children = blocks[0].children ?? [];
    expect(children.some((c) => c.kind === 'text')).toBe(true);
    expect(children.some((c) => c.kind === 'thinking')).toBe(true);
  });

  it('drops the closing reply below the card once the build is terminal', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'done' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
        text("Done! It's live."),
      ],
      isStreaming: true,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    // even mid-stream, once `done` is seen the reply belongs below the card.
    expect(blocks.map((b) => b.kind)).toEqual(['build-plan', 'text']);
    if (blocks[0].kind !== 'build-plan') throw new Error('expected build-plan');
    expect(blocks[0].children?.some((c) => c.kind === 'text')).toBe(false);
  });

  it('ignores an unclaimed build plan', () => {
    expect(
      kinds([
        status('Setting up'),
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          output: JSON.stringify({ buildId: 'other' }),
        }),
      ]),
    ).toEqual(['thinking']);
  });

  it('absorbs build activity that streams after the last plan update', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'detecting' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        status('Validating the steps'),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
        reasoning('all good'),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['build-plan']);
    if (blocks[0].kind !== 'build-plan') throw new Error('expected build-plan');
    const children = blocks[0].children ?? [];
    expect(children.some((c) => c.kind === 'thinking')).toBe(true);
    const thinking = children.find((c) => c.kind === 'thinking');
    if (thinking?.kind !== 'thinking') throw new Error('expected thinking');
    expect(thinking.reasoningText).toBe('all good');
    expect(thinking.steps.filter((s) => s.kind === 'tool')).toHaveLength(1);
  });

  it('keeps the closing reply text outside the build card', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'done' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        status('Wrapping up'),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
        text('Done! Your flow is live.'),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['build-plan', 'text']);
    if (blocks[0].kind !== 'build-plan') throw new Error('expected build-plan');
    expect(blocks[0].children?.some((c) => c.kind === 'text')).toBe(false);
  });

  it('keeps trailing quick replies outside the build card', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'done' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
        tool({
          name: 'ap_show_quick_replies',
          id: 'qr',
          state: 'output-available',
        }),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['build-plan', 'display-tool']);
  });

  it('folds a build that only ever sets the plan once', () => {
    const blocks = buildMessageBlocks({
      parts: [
        tool({
          name: 'ap_set_build_plan',
          id: 'bp',
          input: { phase: 'detecting' },
          output: JSON.stringify({ buildId: 'build_1' }),
        }),
        status('Building the flow'),
        tool({ name: 'ap_build_flow', id: 'b' }),
        status('Validating'),
        tool({ name: 'ap_validate_step_config', id: 'v' }),
        status('Testing'),
        tool({ name: 'ap_test_flow', id: 't' }),
        reasoning('looks correct'),
      ],
      isStreaming: false,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

    expect(blocks.map((b) => b.kind)).toEqual(['build-plan']);
    if (blocks[0].kind !== 'build-plan') throw new Error('expected build-plan');
    const thinking = (blocks[0].children ?? []).find(
      (c) => c.kind === 'thinking',
    );
    if (thinking?.kind !== 'thinking') throw new Error('expected thinking');
    expect(thinking.steps.filter((s) => s.kind === 'tool')).toHaveLength(3);
  });
});

// Where a block sits relative to the build card: above it, inside its activity
// section, or below it. Used to prove content never jumps regions mid-stream.
function locateText(
  blocks: MessageBlock[],
  needle: string,
): 'above' | 'inside' | 'below' | 'absent' {
  const cardIdx = blocks.findIndex((b) => b.kind === 'build-plan');
  const hasText = (bs: MessageBlock[]) =>
    bs.some((b) => b.kind === 'text' && b.text.includes(needle));
  if (cardIdx === -1) return hasText(blocks) ? 'above' : 'absent';
  const card = blocks[cardIdx];
  const children = card.kind === 'build-plan' ? card.children ?? [] : [];
  if (hasText(children)) return 'inside';
  if (hasText(blocks.slice(0, cardIdx))) return 'above';
  if (hasText(blocks.slice(cardIdx + 1))) return 'below';
  return 'absent';
}

describe('build card streaming — no contamination, no jumps', () => {
  // A realistic single-turn stream: discovery → build → done → closing reply.
  const stream: Part[] = [
    status('Analyzing your request'),
    tool({ name: 'ap_research_pieces', id: 'r' }),
    text("Here's what I'll build."),
    tool({
      name: 'ap_set_build_plan',
      id: 'bp1',
      input: { phase: 'detecting' },
      output: JSON.stringify({ buildId: 'build_1' }),
    }),
    status('Building'),
    tool({ name: 'ap_build_flow', id: 'b' }),
    text('Wiring up the steps'),
    status('Validating'),
    tool({ name: 'ap_validate_step_config', id: 'v' }),
    tool({
      name: 'ap_set_build_plan',
      id: 'bp2',
      input: { phase: 'done' },
      output: JSON.stringify({ buildId: 'build_1' }),
    }),
    text('Done! Your automation is live.'),
  ];

  const run = (parts: Part[], isStreaming: boolean) =>
    buildMessageBlocks({
      parts,
      isStreaming,
      toolCallMeta: {},
      claimedBuildIds: new Set(['build_1']),
    }).blocks;

  it('never moves a piece of content between regions as the stream grows', () => {
    // Replaying every prefix mimics chunk-by-chunk streaming. The invariant:
    // each tracked string only ever occupies ONE region across all prefixes
    // (plus 'absent' before it has streamed) — so nothing renders below the
    // card and then jumps inside, and nothing leaks out of its region.
    const tracked = {
      "Here's what I'll build.": 'above',
      'Wiring up the steps': 'inside',
      'Done! Your automation is live.': 'below',
    } as const;

    for (const [needle, expected] of Object.entries(tracked)) {
      for (let k = 1; k <= stream.length; k++) {
        const isStreaming = k < stream.length;
        const where = locateText(run(stream.slice(0, k), isStreaming), needle);
        expect([expected, 'absent']).toContain(where);
      }
      // also the settled (post-stream) render
      expect(locateText(run(stream, false), needle)).toBe(expected);
    }
  });

  it('keeps the card region empty below until the build is done', () => {
    // Before the `done` marker streams in, every build block lives inside the
    // card — there is never a sibling rendered below it.
    const doneIdx = stream.findIndex(
      (p) =>
        p.type === 'dynamic-tool' &&
        p.toolName === 'ap_set_build_plan' &&
        (p.input as { phase?: string }).phase === 'done',
    );
    for (let k = 1; k < doneIdx + 1; k++) {
      const blocks = run(stream.slice(0, k), true);
      const cardIdx = blocks.findIndex((b) => b.kind === 'build-plan');
      if (cardIdx === -1) continue;
      expect(blocks.slice(cardIdx + 1)).toHaveLength(0);
    }
  });
});

function toolStep(
  id: string,
  description: string | null,
): ThinkingStep & { kind: 'tool' } {
  return {
    kind: 'tool',
    part: tool({ name: 'ap_execute_action', id }),
    description,
  };
}

function statusStep(text: string): ThinkingStep {
  return { kind: 'thinking-status', text };
}

function toolIds(steps: Array<ThinkingStep & { kind: 'tool' }>): string[] {
  return steps.map((s) => s.part.toolCallId);
}

describe('getLastThinkingSegment — collapsed view shows only the last segment', () => {
  it('returns only the last thought and the tools after it', () => {
    // thought1 → A, B ; thought2 → C ; thought3 → D, E, F
    const steps: ThinkingStep[] = [
      toolStep('A', 'thought1'),
      toolStep('B', null),
      toolStep('C', 'thought2'),
      toolStep('D', 'thought3'),
      toolStep('E', null),
      toolStep('F', null),
    ];
    const seg = getLastThinkingSegment(steps);
    expect(seg.thought).toBe('thought3');
    expect(toolIds(seg.toolSteps)).toEqual(['D', 'E', 'F']);
  });

  it('handles a single segment (all its tools)', () => {
    const seg = getLastThinkingSegment([
      toolStep('A', 'thought1'),
      toolStep('B', null),
    ]);
    expect(seg.thought).toBe('thought1');
    expect(toolIds(seg.toolSteps)).toEqual(['A', 'B']);
  });

  it('handles a dangling thought with no tools yet', () => {
    const seg = getLastThinkingSegment([
      toolStep('A', 'thought1'),
      statusStep('thought2'),
    ]);
    expect(seg.thought).toBe('thought2');
    expect(seg.toolSteps).toEqual([]);
  });

  it('returns a null thought when the tail tools carry no description', () => {
    const seg = getLastThinkingSegment([
      toolStep('A', null),
      toolStep('B', null),
    ]);
    expect(seg.thought).toBeNull();
    expect(toolIds(seg.toolSteps)).toEqual(['A', 'B']);
  });

  it('returns an empty segment for no steps', () => {
    const seg = getLastThinkingSegment([]);
    expect(seg.thought).toBeNull();
    expect(seg.toolSteps).toEqual([]);
  });
});

describe('getLastThinkingSegment — no cross-round thought leak', () => {
  it('returns a null thought for a thought-less round (so the UI borrows nothing)', () => {
    // Round 2 (its own block) whose tool carries no description because the
    // model skipped the status. The segment must report thought=null — the
    // caller must NOT substitute a previous round's thought.
    const round2 = getLastThinkingSegment([toolStep('code', null)]);
    expect(round2.thought).toBeNull();
    expect(round2.toolSteps.map((s) => s.part.toolCallId)).toEqual(['code']);
  });
});
