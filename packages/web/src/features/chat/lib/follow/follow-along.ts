import { isObject, tryCatchSync } from '@activepieces/core-utils';
import { t } from 'i18next';
import { create } from 'zustand';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import {
  ResourceOp,
  ResourceRef,
  resourceRegistry,
} from '../resources/registry';

function onChunks({
  chunks,
  ctx,
}: {
  chunks: readonly unknown[];
  ctx: RunContext;
}): void {
  const { liveRuns } = useFollowAlong.getState();
  if (!liveRuns[ctx.runId]) {
    useFollowAlong.setState({ liveRuns: { ...liveRuns, [ctx.runId]: ctx } });
  }
  for (const chunk of chunks) {
    if (!isObject(chunk)) continue;
    if (
      chunk.type === 'tool-input-available' &&
      typeof chunk.toolCallId === 'string' &&
      typeof chunk.toolName === 'string'
    ) {
      toolCalls.set(chunk.toolCallId, {
        toolName: chunk.toolName,
        input: chunk.input,
      });
      continue;
    }
    if (chunk.type !== 'tool-output-available') continue;
    const resolved = resourceRegistry.resolve(chunk.output);
    if (!resolved) continue;
    const call =
      typeof chunk.toolCallId === 'string'
        ? toolCalls.get(chunk.toolCallId)
        : undefined;
    if (call) {
      toolCalls.delete(chunk.toolCallId as string);
      rememberUnseen({
        resource: resolved.ref,
        keys: highlightKeys({
          ...call,
          output: chunk.output,
          ref: resolved.ref,
        }),
      });
    }
    onChange({
      resource: resolved.ref,
      op: resolved.op,
      runId: ctx.runId,
      navigable: mayNavigate(ctx),
    });
  }
}

function onChange(change: FollowChange): void {
  const began = change.navigable && begin();
  if (change.op === 'delete') {
    forget(change.resource);
  } else if (change.navigable) {
    const retargeted = setTarget(change.resource);
    if (began || retargeted) {
      useChatPanel
        .getState()
        .announce(
          t('The AI is changing {name}.', { name: change.resource.name }),
        );
    }
  }
  changeListeners.forEach((listener) => listener(change));
}

function mayNavigate(ctx: RunContext): boolean {
  return (
    ctx.attach === 'sent' &&
    ctx.conversationId === useChatPanel.getState().conversationId
  );
}

function begin(): boolean {
  if (useFollowAlong.getState().phase === 'editing') return false;
  pushedRuns.clear();
  useFollowAlong.setState({
    phase: 'editing',
    following: true,
    flashes: {},
    scrollTaken: false,
  });
  return true;
}

function setTarget(resource: ResourceRef): boolean {
  const current = useFollowAlong.getState().target;
  const sameKey =
    current !== null &&
    resourceRegistry.keyOf(current) === resourceRegistry.keyOf(resource);
  if (!sameKey || current.name !== resource.name) {
    useFollowAlong.setState({ target: resource });
  }
  return !sameKey;
}

function forget(resource: ResourceRef): void {
  const { target } = useFollowAlong.getState();
  if (
    target &&
    resourceRegistry.keyOf(target) === resourceRegistry.keyOf(resource)
  ) {
    useFollowAlong.setState({ target: null });
  }
}

function endRun({
  conversationId,
  runId,
}: {
  conversationId: string;
  runId: string;
}): void {
  const { [runId]: run, ...rest } = useFollowAlong.getState().liveRuns;
  if (!run || run.conversationId !== conversationId) return;
  useFollowAlong.setState({ liveRuns: rest });
  const navigableLive = Object.values(rest).some(mayNavigate);
  if (!navigableLive && useFollowAlong.getState().phase === 'editing') {
    useFollowAlong.setState({ phase: 'idle' });
  }
}

function stopFollowing(): void {
  useFollowAlong.setState({ following: false });
}

function flash(keys: string[]): void {
  if (keys.length === 0) return;
  flashCount += 1;
  const lit = Object.fromEntries(keys.map((key) => [key, flashCount]));
  useFollowAlong.setState({
    flashes: { ...useFollowAlong.getState().flashes, ...lit },
  });
}

// Changes made while the user was elsewhere light up when they get there.
function rememberUnseen({
  resource,
  keys,
}: {
  resource: ResourceRef;
  keys: string[];
}): void {
  if (keys.length === 0) return;
  if (resourceRegistry.isOn(window.location.pathname, resource)) return;
  const scope = resourceRegistry.keyOf(resource);
  keys.forEach((key) => unseen.add(`${scope}|${key}`));
}

function takeUnseen({
  resource,
  key,
}: {
  resource: Pick<ResourceRef, 'kind' | 'id'>;
  key: string;
}): boolean {
  return unseen.delete(`${resourceRegistry.keyOf(resource)}|${key}`);
}

function highlightKeys({
  toolName,
  input,
  output,
  ref,
}: {
  toolName: string;
  input: unknown;
  output: unknown;
  ref: ResourceRef;
}): string[] {
  const tool = toolName.slice(toolName.lastIndexOf('ap_'));
  const args = isObject(input) ? input : {};
  switch (tool) {
    case 'ap_add_step': {
      const stepName = structuredField(output, 'stepName');
      return stepName ? [`flow-step:${stepName}`] : [];
    }
    case 'ap_update_step':
      return typeof args.stepName === 'string'
        ? [`flow-step:${args.stepName}`]
        : [];
    case 'ap_update_trigger':
      return ['flow-step:trigger'];
    case 'ap_rename_flow':
      return [`flow-name:${ref.id}`];
    case 'ap_lock_and_publish':
    case 'ap_change_flow_status':
      return [`flow-status:${ref.id}`];
    default:
      return [];
  }
}

function structuredField(output: unknown, field: string): string | null {
  const parsed =
    typeof output === 'string'
      ? tryCatchSync<unknown>(() => JSON.parse(output)).data
      : output;
  if (!isObject(parsed) || !isObject(parsed.structuredContent)) return null;
  const value = parsed.structuredContent[field];
  return typeof value === 'string' ? value : null;
}

function isFollowing(resource: Pick<ResourceRef, 'kind' | 'id'>): boolean {
  const { target, phase } = useFollowAlong.getState();
  return (
    phase === 'editing' &&
    target !== null &&
    resourceRegistry.keyOf(target) === resourceRegistry.keyOf(resource)
  );
}

function claimHistoryPush(runId: string | null): boolean {
  if (runId === null) return true;
  if (pushedRuns.has(runId)) return false;
  pushedRuns.add(runId);
  return true;
}

function onToolDone(listener: (change: FollowChange) => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

const toolCalls = new Map<string, { toolName: string; input: unknown }>();
const unseen = new Set<string>();
const changeListeners = new Set<(change: FollowChange) => void>();
const pushedRuns = new Set<string>();
let flashCount = 0;

export const useFollowAlong = create<FollowState>(() => ({
  target: null,
  phase: 'idle',
  following: true,
  flashes: {},
  scrollTaken: false,
  liveRuns: {},
}));

export const followAlong = {
  onChunks,
  endRun,
  stopFollowing,
  flash,
  isFollowing,
  claimHistoryPush,
  onToolDone,
  takeUnseen,
};

export type RunContext = {
  conversationId: string;
  runId: string;
  attach: 'sent' | 'resumed';
};

export type FollowChange = {
  resource: ResourceRef;
  op: ResourceOp;
  runId: string;
  navigable: boolean;
};

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing';
  following: boolean;
  flashes: Record<string, number>;
  scrollTaken: boolean;
  liveRuns: Record<string, RunContext>;
};
