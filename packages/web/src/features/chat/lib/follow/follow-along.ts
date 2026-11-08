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

export const useFollowAlong = create<FollowState>(() => ({
  target: null,
  phase: 'idle',
  following: true,
  goRequests: 0,
  flashes: {},
  runs: {},
}));

const set = useFollowAlong.setState;
const get = useFollowAlong.getState;

const calls = new Map<string, PendingCall>();
let doneTimer: ReturnType<typeof setTimeout> | null = null;

function onChunks(chunks: readonly unknown[], ctx: RunContext): void {
  ensureRun(ctx);
  for (const chunk of chunks) {
    if (!isObject(chunk) || typeof chunk.toolCallId !== 'string') continue;
    if (chunk.type === 'tool-input-available') {
      const toolName = typeof chunk.toolName === 'string' ? chunk.toolName : '';
      if (!resourceRegistry.isKnownTool(toolName)) continue;
      calls.set(chunk.toolCallId, {
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
    input: call.input,
    conversationId: ctx.conversationId,
    runId: ctx.runId,
    navigable: mayNavigate(ctx),
  };
  recordChange(change);
  if (!resourceRegistry.isChange(change.outcome)) return;
  if (change.op === 'delete') {
    clearTargetIf(change.resource);
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
  const existing = get().runs[ctx.runId];
  if (existing && !existing.ended) return;
  set({
    runs: {
      ...get().runs,
      [ctx.runId]: {
        conversationId: ctx.conversationId,
        attach: ctx.attach,
        changes: existing?.changes ?? [],
        ended: false,
      },
    },
  });
}

function recordChange(change: FollowChange): void {
  const run = get().runs[change.runId];
  if (!run) return;
  set({
    runs: {
      ...get().runs,
      [change.runId]: { ...run, changes: [...run.changes, change] },
    },
  });
}

function begin(): void {
  if (doneTimer) {
    clearTimeout(doneTimer);
    doneTimer = null;
  }
  if (get().phase !== 'editing') {
    set({ phase: 'editing', following: true });
  }
}

function setTarget(resource: ResourceRef): void {
  const current = get().target;
  if (
    current &&
    resourceRegistry.keyOf(current) === resourceRegistry.keyOf(resource)
  ) {
    const name = resource.name ?? current.name;
    const projectId = resource.projectId ?? current.projectId;
    if (name !== current.name || projectId !== current.projectId) {
      set({ target: { ...current, name, projectId } });
    }
    return;
  }
  set({ target: resource });
}

function clearTargetIf(resource: ResourceRef): void {
  const current = get().target;
  if (
    current &&
    resourceRegistry.keyOf(current) === resourceRegistry.keyOf(resource)
  ) {
    set({ target: null });
  }
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
  const run = get().runs[runId];
  if (!run || run.conversationId !== conversationId || run.ended) return;
  const runs = { ...get().runs, [runId]: { ...run, ended: true } };
  set({ runs });
  const navigableLive = Object.values(runs).some(
    (other) =>
      !other.ended &&
      mayNavigate({
        conversationId: other.conversationId,
        attach: other.attach,
      }),
  );
  if (navigableLive || get().phase !== 'editing') return;
  set({ phase: 'done' });
  doneTimer = setTimeout(() => {
    doneTimer = null;
    if (get().phase === 'done') set({ phase: 'idle' });
  }, DONE_VISIBLE_MS);
}

function stopFollowing(): void {
  set({ following: false });
}

function view(resource: ResourceRef): void {
  const current = get().target;
  const same =
    current &&
    resourceRegistry.keyOf(current) === resourceRegistry.keyOf(resource);
  set({
    target: same ? current : resource,
    following: true,
    goRequests: get().goRequests + 1,
  });
}

function flash(keys: string[]): void {
  if (keys.length === 0) return;
  const token = Date.now() + Math.random();
  const next = { ...get().flashes };
  keys.forEach((key) => (next[key] = token));
  set({ flashes: next });
  setTimeout(() => {
    const flashes = { ...get().flashes };
    let changed = false;
    keys.forEach((key) => {
      if (flashes[key] === token) {
        delete flashes[key];
        changed = true;
      }
    });
    if (changed) set({ flashes });
  }, FLASH_MS);
}

const toolDoneListeners = new Set<(change: FollowChange) => void>();
const updateListeners = new Set<(change: FollowChange) => void>();

function onToolDone(listener: (change: FollowChange) => void): () => void {
  toolDoneListeners.add(listener);
  return () => toolDoneListeners.delete(listener);
}

function publishUpdated(change: FollowChange): void {
  updateListeners.forEach((listener) => listener(change));
}

export function useOnFollowUpdate(
  resource: Pick<ResourceRef, 'kind' | 'id'> | null,
  handler: (change: FollowChange) => void,
): void {
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

export function useFollowFlash(key: string): boolean {
  return useFollowAlong((state) => key in state.flashes);
}

export const followAlong = {
  onChunks,
  endRun,
  stopFollowing,
  view,
  flash,
  onToolDone,
  publishUpdated,
};

const DONE_VISIBLE_MS = 2600;
const FLASH_MS = 1200;

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
  input: unknown;
  conversationId: string;
  runId: string;
  navigable: boolean;
};

type PendingCall = { toolName: string; input: unknown; runId: string };

type FollowRun = {
  conversationId: string;
  attach: RunContext['attach'];
  changes: FollowChange[];
  ended: boolean;
};

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing' | 'done';
  following: boolean;
  goRequests: number;
  flashes: Record<string, number>;
  runs: Record<string, FollowRun>;
};
