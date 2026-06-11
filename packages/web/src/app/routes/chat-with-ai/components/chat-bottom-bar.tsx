import { t } from 'i18next';
import { motion } from 'motion/react';

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

import { ActionPreviewCard } from './action-preview-card';
import { ChatInput } from './chat-input';
import { ChatModelSelector } from './chat-model-selector';
import { ConnectionPickerCard } from './connection-picker-card';
import {
  ConnectionRequiredData,
  ConnectionsRequiredCard,
} from './connections-required-card';
import { MultiQuestionForm } from './multi-question-form';
import { ProjectPickerCard } from './project-picker-card';

export function ChatBottomBar({
  isStreaming,
  onSend,
  onStop,
  onInputChange,
  selectedModel,
  onModelChange,
  lastAssistantMessage,
  lastMessageId,
  placeholder,
}: ChatBottomBarProps) {
  const pendingActionPreview = useChatStoreContext((s) =>
    chatStoreSelectors.pendingActionPreview({
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
  const dismissForm = useChatStoreContext((s) => s.dismissForm);

  if (pendingActionPreview) {
    return (
      <ActionPreviewCard
        key={pendingActionPreview.toolCallId}
        preview={pendingActionPreview}
        onRun={() => approveGate(pendingActionPreview.toolCallId)}
        onCancel={() => rejectGate(pendingActionPreview.toolCallId)}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <ChatInput
        isStreaming={isStreaming}
        onSend={onSend}
        onStop={onStop}
        onInputChange={onInputChange}
        placeholder={placeholder ?? t('Reply...')}
        rightActions={
          <ChatModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        }
      />
    </motion.div>
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
  onInputChange?: (hasInput: boolean) => void;
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
  lastAssistantMessage: ChatUIMessage | undefined;
  lastMessageId: string | undefined;
  placeholder?: string;
};
