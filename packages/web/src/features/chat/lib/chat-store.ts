import { omit } from '@activepieces/core-utils';
import {
  ActionPreviewEvent,
  ActionReceiptEvent,
  BatchProgressData,
  BuildPlanEvent,
  FileProducedEvent,
  ImageGeneratedEvent,
} from '@activepieces/shared';
import { StoreApi, create } from 'zustand';

import { chatApi } from './chat-api';
import {
  MultiQuestion,
  RawMultiQuestion,
  normalizeQuestion,
} from './chat-store-types';
import { AnyToolPart, ChatUIMessage, chatPartUtils } from './chat-types';

function sendApprovalDecision({
  gateId,
  approved,
  payload,
  conversationId,
  onAnswered,
  onRouteFailed,
}: {
  gateId: string;
  approved: boolean;
  payload?: Record<string, unknown>;
  conversationId: string;
  onAnswered?: () => void;
  onRouteFailed?: () => void;
}): void {
  void chatApi
    .approveToolCall({ gateId, approved, payload, conversationId })
    .then((result) => {
      // The server couldn't route this answer (no live worker and no parked card) — bring the card
      // back so the user can retry rather than losing their answer silently.
      if (result && result.success === false) {
        onRouteFailed?.();
      }
    })
    .catch(() => onRouteFailed?.())
    .finally(() => onAnswered?.());
}

function extractQuestionsFromInput(part: AnyToolPart | null): MultiQuestion[] {
  if (!part) return [];
  const input = part.input as { questions?: RawMultiQuestion[] } | undefined;
  return (input?.questions ?? []).map(normalizeQuestion);
}

function isNotDismissed(
  part: AnyToolPart | null,
  state: ChatStoreState,
): part is AnyToolPart {
  if (!part) return false;
  return !state.dismissedGateIds[chatPartUtils.getToolCallId(part)];
}

export type ToolCallMeta = {
  batchProgress?: BatchProgressData;
  actionPreview?: ActionPreviewEvent;
  actionReceipt?: ActionReceiptEvent;
  image?: ImageGeneratedEvent;
  files?: FileProducedEvent[];
};

export type BuildState = BuildPlanEvent;

export type ChatStoreState = {
  quickReplies: string[];
  offerRecurringAutomation: boolean;
  toolCallMeta: Record<string, ToolCallMeta>;
  builds: Record<string, BuildState>;
  dismissedGateIds: Record<string, true>;
  lastDismissedFormId: string | null;
  // Set by use-chat: called after a gate decision is delivered. When the conversation had parked
  // (its worker gone), answering enqueues a resume turn server-side — this reconnects the client to
  // the conversation's live stream so the resume streams in without a reload. A no-op mid-stream.
  onGateAnswered: (() => void) | null;
  // The conversation this panel is bound to; sent with a gate answer so the server can route a
  // parked answer even after the Redis gate mapping's TTL / a Redis restart.
  conversationId: string | null;

  approveGate: (gateId: string, payload?: Record<string, unknown>) => void;
  rejectGate: (gateId: string) => void;
  dismissGate: (gateId: string) => void;
  dismissForm: (messageId: string) => void;
  setOnGateAnswered: (handler: (() => void) | null) => void;
  setConversationId: (conversationId: string | null) => void;
  resetInteractions: () => void;
  resetBuilds: () => void;
};

export type ChatStore = ReturnType<typeof createChatStore>;

function dismissAndCleanup(
  prev: ChatStoreState,
  gateId: string,
): Partial<ChatStoreState> {
  return {
    dismissedGateIds: { ...prev.dismissedGateIds, [gateId]: true },
    toolCallMeta: omit(prev.toolCallMeta, [gateId]),
  };
}

// Reverse of the optimistic dismiss: restore the card when the server reports the answer routed
// nowhere, so the user can retry instead of losing it. Only clears the dismissed flag — the
// toolCallMeta rehydrates from history/pending-gate polling.
function undismissGate(
  prev: ChatStoreState,
  gateId: string,
): Partial<ChatStoreState> {
  return {
    dismissedGateIds: omit(prev.dismissedGateIds, [gateId]),
  };
}

export const createChatStore = () =>
  create<ChatStoreState>((set, get) => ({
    quickReplies: [],
    offerRecurringAutomation: false,
    toolCallMeta: {},
    builds: {},
    dismissedGateIds: {},
    lastDismissedFormId: null,
    onGateAnswered: null,
    conversationId: null,

    approveGate: (gateId: string, payload?: Record<string, unknown>) => {
      const conversationId = get().conversationId;
      if (!conversationId) return;
      const onAnswered = get().onGateAnswered ?? undefined;
      set((prev) => dismissAndCleanup(prev, gateId));
      sendApprovalDecision({
        gateId,
        approved: true,
        payload,
        conversationId,
        onAnswered,
        onRouteFailed: () => set((prev) => undismissGate(prev, gateId)),
      });
    },
    rejectGate: (gateId: string) => {
      const conversationId = get().conversationId;
      if (!conversationId) return;
      const onAnswered = get().onGateAnswered ?? undefined;
      set((prev) => dismissAndCleanup(prev, gateId));
      sendApprovalDecision({
        gateId,
        approved: false,
        conversationId,
        onAnswered,
        onRouteFailed: () => set((prev) => undismissGate(prev, gateId)),
      });
    },
    dismissGate: (gateId: string) => {
      set((prev) => dismissAndCleanup(prev, gateId));
    },
    dismissForm: (messageId: string) => {
      set({ lastDismissedFormId: messageId });
    },
    setOnGateAnswered: (handler: (() => void) | null) => {
      set({ onGateAnswered: handler });
    },
    setConversationId: (conversationId: string | null) => {
      set({ conversationId });
    },
    resetInteractions: () => {
      set({
        quickReplies: [],
        offerRecurringAutomation: false,
        toolCallMeta: {},
        dismissedGateIds: {},
        lastDismissedFormId: null,
      });
    },
    resetBuilds: () => {
      set({ builds: {} });
    },
  }));

function selectActiveDisplayTool({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): AnyToolPart | null {
  const part = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (name, p) =>
      chatPartUtils.isDisplayTool(name) &&
      name !== 'ap_show_quick_replies' &&
      (p.state === 'input-streaming' || p.state === 'input-available'),
  });
  return isNotDismissed(part, state) ? part : null;
}

function selectPendingActionPreview({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): ActionPreviewEvent | null {
  const part = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (_name, p) => {
      if (p.state !== 'input-available') return false;
      const id = chatPartUtils.getToolCallId(p);
      return !!id && !!state.toolCallMeta[id]?.actionPreview;
    },
  });
  if (!isNotDismissed(part, state)) return null;
  const toolCallId = chatPartUtils.getToolCallId(part);
  return state.toolCallMeta[toolCallId]?.actionPreview ?? null;
}

function selectActiveQuestions({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): MultiQuestion[] {
  const activeTool = selectActiveDisplayTool({ state, lastAssistantMessage });
  if (
    activeTool &&
    chatPartUtils.getToolPartName(activeTool) === 'ap_show_questions'
  ) {
    return extractQuestionsFromInput(activeTool);
  }
  const historyPart = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (name, p) =>
      name === 'ap_show_questions' && p.state !== 'output-available',
  });
  return extractQuestionsFromInput(historyPart);
}

function selectHasActiveForm({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): boolean {
  const questions = selectActiveQuestions({ state, lastAssistantMessage });
  if (questions.length === 0) return false;
  const activeTool = selectActiveDisplayTool({ state, lastAssistantMessage });
  if (
    activeTool &&
    chatPartUtils.getToolPartName(activeTool) === 'ap_show_questions'
  ) {
    return true;
  }
  return (
    !!lastAssistantMessage &&
    lastAssistantMessage.id !== state.lastDismissedFormId
  );
}

function selectHasBlockingCard({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): boolean {
  const part = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (name, p) => {
      if (p.state !== 'input-available') return false;
      const id = chatPartUtils.getToolCallId(p);
      if (state.dismissedGateIds[id]) return false;
      if (chatPartUtils.isDisplayTool(name) && name !== 'ap_show_quick_replies')
        return true;
      return !!state.toolCallMeta[id]?.actionPreview;
    },
  });
  return part !== null;
}

function selectBatchProgress({
  state,
  toolCallId,
}: {
  state: ChatStoreState;
  toolCallId: string;
}): BatchProgressData | undefined {
  return state.toolCallMeta[toolCallId]?.batchProgress;
}

function selectBuildById({
  state,
  buildId,
}: {
  state: ChatStoreState;
  buildId: string;
}): BuildState | undefined {
  return state.builds[buildId];
}

function mergeBuildPlan({
  builds,
  event,
}: {
  builds: Record<string, BuildState>;
  event: BuildPlanEvent;
}): Record<string, BuildState> {
  const existing = builds[event.buildId];
  if (existing && existing.updatedAt > event.updatedAt) {
    return builds;
  }
  return {
    ...builds,
    [event.buildId]: event,
  };
}

export const chatStoreSelectors = {
  activeDisplayTool: selectActiveDisplayTool,
  pendingActionPreview: selectPendingActionPreview,
  activeQuestions: selectActiveQuestions,
  hasActiveForm: selectHasActiveForm,
  hasBlockingCard: selectHasBlockingCard,
  batchProgress: selectBatchProgress,
  buildById: selectBuildById,
};

export const chatBuildUtils = {
  mergeBuildPlan,
};

export type SetChatStore = StoreApi<ChatStoreState>['setState'];
export type GetChatStore = StoreApi<ChatStoreState>['getState'];
