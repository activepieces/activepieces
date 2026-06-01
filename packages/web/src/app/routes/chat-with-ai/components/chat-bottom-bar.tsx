import { t } from 'i18next';

import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import {
  ConnectionPickerData,
  ProjectPickerData,
} from '../lib/message-parsers';

import { ChatInput } from './chat-input';
import { ChatModelSelector } from './chat-model-selector';
import { ConnectionPickerCard } from './connection-picker-card';
import {
  ConnectionRequiredData,
  ConnectionsRequiredCard,
} from './connections-required-card';
import { MultiQuestionForm } from './multi-question-form';
import { PlanApprovalForm } from './plan-approval-form';
import { ProjectPickerCard } from './project-picker-card';
import { ToolApprovalForm } from './tool-approval-form';

export function ChatBottomBar({
  isStreaming,
  onSend,
  onStop,
  selectedModel,
  onModelChange,
  lastAssistantMessage,
  lastMessageId,
}: ChatBottomBarProps) {
  const hasPlanApproval = useChatStoreContext(
    chatStoreSelectors.hasPlanApproval,
  );
  const pendingPlanApproval = useChatStoreContext((s) => s.pendingPlanApproval);
  const approvePlan = useChatStoreContext((s) => s.approvePlan);
  const rejectPlan = useChatStoreContext((s) => s.rejectPlan);
  const dismissPlan = useChatStoreContext((s) => s.dismissPlan);

  const hasActiveApproval = useChatStoreContext(
    chatStoreSelectors.hasActiveApproval,
  );
  const approvalDisplayName = useChatStoreContext(
    chatStoreSelectors.approvalDisplayName,
  );
  const pendingApprovalRequest = useChatStoreContext(
    (s) => s.pendingApprovalRequest,
  );
  const approveToolCall = useChatStoreContext((s) => s.approveToolCall);
  const rejectToolCall = useChatStoreContext((s) => s.rejectToolCall);
  const dismissApproval = useChatStoreContext((s) => s.dismissApproval);

  const activeQuestions = useChatStoreContext((s) =>
    chatStoreSelectors.activeQuestions({ state: s, lastAssistantMessage }),
  );
  const hasActiveForm = useChatStoreContext((s) =>
    chatStoreSelectors.hasActiveForm({ state: s, lastAssistantMessage }),
  );
  const dismissForm = useChatStoreContext((s) => s.dismissForm);
  const displayCard = useChatStoreContext((s) => s.displayCard);
  const resolveDisplayCard = useChatStoreContext((s) => s.resolveDisplayCard);
  const dismissDisplayCard = useChatStoreContext((s) => s.dismissDisplayCard);

  if (hasPlanApproval && pendingPlanApproval) {
    return (
      <PlanApprovalForm
        key={pendingPlanApproval.gateId}
        planSummary={pendingPlanApproval.planSummary}
        steps={pendingPlanApproval.steps}
        onApprove={approvePlan}
        onReject={rejectPlan}
        onDismiss={dismissPlan}
      />
    );
  }

  if (hasActiveApproval) {
    return (
      <ToolApprovalForm
        key={pendingApprovalRequest?.gateId}
        displayName={approvalDisplayName ?? ''}
        onApprove={approveToolCall}
        onReject={rejectToolCall}
        onDismiss={dismissApproval}
      />
    );
  }

  if (displayCard && !displayCard.resolved) {
    return (
      <BlockingDisplayCard
        displayCard={displayCard}
        activeQuestions={activeQuestions}
        resolveDisplayCard={resolveDisplayCard}
        dismissDisplayCard={dismissDisplayCard}
      />
    );
  }

  if (hasActiveForm && !isStreaming) {
    return (
      <MultiQuestionForm
        key={lastMessageId}
        questions={activeQuestions}
        onSubmit={(text) => {
          if (lastMessageId) dismissForm(lastMessageId);
          void onSend(text);
        }}
        onDismiss={() => {
          if (lastMessageId) dismissForm(lastMessageId);
          void onSend(t('Skip these questions'));
        }}
      />
    );
  }

  return (
    <ChatInput
      isStreaming={isStreaming}
      onSend={onSend}
      onStop={onStop}
      placeholder={t('Reply...')}
      rightActions={
        <ChatModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      }
    />
  );
}

function BlockingDisplayCard({
  displayCard,
  activeQuestions,
  resolveDisplayCard,
  dismissDisplayCard,
}: {
  displayCard: { type: string; data: Record<string, unknown>; gateId: string };
  activeQuestions: MultiQuestion[];
  resolveDisplayCard: (payload: Record<string, unknown>) => void;
  dismissDisplayCard: () => void;
}) {
  switch (displayCard.type) {
    case 'data-questions':
      return (
        <MultiQuestionForm
          key={displayCard.gateId}
          questions={activeQuestions}
          onSubmit={(text) => resolveDisplayCard({ answers: text })}
          onDismiss={() => dismissDisplayCard()}
        />
      );
    case 'data-connection-required':
      return (
        <ConnectionsRequiredCard
          connections={[displayCard.data as unknown as ConnectionRequiredData]}
          onResolve={resolveDisplayCard}
        />
      );
    case 'data-connection-picker':
      return (
        <ConnectionPickerCard
          picker={displayCard.data as unknown as ConnectionPickerData}
          onResolve={resolveDisplayCard}
        />
      );
    case 'data-project-picker':
      return (
        <ProjectPickerCard
          picker={displayCard.data as unknown as ProjectPickerData}
          onResolve={resolveDisplayCard}
        />
      );
    default:
      return null;
  }
}

type ChatBottomBarProps = {
  isStreaming: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop: () => void;
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
  lastAssistantMessage: ChatUIMessage | undefined;
  lastMessageId: string | undefined;
};
