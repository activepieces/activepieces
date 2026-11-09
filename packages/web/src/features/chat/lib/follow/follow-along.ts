import { isObject } from '@activepieces/core-utils';
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
    if (!isObject(chunk) || chunk.type !== 'tool-output-available') continue;
    const resolved = resourceRegistry.resolve(chunk.output);
    if (!resolved) continue;
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
  claimHistoryPush,
  onToolDone,
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
