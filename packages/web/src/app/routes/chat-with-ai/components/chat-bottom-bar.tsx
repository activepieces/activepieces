import { t } from 'i18next';
import { ReactNode } from 'react';

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
import { ChatCardSkeleton } from './chat-card-primitives';
import { ChatInput } from './chat-input';
import { ChatModelSelector } from './chat-model-selector';
import { ConnectionPickerCard } from './connection-picker-card';
import { McpReconnectCard, McpReconnectData } from './mcp-reconnect-card';
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
  banner,
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

  let activeCard: ReactNode = null;
  let dismissActiveCard: (() => void) | null = null;

  if (pendingActionPreview) {
    const toolCallId = pendingActionPreview.toolCallId;
    dismissActiveCard = () => rejectGate(toolCallId);
    activeCard = (
      <ActionPreviewCard
        key={toolCallId}
        preview={pendingActionPreview}
        onRun={() => approveGate(toolCallId)}
        onCancel={() => rejectGate(toolCallId)}
        onDismiss={() => rejectGate(toolCallId)}
      />
    );
  } else if (activeDisplayTool) {
    const toolCallId = chatPartUtils.getToolCallId(activeDisplayTool);
    dismissActiveCard = () => rejectGate(toolCallId);
    activeCard = (
      <BlockingDisplayCard
        toolPart={activeDisplayTool}
        toolCallId={toolCallId}
        activeQuestions={activeQuestions}
        approveGate={approveGate}
        rejectGate={rejectGate}
      />
    );
  } else if (hasActiveForm && !isStreaming) {
    dismissActiveCard = () => {
      if (lastMessageId) dismissForm(lastMessageId);
    };
    activeCard = (
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

  // Typing a free-text reply abandons the active card. onSend resets interaction
  // state (clearing dismissals); dismissing afterwards re-marks the gate as
  // dismissed/rejected so the card doesn't flash back before the worker unblocks.
  const handleSend = (text: string, files?: File[]) => {
    void onSend(text, files);
    dismissActiveCard?.();
  };

  return (
    <div className="flex flex-col gap-2">
      {activeCard}
      <div className="overflow-hidden rounded-2xl border border-foreground/20 transition-colors hover:border-foreground/40 focus-within:border-foreground/40">
        {banner}
        <ChatInput
          isStreaming={activeCard ? false : isStreaming}
          onSend={handleSend}
          onStop={onStop}
          onInputChange={onInputChange}
          placeholder={
            activeCard
              ? t('Or reply in your own words')
              : placeholder ?? t('Reply...')
          }
          rightActions={
            <ChatModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          }
        />
      </div>
    </div>
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

  if (toolPart.state === 'input-streaming') {
    return <ChatCardSkeleton />;
  }

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
    case 'ap_show_connection_picker':
      return (
        <ConnectionPickerCard
          picker={data as unknown as ConnectionPickerData}
          onResolve={(payload) => approveGate(toolCallId, payload)}
          onDismiss={() => rejectGate(toolCallId)}
        />
      );
    case 'ap_show_mcp_reconnect':
      return (
        <McpReconnectCard
          reconnect={data as unknown as McpReconnectData}
          onResolve={(payload) => approveGate(toolCallId, payload)}
          onDismiss={() => rejectGate(toolCallId)}
        />
      );
    case 'ap_show_project_picker':
      return (
        <ProjectPickerCard
          picker={data as unknown as ProjectPickerData}
          onResolve={(payload) => approveGate(toolCallId, payload)}
          onDismiss={() => rejectGate(toolCallId)}
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
  banner?: ReactNode;
};
