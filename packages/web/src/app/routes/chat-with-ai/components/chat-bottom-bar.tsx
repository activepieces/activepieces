import { t } from 'i18next';

import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';

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
  const pendingPlanPart = useChatStoreContext((s) =>
    chatStoreSelectors.pendingPlanApproval({
      state: s,
      lastAssistantMessage,
    }),
  );
  const pendingMcpApproval = useChatStoreContext((s) =>
    chatStoreSelectors.pendingMcpApproval({
      state: s,
      lastAssistantMessage,
    }),
  );
  const activeDisplayTool = useChatStoreContext((s) =>
    chatStoreSelectors.activeDisplayTool({
      state: s,
      lastAssistantMessage,
    }),
  );
  const activeQuestions = useChatStoreContext((s) =>
    chatStoreSelectors.activeQuestions({ state: s, lastAssistantMessage }),
  );
  const hasActiveForm = useChatStoreContext((s) =>
    chatStoreSelectors.hasActiveForm({ state: s, lastAssistantMessage }),
  );

  const approveGate = useChatStoreContext((s) => s.approveGate);
  const rejectGate = useChatStoreContext((s) => s.rejectGate);
  const dismissGate = useChatStoreContext((s) => s.dismissGate);
  const dismissForm = useChatStoreContext((s) => s.dismissForm);

  // Plan approval from tool state
  if (pendingPlanPart) {
    const input = pendingPlanPart.input as
      | { planSummary?: string; steps?: string[] }
      | undefined;
    const toolCallId = chatPartUtils.getToolCallId(pendingPlanPart);
    return (
      <PlanApprovalForm
        key={toolCallId}
        planSummary={input?.planSummary ?? ''}
        steps={input?.steps ?? []}
        onApprove={() => approveGate(toolCallId)}
        onReject={() => rejectGate(toolCallId)}
        onDismiss={() => dismissGate(toolCallId)}
      />
    );
  }

  // MCP tool approval from toolCallMeta
  if (pendingMcpApproval) {
    return (
      <ToolApprovalForm
        key={pendingMcpApproval.toolCallId}
        displayName={pendingMcpApproval.displayName}
        onApprove={() => approveGate(pendingMcpApproval.toolCallId)}
        onReject={() => rejectGate(pendingMcpApproval.toolCallId)}
        onDismiss={() => dismissGate(pendingMcpApproval.toolCallId)}
      />
    );
  }

  // Display tool card (connection picker, questions, etc.) from tool state
  if (activeDisplayTool) {
    const toolCallId = chatPartUtils.getToolCallId(activeDisplayTool);
    return (
      <BlockingDisplayCard
        toolPart={activeDisplayTool}
        toolCallId={toolCallId}
        activeQuestions={activeQuestions}
        approveGate={approveGate}
        rejectGate={rejectGate}
      />
    );
  }

  // Questions from history (tool already completed but not dismissed)
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
  toolPart,
  toolCallId,
  activeQuestions,
  approveGate,
  rejectGate,
}: {
  toolPart: AnyToolPart;
  toolCallId: string;
  activeQuestions: MultiQuestion[];
  approveGate: (gateId: string, payload?: Record<string, unknown>) => void;
  rejectGate: (gateId: string) => void;
}) {
  const toolName = chatPartUtils.getToolPartName(toolPart);
  const data = toolPart.input as Record<string, unknown>;

  switch (toolName) {
    case 'ap_show_questions':
      return (
        <MultiQuestionForm
          key={toolCallId}
          questions={activeQuestions}
          onSubmit={(text) => approveGate(toolCallId, { answers: text })}
          onDismiss={() => rejectGate(toolCallId)}
        />
      );
    case 'ap_show_connection_required':
      return (
        <ConnectionsRequiredCard
          connections={[data as unknown as ConnectionRequiredData]}
          onResolve={(payload) => approveGate(toolCallId, payload)}
        />
      );
    case 'ap_show_connection_picker':
      return (
        <ConnectionPickerCard
          picker={data as unknown as ConnectionPickerData}
          onResolve={(payload) => approveGate(toolCallId, payload)}
        />
      );
    case 'ap_show_project_picker':
      return (
        <ProjectPickerCard
          picker={data as unknown as ProjectPickerData}
          onResolve={(payload) => approveGate(toolCallId, payload)}
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
