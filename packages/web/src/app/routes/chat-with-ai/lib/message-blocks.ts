import { BatchProgressData } from '@activepieces/shared';

import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import {
  AnyToolPart,
  CardSkeletonPhase,
  ChatUIMessage,
  PendingCardKind,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';

// Group an assistant message's raw parts into render blocks. A segment is the
// stretch between real `text` parts: all reasoning, tool steps, and
// thinking-statuses in it collapse into ONE thinking accordion, emitted once at
// the segment's start. Cards (receipts/images/files) render as siblings AFTER
// it, in execution order. Only a `text` part ends the segment so the next one
// opens a fresh accordion.
export function buildMessageBlocks({
  parts,
  isStreaming,
  toolCallMeta,
  claimedBuildIds,
}: {
  parts: ChatUIMessage['parts'];
  isStreaming: boolean;
  toolCallMeta: Record<string, ToolCallMeta>;
  claimedBuildIds: ReadonlySet<string>;
}): { blocks: MessageBlock[]; hasContent: boolean; sources: SourceItem[] } {
  const result: MessageBlock[] = [];
  let currentThinking: (MessageBlock & { kind: 'thinking' }) | null = null;
  let hasText = false;
  let pendingDescription: string | null = null;
  const sources: SourceItem[] = [];
  const seenSourceKeys = new Set<string>();
  const startedBuildIds = new Set<string>();

  function addSource(source: SourceItem) {
    const dedupeKey = source.href ?? source.key;
    if (seenSourceKeys.has(dedupeKey)) return;
    seenSourceKeys.add(dedupeKey);
    sources.push(source);
  }

  function ensureThinking() {
    if (!currentThinking) {
      currentThinking = { kind: 'thinking', steps: [], reasoningText: '' };
      result.push(currentThinking);
    }
    return currentThinking;
  }

  function flushPendingDescription() {
    if (pendingDescription) {
      const thinking = ensureThinking();
      thinking.steps.push({
        kind: 'thinking-status',
        text: pendingDescription,
      });
      pendingDescription = null;
    }
  }

  function endSegment() {
    flushPendingDescription();
    currentThinking = null;
  }

  function pushToolStep(p: AnyToolPart): string | null {
    const thinking = ensureThinking();
    const description = pendingDescription;
    pendingDescription = null;
    thinking.steps.push({ kind: 'tool', part: p, description });
    return description;
  }

  // A card-producing tool (execute action / generate image / run code) both
  // appears as a step inside the accordion AND emits its own card below it —
  // the resolved card once toolCallMeta has it, or a shape-matched skeleton
  // while it runs. Crucially this never closes the accordion: the segment's
  // thinking stays a single block above its cards.
  function emitCardForTool(p: AnyToolPart, description: string | null) {
    const toolName = chatPartUtils.getToolPartName(p);
    const toolCallId = chatPartUtils.getToolCallId(p);
    if (!toolCallId) return;

    // Read-only executions (lookups / HTTP GETs) are not outcomes: no card, no
    // skeleton. They already show as a step in the thinking accordion above.
    if (chatPartUtils.isReadOnlyExecuteAction(p)) return;

    const hasReceipt =
      toolName === 'ap_execute_action' &&
      !!toolCallMeta[toolCallId]?.actionReceipt;
    const hasImage =
      toolName === 'ap_generate_image' && !!toolCallMeta[toolCallId]?.image;
    const hasFiles =
      toolName === 'ap_run_code' &&
      (toolCallMeta[toolCallId]?.files?.length ?? 0) > 0;

    if (hasReceipt) {
      result.push({ kind: 'action-receipt', toolCallId });
      return;
    }
    if (hasImage) {
      result.push({ kind: 'image', toolCallId });
      return;
    }
    if (hasFiles) {
      result.push({ kind: 'files', toolCallId });
      return;
    }

    // While a card-producing tool runs server-side, render a shape-matched
    // skeleton in the card's eventual slot so the gap never reads as stuck.
    // Streaming-only: history doesn't seed toolCallMeta, so a skeleton there
    // would mislabel a completed card as failed. Batch executions stream their
    // own live progress, so skip those too.
    const cardKind = chatPartUtils.getPendingCardKind(toolName);
    if (isStreaming && cardKind && !toolCallMeta[toolCallId]?.batchProgress) {
      const state = p.state;
      const phase: CardSkeletonPhase =
        state === 'output-error' || state === 'output-denied'
          ? 'failed'
          : 'pending';
      result.push({
        kind: 'card-skeleton',
        cardKind,
        toolCallId,
        part: p,
        description,
        phase,
      });
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];

    if (p.type === 'step-start') {
      continue;
    }
    if (p.type === 'source-url') {
      addSource({ key: p.sourceId || p.url, href: p.url, title: p.title });
      continue;
    }
    if (p.type === 'source-document') {
      addSource({ key: p.sourceId, title: p.title || p.filename });
      continue;
    }
    if (p.type === 'text' && p.text.length > 0) {
      endSegment();
      hasText = true;
      result.push({ kind: 'text', text: p.text });
    } else if (p.type === 'reasoning') {
      flushPendingDescription();
      const thinking = ensureThinking();
      thinking.reasoningText += p.text;
    } else if (chatPartUtils.isAnyToolPart(p)) {
      const toolName = chatPartUtils.getToolPartName(p);
      if (chatPartUtils.isThinkingStatusTool(toolName)) {
        const input = p.input as { status?: string } | undefined;
        const statusText = (input?.status ?? '').trim();
        if (statusText) {
          flushPendingDescription();
          pendingDescription = statusText;
        }
        continue;
      }
      if (toolName === 'ap_set_build_plan') {
        const planBuildId = chatPartUtils.extractBuildIdFromOutput(p);
        if (planBuildId && claimedBuildIds.has(planBuildId)) {
          // The first marker of a build closes the discovery accordion so the
          // build's own thinking starts a fresh block below it — otherwise the
          // two merge into one accordion that can't be split from the card.
          if (!startedBuildIds.has(planBuildId)) {
            endSegment();
            startedBuildIds.add(planBuildId);
          }
          result.push({
            kind: 'build-plan',
            buildId: planBuildId,
            phase: chatPartUtils.extractBuildPhaseFromInput(p),
          });
        }
        continue;
      }
      if (toolName === 'ap_remember') {
        const memory = (
          p.input as { memory?: string } | undefined
        )?.memory?.trim();
        if (memory && p.state === 'output-available') {
          result.push({ kind: 'memory-saved', memory });
        }
        continue;
      }
      if (chatPartUtils.HIDDEN_TOOL_NAMES.has(toolName)) {
        continue;
      }
      if (chatPartUtils.isDisplayTool(toolName)) {
        result.push({ kind: 'display-tool', part: p });
        continue;
      }
      const description = pushToolStep(p);
      if (toolName === 'ap_execute_action') {
        const batchPart = chatPartUtils.extractBatchProgressFromOutput(p);
        if (batchPart) {
          result.push({ kind: 'batch-progress', data: batchPart });
        }
      }
      emitCardForTool(p, description);
    }
  }

  endSegment();

  if (isStreaming && !hasText) {
    const hasThinkingBlock = result.some((b) => b.kind === 'thinking');
    if (!hasThinkingBlock) {
      result.push({ kind: 'thinking', steps: [], reasoningText: '' });
    }
  }

  const lastThinkingIdx = result.findLastIndex((b) => b.kind === 'thinking');
  const cleaned = result.filter((block, idx) => {
    if (block.kind !== 'thinking') return true;
    if (idx === lastThinkingIdx && isStreaming) return true;
    return block.steps.length > 0 || block.reasoningText.length > 0;
  });

  return {
    blocks: groupAdjacentCards(groupBuildBlocks(cleaned, isStreaming)),
    hasContent: hasText,
    sources,
  };
}

// Several genuine outcomes in a row (e.g. a handful of individual writes) would
// otherwise stack as N full-width cards. Coalesce an adjacent run of 2+ outcome
// cards into one collapsed `card-group` so the timeline stays calm; a lone card
// renders unchanged. Recurses into a build's children, which render through the
// same block pipeline.
function groupAdjacentCards(blocks: MessageBlock[]): MessageBlock[] {
  const out: MessageBlock[] = [];
  let run: OutcomeCardBlock[] = [];
  const flushRun = () => {
    if (run.length === 1) {
      out.push(run[0]);
    } else if (run.length > 1) {
      out.push({ kind: 'card-group', cards: run });
    }
    run = [];
  };
  for (const block of blocks) {
    if (
      block.kind === 'action-receipt' ||
      block.kind === 'image' ||
      block.kind === 'files'
    ) {
      run.push(block);
      continue;
    }
    flushRun();
    if (block.kind === 'build-plan' && block.children) {
      out.push({ ...block, children: groupAdjacentCards(block.children) });
    } else {
      out.push(block);
    }
  }
  flushRun();
  return out;
}

// Fold a build's activity into its single card so it streams INSIDE the card,
// while pre-build discovery stays above and the closing reply stays below.
//   - children start at the build marker (NOT block 0), so the discovery /
//     question interaction that preceded the build is never pulled inside.
//   - while the build is still running every block in its region stays inside
//     the card, so inter-phase narration never flickers below then jumps in.
//     Only once the build is terminal (done/failed) or fully settled does the
//     trailing conversational text / display-tool (closing reply, quick replies)
//     fall outside — and since that reply streams AFTER the `done` marker, it is
//     below from its first frame, no jump.
function groupBuildBlocks(
  blocks: MessageBlock[],
  isStreaming: boolean,
): MessageBlock[] {
  const startIdx = blocks.findIndex((b) => b.kind === 'build-plan');
  if (startIdx === -1) return blocks;
  const start = blocks[startIdx];
  if (start.kind !== 'build-plan') return blocks;

  // This build's region is [startIdx, regionEnd); a different build's plan
  // marker ends it so a second build isn't swallowed into the first.
  let regionEnd = blocks.length;
  for (let i = startIdx + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.kind === 'build-plan' && b.buildId !== start.buildId) {
      regionEnd = i;
      break;
    }
  }

  let lastActivityIdx = startIdx;
  let terminal = start.phase === 'done' || start.phase === 'failed';
  for (let i = startIdx; i < regionEnd; i++) {
    const b = blocks[i];
    if (b.kind === 'build-plan' && (b.phase === 'done' || b.phase === 'failed'))
      terminal = true;
    if (b.kind !== 'text' && b.kind !== 'display-tool') lastActivityIdx = i;
  }

  const boundary = terminal || !isStreaming ? lastActivityIdx : regionEnd - 1;

  const before = blocks.slice(0, startIdx);
  const children = blocks
    .slice(startIdx, boundary + 1)
    .filter((b) => b.kind !== 'build-plan');
  const after = blocks.slice(boundary + 1);

  return [
    ...before,
    { kind: 'build-plan', buildId: start.buildId, children },
    ...groupBuildBlocks(after, isStreaming),
  ];
}

// A "segment" is one thought and the tools it triggered. A thought lives in the
// `description` of the FIRST tool of its segment (only a dangling thought — one
// with no tool after it — becomes a standalone `thinking-status` step). The
// collapsed live view shows ONLY the last segment, so derive it by walking the
// steps backwards: collect trailing tools until we reach the tool that carries a
// description (the segment's thought) or a standalone thinking-status step.
export function getLastThinkingSegment(steps: ThinkingStep[]): {
  thought: string | null;
  toolSteps: Array<ThinkingStep & { kind: 'tool' }>;
} {
  const toolSteps: Array<ThinkingStep & { kind: 'tool' }> = [];
  let thought: string | null = null;
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step.kind === 'thinking-status') {
      thought = step.text;
      break;
    }
    toolSteps.unshift(step);
    if (step.description) {
      thought = step.description;
      break;
    }
  }
  return { thought, toolSteps };
}

export type MessageBlock =
  | {
      kind: 'thinking';
      steps: ThinkingStep[];
      reasoningText: string;
    }
  | { kind: 'text'; text: string }
  | { kind: 'display-tool'; part: AnyToolPart }
  | { kind: 'memory-saved'; memory: string }
  | { kind: 'batch-progress'; data: BatchProgressData }
  | OutcomeCardBlock
  | { kind: 'card-group'; cards: OutcomeCardBlock[] }
  | {
      kind: 'card-skeleton';
      cardKind: PendingCardKind;
      toolCallId: string;
      part: AnyToolPart;
      description: string | null;
      phase: CardSkeletonPhase;
    }
  | {
      kind: 'build-plan';
      buildId: string;
      phase?: string;
      children?: MessageBlock[];
    };

export type OutcomeCardBlock =
  | { kind: 'action-receipt'; toolCallId: string }
  | { kind: 'image'; toolCallId: string }
  | { kind: 'files'; toolCallId: string };

export type SourceItem = { key: string; href?: string; title?: string };
