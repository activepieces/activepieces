import { t } from 'i18next';
import { CircleSlash } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { followHold } from '@/features/chat/lib/follow/follow-hold';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { cn } from '@/lib/utils';

import {
  isConnectionPickerData,
  ProjectPickerData,
} from '../lib/message-parsers';

import { ActionPreviewCard } from './action-preview-card';
import { ChatCardSkeleton } from './chat-card-primitives';
import { ChatInput, ComposerFill } from './chat-input';
import { ConnectionPickerCard } from './connection-picker-card';
import { FollowFinishedNote } from './follow-finished-note';
import { McpReconnectCard, McpReconnectData } from './mcp-reconnect-card';
import { MultiQuestionForm } from './multi-question-form';
import { ProjectPickerCard } from './project-picker-card';

export function ChatBottomBar({
  isStreaming,
  onSend,
  onStop,
  onInputChange,
  modelPicker,
  sendBlockedReason,
  lastAssistantMessage,
  lastMessageId,
  placeholder,
  banner,
  recede,
  fill,
  onFillApplied,
  autoFocus,
}: ChatBottomBarProps) {
  const [composerEngaged, setComposerEngaged] = useState(false);
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    if (!skipped) return;
    const timer = setTimeout(() => setSkipped(false), SKIPPED_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [skipped]);
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
    if (dismissActiveCard) {
      dismissActiveCard();
      setSkipped(true);
    }
  };

  const minimal = recede === true && !activeCard && !composerEngaged;
  const needsYou = activeCard !== null;
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chatDom.inChat(rootRef.current)) return;
    useChatPanel.getState().setGateOpen(needsYou);
    return () => useChatPanel.getState().setGateOpen(false);
  }, [needsYou]);

  // Tell follow-along when the user is mid-reply, so it waits before opening
  // a page.
  const [hasDraft, setHasDraft] = useState(false);
  const handleInputChange = (hasInput: boolean) => {
    setHasDraft(hasInput);
    onInputChange?.(hasInput);
  };
  const drafting = hasDraft && composerEngaged;
  useEffect(() => {
    if (!chatDom.inChat(rootRef.current)) return;
    followHold.report({ drafting });
    return () => followHold.report({ drafting: false });
  }, [drafting]);

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      {activeCard ?? <FollowFinishedNote />}
      <AnimatePresence initial={false}>
        {skipped && !activeCard && (
          <motion.div
            key="skipped"
            role="status"
            className="flex items-center gap-1.5 px-1 text-xs text-gray-11"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CircleSlash className="size-3" />
            {t('Skipped')}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={cn(
          'overflow-hidden rounded-xl border transition-colors',
          minimal
            ? 'border-transparent bg-transparent hover:bg-gray-3/30'
            : 'border-gray-6 hover:border-gray-8 focus-within:border-gray-8',
        )}
      >
        {banner}
        <ChatInput
          isStreaming={activeCard ? false : isStreaming}
          onSend={handleSend}
          onStop={onStop}
          onInputChange={handleInputChange}
          minimalUntilFocus={recede === true && !activeCard}
          onFocusChange={setComposerEngaged}
          placeholder={
            activeCard
              ? t('Answer the card above, or reply to change the plan')
              : placeholder ?? t('Reply...')
          }
          rightActions={modelPicker}
          sendBlockedReason={sendBlockedReason}
          fill={fill}
          onFillApplied={onFillApplied}
          autoFocus={autoFocus}
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
      if (!isConnectionPickerData(data)) return null;
      return (
        <ConnectionPickerCard
          picker={data}
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
  modelPicker?: ReactNode;
  sendBlockedReason?: string;
  lastAssistantMessage: ChatUIMessage | undefined;
  lastMessageId: string | undefined;
  placeholder?: string;
  banner?: ReactNode;
  recede?: boolean;
  fill?: ComposerFill | null;
  onFillApplied?: () => void;
  autoFocus?: boolean;
};

const SKIPPED_VISIBLE_MS = 2500;
