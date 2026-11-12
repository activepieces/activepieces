import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import { create } from 'zustand';

import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

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
    if (chunk.type !== 'tool-output-available') continue;
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
  useFollowAlong.setState({ following: false, offer: null });
}

function offer(resource: ResourceRef): void {
  const conversationId = useChatPanel.getState().conversationId;
  const current = useFollowAlong.getState().offer;
  if (
    current &&
    current.conversationId === conversationId &&
    resourceRegistry.keyOf(current.resource) ===
      resourceRegistry.keyOf(resource) &&
    current.resource.name === resource.name
  ) {
    return;
  }
  useFollowAlong.setState({ offer: { resource, conversationId } });
}

function dismissOffer(): void {
  if (useFollowAlong.getState().offer === null) return;
  useFollowAlong.setState({ offer: null });
}

function acceptOffer(): void {
  const { offer: current } = useFollowAlong.getState();
  if (!current) return;
  useFollowAlong.setState({ offer: null });
  chatPanelUtils.openBeside({
    route: resourceRegistry.route(current.resource),
    push: true,
    name: current.resource.name,
  });
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
    offer: null,
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
  onChunks,
  endRun,
  stopFollowing,
  offer,
  dismissOffer,
  acceptOffer,
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
  op: ResourceOp;
  runId: string;
  navigable: boolean;
};

type FollowOffer = {
  resource: ResourceRef;
  conversationId: string | null;
};

type FollowMemory = {
  pushedRuns: Record<string, true>;
};

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing';
  following: boolean;
  liveRuns: Record<string, RunContext>;
  offer: FollowOffer | null;
};
