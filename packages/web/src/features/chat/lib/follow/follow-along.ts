import { isObject } from '@activepieces/core-utils';
import { useEffect, useRef } from 'react';
import { create } from 'zustand';

import { FollowResource, followResources } from './follow-resources';

// "Follow along": while the chat edits a flow, table or agent, the main area
// shows it and the user watches it change.
//
// The chat's stream reader hands every chunk to `onChunks` (server and demo
// streams alike). From tool calls on resources this keeps:
// - the target: the resource the chat is working on now,
// - the phase: editing while a run touches it, done briefly after,
// - following: whether the main area tracks the target (on at each new run,
//   off once the user stops following or navigates away).
// The controller (app/components/chat-panel/follow-along-controller.tsx) does
// the navigation and query invalidation; pages subscribe to updates to
// refresh in place and flash what changed.

const DONE_VISIBLE_MS = 2600;
export const FLASH_MS = 1200;

export const useFollowAlong = create<FollowState>(() => ({
  target: null,
  phase: 'idle',
  following: true,
  goRequests: 0,
  flashes: {},
}));

const set = useFollowAlong.setState;
const get = useFollowAlong.getState;

const calls = new Map<string, { toolName: string; input: unknown }>();
let doneTimer: ReturnType<typeof setTimeout> | null = null;

function onChunks(chunks: readonly unknown[]): void {
  for (const chunk of chunks) {
    if (!isObject(chunk) || typeof chunk.toolCallId !== 'string') continue;
    if (chunk.type === 'tool-input-available') {
      const toolName = typeof chunk.toolName === 'string' ? chunk.toolName : '';
      if (!followResources.kindOf(toolName)) continue;
      calls.set(chunk.toolCallId, { toolName, input: chunk.input });
      begin();
      const resource = followResources.resolve({
        toolName,
        input: chunk.input,
      });
      if (resource) setTarget(resource);
    } else if (chunk.type === 'tool-output-available') {
      const call = calls.get(chunk.toolCallId);
      if (!call) continue;
      calls.delete(chunk.toolCallId);
      const resource = followResources.resolve({
        ...call,
        output: chunk.output,
      });
      if (!resource) continue;
      setTarget(resource);
      toolDoneListeners.forEach((listener) =>
        listener({ resource, toolName: call.toolName, input: call.input }),
      );
    } else if (chunk.type === 'tool-output-error') {
      calls.delete(chunk.toolCallId);
    }
  }
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

function setTarget(resource: FollowResource): void {
  const current = get().target;
  if (
    current &&
    followResources.keyOf(current) === followResources.keyOf(resource)
  ) {
    if (resource.name && resource.name !== current.name) {
      set({ target: { ...current, name: resource.name } });
    }
    return;
  }
  set({ target: resource });
}

// The run ended (finished, failed, cancelled or the chat switched away).
function endRun(): void {
  calls.clear();
  if (get().phase !== 'editing') return;
  set({ phase: 'done' });
  doneTimer = setTimeout(() => {
    doneTimer = null;
    if (get().phase === 'done') set({ phase: 'idle' });
  }, DONE_VISIBLE_MS);
}

function stopFollowing(): void {
  set({ following: false });
}

// "View" on a tool card: show the resource and follow it again.
function view(resource: FollowResource): void {
  const current = get().target;
  const same =
    current &&
    followResources.keyOf(current) === followResources.keyOf(resource);
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

// ---------------------------------------------------------------------------
// Events: the controller hears each finished tool call, invalidates queries,
// then tells the resource's page it was updated.

const toolDoneListeners = new Set<(change: FollowChange) => void>();
const updateListeners = new Set<(change: FollowChange) => void>();

function onToolDone(listener: (change: FollowChange) => void): () => void {
  toolDoneListeners.add(listener);
  return () => toolDoneListeners.delete(listener);
}

function publishUpdated(change: FollowChange): void {
  updateListeners.forEach((listener) => listener(change));
}

// For a page showing `resource`: runs `handler` after each chat tool call that
// changed it, once its queries are fresh.
export function useOnFollowUpdate(
  resource: Pick<FollowResource, 'kind' | 'id'> | null,
  handler: (change: FollowChange) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const key = resource ? followResources.keyOf(resource) : null;
  useEffect(() => {
    if (!key) return;
    const listener = (change: FollowChange) => {
      if (followResources.keyOf(change.resource) === key) {
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

export type FollowChange = {
  resource: FollowResource;
  toolName: string;
  input: unknown;
};

type FollowState = {
  target: FollowResource | null;
  phase: 'idle' | 'editing' | 'done';
  following: boolean;
  // Bumped by "View", so the controller navigates even if already following.
  goRequests: number;
  // Flash keys currently lit (see flash()), e.g. `flow-step:step_2`.
  flashes: Record<string, number>;
};
