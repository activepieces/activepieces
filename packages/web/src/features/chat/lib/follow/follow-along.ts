import { isNil } from '@activepieces/core-utils';
import { ResourceChangeOp } from '@activepieces/shared';
import { t } from 'i18next';
import { create } from 'zustand';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import { ResourceRef, resourceRegistry } from '../resources/registry';

function startRun(ctx: RunContext): void {
  const { liveRuns } = useFollowAlong.getState();
  if (liveRuns[ctx.runId]) return;
  useFollowAlong.setState({ liveRuns: { ...liveRuns, [ctx.runId]: ctx } });
}

function runOf(conversationId: string | null): RunContext | null {
  if (isNil(conversationId)) return null;
  const runs = Object.values(useFollowAlong.getState().liveRuns);
  return runs.find((run) => run.conversationId === conversationId) ?? null;
}

function knownName(resource: Pick<ResourceRef, 'kind' | 'id'>): string | null {
  const { target } = useFollowAlong.getState();
  return isSameResource({ a: target, b: resource })
    ? target?.name ?? null
    : null;
}

function onServerChange({
  resource,
  op,
  run,
}: {
  resource: ResourceRef;
  op: ResourceChangeOp;
  run: RunContext;
}): void {
  if (!useFollowAlong.getState().liveRuns[run.runId]) return;
  onChange({ resource, op, runId: run.runId, navigable: mayNavigate(run) });
}

function onChange(change: FollowChange): void {
  const began = change.navigable && begin();
  if (change.op === ResourceChangeOp.DELETE) {
    forget(change.resource);
  } else if (change.navigable) {
    const retargeted = setTarget(change.resource);
    if (began || retargeted) {
      useChatPanel
        .getState()
        .announce(
          t('The AI is editing {name}.', { name: change.resource.name }),
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
  useFollowMemory.setState({ pushedRuns: {} });
  useFollowAlong.setState({
    phase: 'editing',
    following: true,
    target: null,
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
  if (isSameResource({ a: target, b: resource })) {
    useFollowAlong.setState({ target: null });
  }
}

function isSameResource({
  a,
  b,
}: {
  a: ResourceRef | null | undefined;
  b: Pick<ResourceRef, 'kind' | 'id'>;
}): boolean {
  return !isNil(a) && resourceRegistry.keyOf(a) === resourceRegistry.keyOf(b);
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
  const { pushedRuns } = useFollowMemory.getState();
  if (pushedRuns[runId]) return false;
  useFollowMemory.setState({ pushedRuns: { ...pushedRuns, [runId]: true } });
  return true;
}

function reset(): void {
  useFollowAlong.setState(initialFollowState());
  useFollowMemory.setState(initialMemory());
}

function initialFollowState(): FollowState {
  return {
    target: null,
    phase: 'idle',
    following: true,
    liveRuns: {},
  };
}

function initialMemory(): FollowMemory {
  return {
    pushedRuns: {},
  };
}

function onToolDone(listener: (change: FollowChange) => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

const changeListeners = new Set<(change: FollowChange) => void>();

const useFollowMemory = create<FollowMemory>(initialMemory);

export const useFollowAlong = create<FollowState>(initialFollowState);

export const followAlong = {
  startRun,
  runOf,
  knownName,
  onServerChange,
  endRun,
  stopFollowing,
  isFollowing,
  claimHistoryPush,
  onToolDone,
  reset,
};

export type RunContext = {
  conversationId: string;
  runId: string;
  attach: 'sent' | 'resumed';
};

export type FollowChange = {
  resource: ResourceRef;
  op: ResourceChangeOp;
  runId: string;
  navigable: boolean;
};

type FollowMemory = {
  pushedRuns: Record<string, true>;
};

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing';
  following: boolean;
  liveRuns: Record<string, RunContext>;
};
