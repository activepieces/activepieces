import { isObject, tryCatchSync } from '@activepieces/core-utils';
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
    if (
      chunk.type === 'tool-input-available' &&
      typeof chunk.toolCallId === 'string' &&
      typeof chunk.toolName === 'string'
    ) {
      const { toolCalls } = useFollowMemory.getState();
      useFollowMemory.setState({
        toolCalls: {
          ...toolCalls,
          [chunk.toolCallId]: {
            toolName: chunk.toolName,
            input: chunk.input,
            startedAt: Date.now(),
          },
        },
      });
      continue;
    }
    const finished =
      chunk.type === 'tool-output-available' ||
      chunk.type === 'tool-output-error';
    if (!finished) continue;
    const call =
      typeof chunk.toolCallId === 'string'
        ? takeToolCall(chunk.toolCallId)
        : undefined;
    if (chunk.type !== 'tool-output-available') continue;
    const resolved = resourceRegistry.resolve(chunk.output);
    if (!resolved) continue;
    if (call && resolved.op !== 'delete') {
      rememberEditedSince({ resource: resolved.ref, since: call.startedAt });
    }
    if (call) {
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

function takeToolCall(toolCallId: string): ToolCall | undefined {
  const { [toolCallId]: call, ...rest } = useFollowMemory.getState().toolCalls;
  if (call) useFollowMemory.setState({ toolCalls: rest });
  return call;
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

function flash(keys: string[]): void {
  if (keys.length === 0) return;
  const flashCount = useFollowMemory.getState().flashCount + 1;
  useFollowMemory.setState({ flashCount });
  const lit = Object.fromEntries(keys.map((key) => [key, flashCount]));
  useFollowAlong.setState({
    flashes: { ...useFollowAlong.getState().flashes, ...lit },
  });
}

function rememberUnseen({
  resource,
  keys,
}: {
  resource: ResourceRef;
  keys: string[];
}): void {
  if (keys.length === 0) return;
  const pathname = window.location.pathname;
  if (resourceRegistry.isOn({ pathname, ref: resource })) return;
  const scope = resourceRegistry.keyOf(resource);
  const added = Object.fromEntries(
    keys.map((key): [string, true] => [`${scope}|${key}`, true]),
  );
  const { unseen } = useFollowMemory.getState();
  useFollowMemory.setState({ unseen: { ...unseen, ...added } });
}

function takeUnseen({
  resource,
  key,
}: {
  resource: Pick<ResourceRef, 'kind' | 'id'>;
  key: string;
}): boolean {
  const unseenKey = `${resourceRegistry.keyOf(resource)}|${key}`;
  const { [unseenKey]: seen, ...rest } = useFollowMemory.getState().unseen;
  if (!seen) return false;
  useFollowMemory.setState({ unseen: rest });
  return true;
}

function rememberEditedSince({
  resource,
  since,
}: {
  resource: ResourceRef;
  since: number;
}): void {
  const pathname = window.location.pathname;
  if (resourceRegistry.isOn({ pathname, ref: resource })) return;
  const scope = resourceRegistry.keyOf(resource);
  const { editedSince } = useFollowMemory.getState();
  const earliest = Math.min(editedSince[scope] ?? since, since);
  if (editedSince[scope] === earliest) return;
  useFollowMemory.setState({
    editedSince: { ...editedSince, [scope]: earliest },
  });
}

function peekEditedSince(
  resource: Pick<ResourceRef, 'kind' | 'id'>,
): number | null {
  return (
    useFollowMemory.getState().editedSince[resourceRegistry.keyOf(resource)] ??
    null
  );
}

function forgetEditedSince(resource: Pick<ResourceRef, 'kind' | 'id'>): void {
  const scope = resourceRegistry.keyOf(resource);
  const { [scope]: known, ...rest } = useFollowMemory.getState().editedSince;
  if (known === undefined) return;
  useFollowMemory.setState({ editedSince: rest });
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
      const stepName = structuredField({ output, field: 'stepName' });
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

function structuredField({
  output,
  field,
}: {
  output: unknown;
  field: string;
}): string | null {
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
    flashes: {},
    scrollTaken: false,
    liveRuns: {},
    offer: null,
  };
}

function initialMemory(): FollowMemory {
  return {
    toolCalls: {},
    unseen: {},
    editedSince: {},
    pushedRuns: {},
    flashCount: 0,
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
  flash,
  isFollowing,
  claimHistoryPush,
  onToolDone,
  takeUnseen,
  peekEditedSince,
  forgetEditedSince,
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

export type FollowOffer = {
  resource: ResourceRef;
  conversationId: string | null;
};

type ToolCall = { toolName: string; input: unknown; startedAt: number };

type FollowMemory = {
  toolCalls: Record<string, ToolCall>;
  unseen: Record<string, true>;
  editedSince: Record<string, number>;
  pushedRuns: Record<string, true>;
  flashCount: number;
};

type FollowState = {
  target: ResourceRef | null;
  phase: 'idle' | 'editing';
  following: boolean;
  flashes: Record<string, number>;
  scrollTaken: boolean;
  liveRuns: Record<string, RunContext>;
  offer: FollowOffer | null;
};
