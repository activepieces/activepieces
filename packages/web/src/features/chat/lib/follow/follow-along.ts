import { isObject } from '@activepieces/core-utils';
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
  if (change.navigable) begin();
  if (change.op === 'delete') {
    forget(change.resource);
  } else if (change.navigable) {
    setTarget(change.resource);
  }
  changeListeners.forEach((listener) => listener(change));
}

function mayNavigate(ctx: RunContext): boolean {
  return (
    ctx.attach === 'sent' &&
    ctx.conversationId === useChatPanel.getState().conversationId
  );
}

function begin(): void {
  if (useFollowAlong.getState().phase === 'editing') return;
  useFollowAlong.setState({
    phase: 'editing',
    following: true,
    flashes: {},
    scrollTaken: false,
  });
}

function setTarget(resource: ResourceRef): void {
  const current = useFollowAlong.getState().target;
  if (
    current &&
    resourceRegistry.keyOf(current) === resourceRegistry.keyOf(resource) &&
    current.name === resource.name
  ) {
    return;
  }
  useFollowAlong.setState({ target: resource });
}

function forget(resource: ResourceRef): void {
  const { target, offer } = useFollowAlong.getState();
  if (target && sameResource({ a: target, b: resource })) {
    useFollowAlong.setState({ target: null });
  }
  if (offer && sameResource({ a: offer.resource, b: resource })) {
    useFollowAlong.setState({ offer: null });
  }
}

function decide({
  state,
  onTarget,
  autoFollow,
  embedded,
  busy,
}: {
  state: Pick<FollowState, 'target' | 'following' | 'phase'>;
  onTarget: boolean;
  autoFollow: boolean;
  embedded: boolean;
  busy: boolean;
}): FollowDecision {
  const { target } = state;
  if (
    !target ||
    !state.following ||
    state.phase !== 'editing' ||
    onTarget ||
    embedded ||
    !autoFollow ||
    !resourceRegistry.isInCurrentProject(target)
  ) {
    return 'stay';
  }
  return busy ? 'offer' : 'open';
}

function offer(resource: ResourceRef): void {
  const conversationId = useChatPanel.getState().conversationId;
  const current = useFollowAlong.getState().offer;
  if (
    current &&
    current.conversationId === conversationId &&
    sameResource({ a: current.resource, b: resource }) &&
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

function sameResource({
  a,
  b,
}: {
  a: Pick<ResourceRef, 'kind' | 'id'>;
  b: Pick<ResourceRef, 'kind' | 'id'>;
}): boolean {
  return resourceRegistry.keyOf(a) === resourceRegistry.keyOf(b);
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

function flash(keys: string[]): void {
  if (keys.length === 0) return;
  flashCount += 1;
  const lit = Object.fromEntries(keys.map((key) => [key, flashCount]));
  useFollowAlong.setState({
    flashes: { ...useFollowAlong.getState().flashes, ...lit },
  });
}

function onToolDone(listener: (change: FollowChange) => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

const changeListeners = new Set<(change: FollowChange) => void>();
let flashCount = 0;

export const useFollowAlong = create<FollowState>(() => ({
  target: null,
  phase: 'idle',
  following: true,
  flashes: {},
  scrollTaken: false,
  liveRuns: {},
  offer: null,
}));

export const followAlong = {
  onChunks,
  endRun,
  stopFollowing,
  decide,
  offer,
  dismissOffer,
  flash,
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

export type FollowOffer = {
  resource: ResourceRef;
  conversationId: string | null;
};

export type FollowDecision = 'open' | 'offer' | 'stay';

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing';
  following: boolean;
  flashes: Record<string, number>;
  scrollTaken: boolean;
  liveRuns: Record<string, RunContext>;
  offer: FollowOffer | null;
};
