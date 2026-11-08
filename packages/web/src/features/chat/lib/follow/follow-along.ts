import { isObject } from '@activepieces/core-utils';
import { useEffect, useRef } from 'react';
import { create } from 'zustand';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import {
  ResourceOp,
  ResourceOutcome,
  ResourceRef,
  resourceRegistry,
} from '../resources/registry';

export function useOnFollowUpdate({
  resource,
  handler,
}: {
  resource: Pick<ResourceRef, 'kind' | 'id'> | null;
  handler: (change: FollowChange) => void;
}): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const key = resource ? resourceRegistry.keyOf(resource) : null;
  useEffect(() => {
    if (!key) return;
    const listener = (change: FollowChange) => {
      if (resourceRegistry.keyOf(change.resource) === key) {
        handlerRef.current(change);
      }
    };
    updateListeners.add(listener);
    return () => {
      updateListeners.delete(listener);
    };
  }, [key]);
}

function onChunks({
  chunks,
  ctx,
}: {
  chunks: readonly unknown[];
  ctx: RunContext;
}): void {
  ensureRun(ctx);
  for (const chunk of chunks) {
    if (!isObject(chunk) || typeof chunk.toolCallId !== 'string') continue;
    if (chunk.type === 'tool-input-available') {
      const toolName = typeof chunk.toolName === 'string' ? chunk.toolName : '';
      if (!resourceRegistry.isKnownTool(toolName)) continue;
      calls.set(chunk.toolCallId, {
        toolCallId: chunk.toolCallId,
        toolName,
        input: chunk.input,
        runId: ctx.runId,
      });
      if (mayNavigate(ctx) && resourceRegistry.autoOpensTool(toolName)) {
        begin();
      }
    } else if (chunk.type === 'tool-output-available') {
      const call = calls.get(chunk.toolCallId);
      if (!call) continue;
      calls.delete(chunk.toolCallId);
      onToolOutput({ call, output: chunk.output, ctx });
    } else if (chunk.type === 'tool-output-error') {
      calls.delete(chunk.toolCallId);
    }
  }
}

function onToolOutput({
  call,
  output,
  ctx,
}: {
  call: PendingCall;
  output: unknown;
  ctx: RunContext;
}): void {
  const resolved = resourceRegistry.resolve({
    toolName: call.toolName,
    input: call.input,
    output,
  });
  if (!resolved) return;
  const change: FollowChange = {
    resource: resolved.ref,
    op: resolved.op,
    outcome: resolved.outcome,
    highlights: resolved.highlights,
    toolName: call.toolName,
    toolCallId: call.toolCallId,
    conversationId: ctx.conversationId,
    runId: ctx.runId,
    navigable: mayNavigate(ctx),
  };
  recordChange({
    runId: ctx.runId,
    change: {
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      input: call.input,
      output,
      highlights: resolved.highlights,
      changed: resourceRegistry.isChange(resolved.outcome),
    },
  });
  if (!resourceRegistry.isChange(change.outcome)) return;
  if (change.op === 'delete') {
    forget(change.resource);
  } else if (
    change.navigable &&
    resourceRegistry.autoOpens(change.resource.kind)
  ) {
    setTarget(change.resource);
  }
  toolDoneListeners.forEach((listener) => listener(change));
}

function mayNavigate(
  ctx: Pick<RunContext, 'conversationId' | 'attach'>,
): boolean {
  return (
    ctx.attach === 'sent' &&
    ctx.conversationId === useChatPanel.getState().conversationId
  );
}

function ensureRun(ctx: RunContext): void {
  const runs = useFollowAlong.getState().runs;
  const existing = runs[ctx.runId];
  if (existing && !existing.ended) return;
  useFollowAlong.setState({
    runs: pruneRuns({
      ...runs,
      [ctx.runId]: {
        conversationId: ctx.conversationId,
        attach: ctx.attach,
        changes: existing?.changes ?? [],
        ended: false,
      },
    }),
  });
}

function recordChange({
  runId,
  change,
}: {
  runId: string;
  change: RunChange;
}): void {
  const runs = useFollowAlong.getState().runs;
  const run = runs[runId];
  if (!run) return;
  useFollowAlong.setState({
    runs: { ...runs, [runId]: { ...run, changes: [...run.changes, change] } },
  });
}

function pruneRuns(runs: Record<string, FollowRun>): Record<string, FollowRun> {
  const current = useChatPanel.getState().conversationId;
  const entries = Object.entries(runs);
  const prunable = entries.filter(
    ([, run]) => run.ended && run.conversationId !== current,
  );
  const dropCount = prunable.length - KEPT_ENDED_RUNS;
  if (dropCount <= 0) return runs;
  const dropped = new Set(prunable.slice(0, dropCount).map(([id]) => id));
  return Object.fromEntries(entries.filter(([id]) => !dropped.has(id)));
}

function begin(): void {
  if (doneTimer) {
    clearTimeout(doneTimer);
    doneTimer = null;
  }
  if (useFollowAlong.getState().phase !== 'editing') {
    useFollowAlong.setState({
      phase: 'editing',
      following: true,
      pageTouched: false,
    });
  }
}

function offer(next: FollowOffer | null): void {
  const current = useFollowAlong.getState().offer;
  if (
    current === next ||
    (current &&
      next &&
      current.kind === next.kind &&
      sameResource({ a: current.resource, b: next.resource }))
  ) {
    return;
  }
  useFollowAlong.setState({ offer: next });
}

function touchPage(): void {
  const state = useFollowAlong.getState();
  if (state.phase === 'editing' && !state.pageTouched) {
    useFollowAlong.setState({ pageTouched: true });
  }
}

function setTarget(resource: ResourceRef): void {
  const current = useFollowAlong.getState().target;
  if (current && sameResource({ a: current, b: resource })) {
    const name = resource.name ?? current.name;
    const projectId = resource.projectId ?? current.projectId;
    if (name !== current.name || projectId !== current.projectId) {
      useFollowAlong.setState({ target: { ...current, name, projectId } });
    }
    return;
  }
  useFollowAlong.setState({ target: resource });
}

function forget(resource: ResourceRef): void {
  const { target, offer: current } = useFollowAlong.getState();
  const patch: Partial<FollowState> = {};
  if (target && sameResource({ a: target, b: resource })) patch.target = null;
  if (current && sameResource({ a: current.resource, b: resource })) {
    patch.offer = null;
  }
  if (Object.keys(patch).length > 0) useFollowAlong.setState(patch);
}

function endRun({
  conversationId,
  runId,
}: {
  conversationId: string;
  runId: string;
}): void {
  [...calls].forEach(([toolCallId, call]) => {
    if (call.runId === runId) calls.delete(toolCallId);
  });
  const state = useFollowAlong.getState();
  const run = state.runs[runId];
  if (!run || run.conversationId !== conversationId || run.ended) return;
  const runs = pruneRuns({ ...state.runs, [runId]: { ...run, ended: true } });
  useFollowAlong.setState({ runs });
  const navigableLive = Object.values(runs).some(
    (other) =>
      !other.ended &&
      mayNavigate({
        conversationId: other.conversationId,
        attach: other.attach,
      }),
  );
  if (navigableLive || state.phase !== 'editing') return;
  useFollowAlong.setState({ phase: 'done' });
  doneTimer = setTimeout(() => {
    doneTimer = null;
    if (useFollowAlong.getState().phase === 'done') {
      useFollowAlong.setState({ phase: 'idle' });
    }
  }, DONE_VISIBLE_MS);
}

function stopFollowing(): void {
  useFollowAlong.setState({ following: false });
}

function view(resource: ResourceRef): void {
  const state = useFollowAlong.getState();
  const same = state.target && sameResource({ a: state.target, b: resource });
  useFollowAlong.setState({
    target: same ? state.target : resource,
    following: true,
    goRequests: state.goRequests + 1,
  });
}

function flash(keys: string[]): void {
  if (keys.length === 0) return;
  const token = Date.now() + Math.random();
  const lit = Object.fromEntries(keys.map((key) => [key, token]));
  useFollowAlong.setState({
    flashes: { ...useFollowAlong.getState().flashes, ...lit },
  });
  setTimeout(() => {
    const flashes = useFollowAlong.getState().flashes;
    const kept = Object.entries(flashes).filter(
      ([key, value]) => !(key in lit && value === token),
    );
    if (kept.length !== Object.keys(flashes).length) {
      useFollowAlong.setState({ flashes: Object.fromEntries(kept) });
    }
  }, FLASH_MS);
}

function onToolDone(listener: (change: FollowChange) => void): () => void {
  toolDoneListeners.add(listener);
  return () => toolDoneListeners.delete(listener);
}

function publishUpdated(change: FollowChange): void {
  updateListeners.forEach((listener) => listener(change));
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

const calls = new Map<string, PendingCall>();
const toolDoneListeners = new Set<(change: FollowChange) => void>();
const updateListeners = new Set<(change: FollowChange) => void>();
let doneTimer: ReturnType<typeof setTimeout> | null = null;

const DONE_VISIBLE_MS = 2600;
const FLASH_MS = 2400;
const KEPT_ENDED_RUNS = 5;

export const useFollowAlong = create<FollowState>(() => ({
  target: null,
  phase: 'idle',
  following: true,
  goRequests: 0,
  flashes: {},
  runs: {},
  offer: null,
  pageTouched: false,
}));

export const followAlong = {
  onChunks,
  offer,
  touchPage,
  endRun,
  stopFollowing,
  view,
  flash,
  onToolDone,
  publishUpdated,
};

export type RunContext = {
  conversationId: string;
  runId: string;
  attach: 'sent' | 'resumed';
};

export type FollowChange = {
  resource: ResourceRef;
  op: ResourceOp;
  outcome: ResourceOutcome;
  highlights: string[];
  toolName: string;
  toolCallId: string;
  conversationId: string;
  runId: string;
  navigable: boolean;
};

export type RunChange = {
  toolCallId: string;
  toolName: string;
  input: unknown;
  output: unknown;
  highlights: string[];
  changed: boolean;
};

export type FollowOffer = {
  resource: ResourceRef;
  kind: 'ready' | 'switch';
  runId: string | null;
};

type PendingCall = {
  toolCallId: string;
  toolName: string;
  input: unknown;
  runId: string;
};

type FollowRun = {
  conversationId: string;
  attach: RunContext['attach'];
  changes: RunChange[];
  ended: boolean;
};

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing' | 'done';
  following: boolean;
  goRequests: number;
  flashes: Record<string, number>;
  runs: Record<string, FollowRun>;
  offer: FollowOffer | null;
  pageTouched: boolean;
};
