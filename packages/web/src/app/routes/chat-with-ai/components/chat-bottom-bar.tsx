import { t } from 'i18next';
import { CircleSlash } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { ChatOfferPill } from '@/app/components/chat-panel/chat-offer-pill';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { useOpenResourceRequests } from '@/features/chat/lib/use-open-resource';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { cn } from '@/lib/utils';

import {
  isConnectionPickerData,
  ProjectPickerData,
} from '../lib/message-parsers';
import { secretRequestUtils } from '../lib/secret-request';

import { ActionPreviewCard } from './action-preview-card';
import { ChatCardSkeleton } from './chat-card-primitives';
import { ChatInput } from './chat-input';
import { ConnectionPickerCard } from './connection-picker-card';
import { McpReconnectCard, McpReconnectData } from './mcp-reconnect-card';
import { MultiQuestionForm } from './multi-question-form';
import { ProjectPickerCard } from './project-picker-card';
import { SecretRequestCard } from './secret-request-card';

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
  replyStopped,
  draftKey,
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

  const expiredSecretRequest = useChatStoreContext((s) => {
    const part = chatPartUtils.findLastToolPart({
      message: lastAssistantMessage,
      predicate: (name, p) =>
        name === SECRET_REQUEST_TOOL &&
        p.state === 'output-available' &&
        secretRequestUtils.isExpired(parseOutput(p)),
    });
    return part && !s.dismissedGateIds[chatPartUtils.getToolCallId(part)]
      ? part
      : null;
  });

  const approveGate = useChatStoreContext((s) => s.approveGate);
  const rejectGate = useChatStoreContext((s) => s.rejectGate);
  const dismissGate = useChatStoreContext((s) => s.dismissGate);
  const dismissForm = useChatStoreContext((s) => s.dismissForm);
  useOpenResourceRequests({ lastAssistantMessage, isStreaming });

  const liveSecretRequest =
    activeDisplayTool &&
    activeDisplayTool.state === 'input-available' &&
    chatPartUtils.getToolPartName(activeDisplayTool) === SECRET_REQUEST_TOOL
      ? activeDisplayTool
      : null;
  const secretRequest =
    liveSecretRequest ?? (activeDisplayTool ? null : expiredSecretRequest);

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
  } else if (secretRequest) {
    const toolCallId = chatPartUtils.getToolCallId(secretRequest);
    const expired = secretRequest !== liveSecretRequest;
    dismissActiveCard = () =>
      expired ? dismissGate(toolCallId) : rejectGate(toolCallId);
    activeCard = (
      <SecretRequestCard
        key={toolCallId}
        toolCallId={toolCallId}
        input={secretRequest.input}
        expired={expired}
        onFollowUp={(text) => onSend(text)}
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
          onSend(text);
        }}
        onDismiss={() => {
          if (lastMessageId) dismissForm(lastMessageId);
          onSend(t('Skip these questions'));
        }}
      />
    );
  }

  const handleSend = (text: string, files?: File[]) => {
    onSend(text, files);
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

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      {activeCard ?? <ChatOfferPill />}
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
      <ChatInput
        isStreaming={activeCard ? false : isStreaming}
        replying={isStreaming}
        replyStopped={replyStopped}
        holdQueued={activeCard !== null}
        onSend={handleSend}
        onStop={onStop}
        onInputChange={onInputChange}
        minimalUntilFocus={recede === true && !activeCard}
        onFocusChange={setComposerEngaged}
        placeholder={
          activeCard
            ? t('Answer the card above, or reply to change the plan')
            : placeholder ?? t('Reply...')
        }
        rightActions={modelPicker}
        sendBlockedReason={sendBlockedReason}
        draftKey={draftKey}
        banner={banner}
        frameClassName={cn(
          'overflow-hidden rounded-xl border transition-colors',
          minimal
            ? 'border-transparent bg-transparent hover:bg-gray-3/30'
            : 'border-gray-6 hover:border-gray-8 focus-within:border-gray-8',
        )}
      />
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

function parseOutput(part: AnyToolPart): unknown {
  const parsed = chatPartUtils.parseToolOutput(part);
  return parsed.state === 'success' ? parsed.data : null;
}

const SECRET_REQUEST_TOOL = 'ap_request_secret';

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
  replyStopped?: boolean;
  draftKey?: string;
};

const SKIPPED_VISIBLE_MS = 2500;
