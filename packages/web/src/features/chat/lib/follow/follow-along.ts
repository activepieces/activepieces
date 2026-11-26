import {
  ApResourceKind,
  isNil,
  isObject,
  tryCatchSync,
} from '@activepieces/core-utils';
import { ResourceChangeOp } from '@activepieces/shared';
import { t } from 'i18next';
import { create } from 'zustand';

import { MOTION } from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { authenticationSession } from '@/lib/authentication-session';

import { ResourceRef, resourceRegistry } from '../resources/registry';

import { aiHighlightKey } from './ai-highlight-key';

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
  const { target, offer: current } = useFollowAlong.getState();
  const known = [target, current?.resource].find(
    (ref) => !isNil(ref) && isSameResource({ a: ref, b: resource }),
  );
  return known?.name ?? null;
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

function onChunks(chunks: readonly unknown[]): void {
  for (const chunk of chunks) {
    if (!isObject(chunk) || typeof chunk.toolCallId !== 'string') continue;
    if (
      chunk.type === 'tool-input-available' &&
      typeof chunk.toolName === 'string'
    ) {
      const { toolCalls } = useFollowMemory.getState();
      useFollowMemory.setState({
        toolCalls: {
          ...toolCalls,
          [chunk.toolCallId]: {
            toolName: chunk.toolName,
            input: chunk.input,
            flow: flowOfInput(chunk.input),
          },
        },
      });
      continue;
    }
    const finished =
      chunk.type === 'tool-output-available' ||
      chunk.type === 'tool-output-error';
    if (!finished) continue;
    const call = takeToolCall(chunk.toolCallId);
    if (!call?.flow || chunk.type !== 'tool-output-available') continue;
    const keys = highlightKeys({
      ...call,
      output: chunk.output,
      ref: call.flow,
    });
    if (keys.length === 0 || !takeNewWrite(call.flow)) continue;
    rememberUnseen({ resource: call.flow, keys });
  }
}

function noteWrite(resource: Pick<ResourceRef, 'kind' | 'id'>): void {
  const key = resourceRegistry.keyOf(resource);
  const { writes } = useFollowMemory.getState();
  useFollowMemory.setState({
    writes: { ...writes, [key]: (writes[key] ?? 0) + 1 },
  });
}

function takeNewWrite(flow: ResourceRef): boolean {
  const key = resourceRegistry.keyOf(flow);
  const { writes, seenWrites } = useFollowMemory.getState();
  const seen = seenWrites[key] ?? 0;
  if ((writes[key] ?? 0) <= seen) return false;
  useFollowMemory.setState({ seenWrites: { ...seenWrites, [key]: seen + 1 } });
  return true;
}

function flowOfInput(input: unknown): ResourceRef | null {
  const projectId = authenticationSession.getProjectId();
  const flowId = isObject(input) ? input.flowId : undefined;
  if (typeof flowId !== 'string' || isNil(projectId)) return null;
  return { kind: ApResourceKind.FLOW, id: flowId, projectId, name: '' };
}

function takeToolCall(toolCallId: string): ToolCall | undefined {
  const { [toolCallId]: call, ...rest } = useFollowMemory.getState().toolCalls;
  if (call) useFollowMemory.setState({ toolCalls: rest });
  return call;
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
  flashPending(resource);
  return !sameKey;
}

function flashWhenFollowed({
  resource,
  keys,
}: {
  resource: Pick<ResourceRef, 'kind' | 'id'>;
  keys: string[];
}): void {
  const justEnded = Date.now() - lastRunEndedAt <= PENDING_FLASH_MS;
  if (isFollowing(resource) || (justEnded && isTarget(resource))) {
    flash(keys);
    return;
  }
  if (keys.length === 0) return;
  pendingFlashes.set(resourceRegistry.keyOf(resource), {
    keys,
    at: Date.now(),
  });
}

function flashPending(resource: Pick<ResourceRef, 'kind' | 'id'>): void {
  const key = resourceRegistry.keyOf(resource);
  const pending = pendingFlashes.get(key);
  if (!pending) return;
  pendingFlashes.delete(key);
  if (Date.now() - pending.at <= PENDING_FLASH_MS && isFollowing(resource)) {
    flash(pending.keys);
  }
}

function forget(resource: ResourceRef): void {
  const { target, offer: current } = useFollowAlong.getState();
  const targetGone = isSameResource({ a: target, b: resource });
  const offerGone = isSameResource({ a: current?.resource, b: resource });
  if (!targetGone && !offerGone) return;
  useFollowAlong.setState({
    target: targetGone ? null : target,
    offer: offerGone ? null : current,
  });
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
    lastRunEndedAt = Date.now();
    useFollowAlong.setState({ phase: 'idle' });
  }
}

function stopFollowing(): void {
  useFollowAlong.setState({ following: false, offer: null });
}

function offer({
  resource,
  runId,
}: {
  resource: ResourceRef;
  runId: string | null;
}): void {
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
  useFollowAlong.setState({ offer: { resource, conversationId, runId } });
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
    push: claimHistoryPush(current.runId),
    name: current.resource.name,
  });
}

function flash(keys: string[]): void {
  const now = Date.now();
  const { flashCount: previousCount, litAt } = useFollowMemory.getState();
  const fresh = keys.filter((key) => now - (litAt[key] ?? 0) >= RELIGHT_MS);
  if (fresh.length === 0) return;
  const flashCount = previousCount + 1;
  useFollowMemory.setState({
    flashCount,
    litAt: { ...litAt, ...Object.fromEntries(fresh.map((key) => [key, now])) },
  });
  const lit = Object.fromEntries(fresh.map((key) => [key, flashCount]));
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
  if (resourceRegistry.isOn({ pathname, ref: resource })) {
    flashWhenFollowed({ resource, keys });
    return;
  }
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
      return stepName ? [aiHighlightKey.step(stepName)] : [];
    }
    case 'ap_update_step':
      return typeof args.stepName === 'string'
        ? [aiHighlightKey.step(args.stepName)]
        : [];
    case 'ap_update_trigger':
      return [aiHighlightKey.step('trigger')];
    case 'ap_add_branch':
    case 'ap_update_branch':
    case 'ap_delete_branch':
      return typeof args.routerStepName === 'string'
        ? [aiHighlightKey.step(args.routerStepName)]
        : [];
    case 'ap_rename_flow':
      return [aiHighlightKey.flowName(ref.id)];
    case 'ap_lock_and_publish':
    case 'ap_change_flow_status':
      return [aiHighlightKey.flowStatus(ref.id)];
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
  return useFollowAlong.getState().phase === 'editing' && isTarget(resource);
}

function isTarget(resource: Pick<ResourceRef, 'kind' | 'id'>): boolean {
  const { target } = useFollowAlong.getState();
  return (
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
    writes: {},
    seenWrites: {},
    litAt: {},
    unseen: {},
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

const pendingFlashes = new Map<string, { keys: string[]; at: number }>();
const RELIGHT_MS = MOTION.highlightMax * 1000;

const PENDING_FLASH_MS = 5000;

let lastRunEndedAt = 0;

export const useFollowAlong = create<FollowState>(initialFollowState);

export const followAlong = {
  startRun,
  runOf,
  knownName,
  onServerChange,
  onChunks,
  flashWhenFollowed,
  endRun,
  stopFollowing,
  offer,
  dismissOffer,
  acceptOffer,
  flash,
  noteWrite,
  isFollowing,
  claimHistoryPush,
  onToolDone,
  takeUnseen,
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

type FollowOffer = {
  resource: ResourceRef;
  conversationId: string | null;
  runId: string | null;
};

type ToolCall = {
  toolName: string;
  input: unknown;
  flow: ResourceRef | null;
};

type FollowMemory = {
  toolCalls: Record<string, ToolCall>;
  unseen: Record<string, true>;
  pushedRuns: Record<string, true>;
  flashCount: number;
  writes: Record<string, number>;
  seenWrites: Record<string, number>;
  litAt: Record<string, number>;
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
