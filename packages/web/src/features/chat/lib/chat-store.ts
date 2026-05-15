import {
  PlanApprovalRequest,
  PlanStepUpdate,
  ToolApprovalRequest,
} from '@activepieces/shared';
import { StoreApi, create } from 'zustand';

import { api } from '@/lib/api';

import { MultiQuestion, PlanProgressData } from './chat-store-types';
import { AnyToolPart, ChatUIMessage, chatPartUtils } from './chat-types';

function sendApprovalDecision({
  gateId,
  approved,
}: {
  gateId: string;
  approved: boolean;
}): void {
  void api.post(`/v1/chat/tool-approvals/${gateId}`, { approved });
}

function extractQuestionsFromToolParts(
  message: ChatUIMessage | undefined,
): MultiQuestion[] {
  if (!message || message.role !== 'assistant') return [];
  const questionPart = message.parts.find(
    (p) =>
      chatPartUtils.isAnyToolPart(p) &&
      chatPartUtils.getToolPartName(p) === 'ap_show_questions',
  );
  if (!questionPart || !chatPartUtils.isAnyToolPart(questionPart)) return [];
  const input = questionPart.input as
    | { questions?: MultiQuestion[] }
    | undefined;
  return input?.questions ?? [];
}

type StepCategory = {
  keywords: string[];
  tools: string[];
};

const STEP_CATEGORIES: StepCategory[] = [
  {
    keywords: ['create flow', 'create a flow', 'new flow'],
    tools: ['ap_create_flow', 'ap_build_flow'],
  },
  {
    keywords: ['trigger', 'set trigger', 'configure trigger'],
    tools: ['ap_update_trigger'],
  },
  {
    keywords: [
      'action',
      'step',
      'add step',
      'add action',
      'configure action',
      'configure step',
    ],
    tools: ['ap_add_step'],
  },
  {
    keywords: ['validate', 'test'],
    tools: ['ap_validate_flow', 'ap_test_flow', 'ap_test_step'],
  },
  {
    keywords: ['note', 'notes', 'add note', 'summary note'],
    tools: ['ap_manage_notes'],
  },
  {
    keywords: ['publish', 'enable', 'activate', 'draft'],
    tools: ['ap_lock_and_publish', 'ap_change_flow_status'],
  },
];

function deriveStepStatus({
  stepText,
  toolParts,
}: {
  stepText: string;
  toolParts: AnyToolPart[];
}): 'pending' | 'executing' | 'done' {
  const lower = stepText.toLowerCase();
  const category = STEP_CATEGORIES.find((c) =>
    c.keywords.some((kw) => {
      const idx = lower.indexOf(kw);
      if (idx === -1) return false;
      const before = idx === 0 || /\W/.test(lower[idx - 1]);
      const after =
        idx + kw.length >= lower.length || /\W/.test(lower[idx + kw.length]);
      return before && after;
    }),
  );

  if (!category) return 'pending';

  const matchingTools = toolParts.filter((p) => {
    const name = chatPartUtils.getToolPartName(p);
    return category.tools.some((t) => name === t);
  });

  if (matchingTools.length === 0) return 'pending';
  if (matchingTools.some((t) => t.state === 'output-available')) return 'done';
  if (
    matchingTools.some(
      (t) => t.state === 'input-available' || t.state === 'input-streaming',
    )
  )
    return 'executing';
  return 'pending';
}

function extractPlanFromToolParts(
  message: ChatUIMessage | undefined,
): PlanProgressData | null {
  if (!message || message.role !== 'assistant') return null;
  const planPart = message.parts.find(
    (p): p is AnyToolPart =>
      chatPartUtils.isAnyToolPart(p) &&
      chatPartUtils.getToolPartName(p) === 'ap_request_plan_approval',
  );
  if (!planPart) return null;
  const toolOutput = chatPartUtils.parseTypedToolOutput(
    planPart,
    'ap_request_plan_approval',
  );
  if (toolOutput.state === 'error') return null;
  if (toolOutput.state === 'success' && !toolOutput.data.success) return null;
  const input = planPart.input as
    | { planSummary?: string; steps?: string[] }
    | undefined;
  const steps = input?.steps ?? [];
  if (steps.length === 0) return null;
  return { title: input?.planSummary ?? '', steps };
}

export type ChatStoreState = {
  pendingApprovalRequest: ToolApprovalRequest | null;
  pendingPlanApproval: PlanApprovalRequest | null;
  planProgressUpdates: PlanStepUpdate[];
  planRejected: boolean;
  displayCard: { type: string; data: Record<string, unknown> } | null;
  quickReplies: string[];

  dismissedApprovalGateId: string | null;
  dismissedPlanGateId: string | null;

  thinkingPanelMessageId: string | null;
  lastDismissedFormId: string | null;

  approveToolCall: () => void;
  rejectToolCall: () => void;
  dismissApproval: () => void;

  approvePlan: () => void;
  rejectPlan: () => void;
  dismissPlan: () => void;

  openThinkingDetails: (messageId: string) => void;
  closeThinkingPanel: () => void;
  dismissForm: (messageId: string) => void;

  resetInteractions: () => void;
};

export type ChatStore = ReturnType<typeof createChatStore>;

export const createChatStore = () =>
  create<ChatStoreState>((set, get) => ({
    pendingApprovalRequest: null,
    pendingPlanApproval: null,
    planProgressUpdates: [],
    planRejected: false,
    displayCard: null,
    quickReplies: [],

    dismissedApprovalGateId: null,
    dismissedPlanGateId: null,

    thinkingPanelMessageId: null,
    lastDismissedFormId: null,

    approveToolCall: () => {
      const req = get().pendingApprovalRequest;
      if (!req) return;
      set({ dismissedApprovalGateId: req.gateId });
      sendApprovalDecision({ gateId: req.gateId, approved: true });
    },
    rejectToolCall: () => {
      const req = get().pendingApprovalRequest;
      if (!req) return;
      set({ dismissedApprovalGateId: req.gateId });
      sendApprovalDecision({ gateId: req.gateId, approved: false });
    },
    dismissApproval: () => {
      const req = get().pendingApprovalRequest;
      if (req) set({ dismissedApprovalGateId: req.gateId });
    },

    approvePlan: () => {
      const plan = get().pendingPlanApproval;
      if (!plan) return;
      set({ dismissedPlanGateId: plan.gateId });
      sendApprovalDecision({ gateId: plan.gateId, approved: true });
    },
    rejectPlan: () => {
      const plan = get().pendingPlanApproval;
      if (!plan) return;
      set({ dismissedPlanGateId: plan.gateId, planRejected: true });
      sendApprovalDecision({ gateId: plan.gateId, approved: false });
    },
    dismissPlan: () => {
      const plan = get().pendingPlanApproval;
      if (plan) set({ dismissedPlanGateId: plan.gateId });
    },

    openThinkingDetails: (messageId: string) => {
      set({ thinkingPanelMessageId: messageId });
    },
    closeThinkingPanel: () => {
      set({ thinkingPanelMessageId: null });
    },
    dismissForm: (messageId: string) => {
      set({ lastDismissedFormId: messageId });
    },

    resetInteractions: () => {
      set({
        pendingApprovalRequest: null,
        pendingPlanApproval: null,
        planProgressUpdates: [],
        quickReplies: [],
        displayCard: null,
        planRejected: false,
      });
    },
  }));

function selectHasActiveApproval(s: ChatStoreState): boolean {
  return (
    s.pendingApprovalRequest !== null &&
    s.pendingApprovalRequest.gateId !== s.dismissedApprovalGateId
  );
}

function selectApprovalDisplayName(s: ChatStoreState): string | null {
  return s.pendingApprovalRequest?.displayName ?? null;
}

function selectHasPlanApproval(s: ChatStoreState): boolean {
  return (
    s.pendingPlanApproval !== null &&
    s.pendingPlanApproval.gateId !== s.dismissedPlanGateId
  );
}

function selectActiveQuestions({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): MultiQuestion[] {
  if (state.displayCard?.type === 'data-questions') {
    const input = state.displayCard.data as { questions?: MultiQuestion[] };
    return input.questions ?? [];
  }
  return extractQuestionsFromToolParts(lastAssistantMessage);
}

function selectHasActiveForm({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): boolean {
  const questions = selectActiveQuestions({ state, lastAssistantMessage });
  return (
    questions.length > 0 &&
    (state.displayCard?.type === 'data-questions' ||
      (!!lastAssistantMessage &&
        lastAssistantMessage.id !== state.lastDismissedFormId))
  );
}

function selectPlanProgress({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): PlanProgressData | null {
  if (state.pendingPlanApproval && state.pendingPlanApproval.steps.length > 0) {
    return {
      title: state.pendingPlanApproval.planSummary,
      steps: state.pendingPlanApproval.steps,
    };
  }
  return extractPlanFromToolParts(lastAssistantMessage);
}

function selectEffectivePlanUpdates({
  state,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  lastAssistantMessage: ChatUIMessage | undefined;
}): PlanStepUpdate[] {
  const progress = selectPlanProgress({ state, lastAssistantMessage });
  if (!progress || !lastAssistantMessage) return [];

  const toolParts = lastAssistantMessage.parts.filter((p): p is AnyToolPart =>
    chatPartUtils.isAnyToolPart(p),
  );

  if (toolParts.length === 0) return state.planProgressUpdates;

  return progress.steps.map((stepText, i) => ({
    stepIndex: i,
    status: deriveStepStatus({ stepText, toolParts }),
  }));
}

function selectShouldShowPlan({
  state,
  isStreaming,
  isLastAssistant,
  lastAssistantMessage,
}: {
  state: ChatStoreState;
  isStreaming: boolean;
  isLastAssistant: boolean;
  lastAssistantMessage: ChatUIMessage | undefined;
}): boolean {
  const progress = selectPlanProgress({ state, lastAssistantMessage });
  const planWasExecuted =
    selectEffectivePlanUpdates({ state, lastAssistantMessage }).length > 0;
  return (
    isLastAssistant &&
    progress !== null &&
    !selectHasPlanApproval(state) &&
    !state.planRejected &&
    (!isStreaming || planWasExecuted)
  );
}

export const chatStoreSelectors = {
  hasActiveApproval: selectHasActiveApproval,
  approvalDisplayName: selectApprovalDisplayName,
  hasPlanApproval: selectHasPlanApproval,
  activeQuestions: selectActiveQuestions,
  hasActiveForm: selectHasActiveForm,
  planProgress: selectPlanProgress,
  effectivePlanUpdates: selectEffectivePlanUpdates,
  shouldShowPlan: selectShouldShowPlan,
};

export type SetChatStore = StoreApi<ChatStoreState>['setState'];
export type GetChatStore = StoreApi<ChatStoreState>['getState'];
