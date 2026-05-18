import { t } from 'i18next';

import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import { ChatInput } from './chat-input';
import { ChatModelSelector } from './chat-model-selector';
import { MultiQuestionForm } from './multi-question-form';
import { PlanApprovalForm } from './plan-approval-form';
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

  if (hasActiveForm) {
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

type ChatBottomBarProps = {
  isStreaming: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop: () => void;
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
  lastAssistantMessage: ChatUIMessage | undefined;
  lastMessageId: string | undefined;
};
