import {
  BatchProgressData,
  omit,
  ToolApprovalRequestEvent,
} from '@activepieces/shared';
import { StoreApi, create } from 'zustand';

import { chatApi } from './chat-api';
import { MultiQuestion } from './chat-store-types';
import { AnyToolPart, ChatUIMessage, chatPartUtils } from './chat-types';

function sendApprovalDecision({
  gateId,
  approved,
  payload,
}: {
  gateId: string;
  approved: boolean;
  payload?: Record<string, unknown>;
}): void {
  void chatApi.approveToolCall({ gateId, approved, payload });
}

function extractQuestionsFromInput(part: AnyToolPart | null): MultiQuestion[] {
  if (!part) return [];
  const input = part.input as { questions?: MultiQuestion[] } | undefined;
  return input?.questions ?? [];
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
  approvalRequest?: ToolApprovalRequestEvent;
};

export type ChatStoreState = {
  quickReplies: string[];
  toolCallMeta: Record<string, ToolCallMeta>;
  dismissedGateIds: Record<string, true>;
  lastDismissedFormId: string | null;

  approveGate: (gateId: string, payload?: Record<string, unknown>) => void;
  rejectGate: (gateId: string) => void;
  dismissGate: (gateId: string) => void;
  dismissForm: (messageId: string) => void;
  resetInteractions: () => void;
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

export const createChatStore = () =>
  create<ChatStoreState>((set) => ({
    quickReplies: [],
    toolCallMeta: {},
    dismissedGateIds: {},
    lastDismissedFormId: null,

    approveGate: (gateId: string, payload?: Record<string, unknown>) => {
      set((prev) => dismissAndCleanup(prev, gateId));
      sendApprovalDecision({ gateId, approved: true, payload });
    },
    rejectGate: (gateId: string) => {
      set((prev) => dismissAndCleanup(prev, gateId));
      sendApprovalDecision({ gateId, approved: false });
    },
    dismissGate: (gateId: string) => {
      set((prev) => dismissAndCleanup(prev, gateId));
    },
    dismissForm: (messageId: string) => {
      set({ lastDismissedFormId: messageId });
    },
    resetInteractions: () => {
      set({
        quickReplies: [],
        toolCallMeta: {},
        dismissedGateIds: {},
        lastDismissedFormId: null,
      });
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
      p.state === 'input-available',
  });
  return isNotDismissed(part, state) ? part : null;
}

function selectPendingPlanApproval({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): AnyToolPart | null {
  const part = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (name, p) =>
      name === 'ap_request_plan_approval' && p.state === 'input-available',
  });
  return isNotDismissed(part, state) ? part : null;
}

function selectPendingMcpApproval({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): { toolCallId: string; toolName: string; displayName: string } | null {
  const part = chatPartUtils.findLastToolPart({
    message: lastAssistantMessage,
    predicate: (_name, p) => {
      if (p.state !== 'input-available') return false;
      const id = chatPartUtils.getToolCallId(p);
      return !!id && !!state.toolCallMeta[id]?.approvalRequest;
    },
  });
  if (!isNotDismissed(part, state)) return null;
  const toolCallId = chatPartUtils.getToolCallId(part);
  const meta = state.toolCallMeta[toolCallId]?.approvalRequest;
  if (!meta) return null;
  return {
    toolCallId,
    toolName: meta.toolName,
    displayName: meta.displayName,
  };
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
      if (name === 'ap_request_plan_approval') return true;
      return !!state.toolCallMeta[id]?.approvalRequest;
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

export const chatStoreSelectors = {
  activeDisplayTool: selectActiveDisplayTool,
  pendingPlanApproval: selectPendingPlanApproval,
  pendingMcpApproval: selectPendingMcpApproval,
  activeQuestions: selectActiveQuestions,
  hasActiveForm: selectHasActiveForm,
  hasBlockingCard: selectHasBlockingCard,
  batchProgress: selectBatchProgress,
};

export type SetChatStore = StoreApi<ChatStoreState>['setState'];
export type GetChatStore = StoreApi<ChatStoreState>['getState'];
