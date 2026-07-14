import { SeekPage } from '@activepieces/core-utils';
import {
  ChatConversation,
  ChatMention,
  type ChatMessageSource,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStickToBottomContext } from 'use-stick-to-bottom';

import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { Button } from '@/components/ui/button';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import {
  ChatStoreProvider,
  useChatStoreContext,
} from '@/features/chat/lib/chat-store-context';
import {
  ActiveChatContext,
  ChatUIMessage,
  activeContextUtils,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { useCreditsState } from '@/features/chat/lib/use-credits-state';
import { aiProviderQueries } from '@/features/platform-admin';

import { AssistantMessage } from './components/assistant-message';
import { ChatBottomBar } from './components/chat-bottom-bar';
import {
  EmptyState,
  MessageSkeletons,
  SetupRequiredState,
} from './components/chat-empty-state';
import { CreditsBanner } from './components/credits-banner';
import { QuickReplies } from './components/quick-replies';
import { StageContextChip } from './components/stage-context-chip';
import { UserMessage } from './components/user-message';
import { getTextFromParts } from './lib/message-parsers';
import { useStageContext } from './lib/use-stage-context';

// Forces a scroll to the newly-sent message. The chat's stick-to-bottom only
// auto-follows when already at the bottom, so clicking a showcase tile (or sending)
// while scrolled up wouldn't reveal the new message without this. Scrolls only when
// a user message is ADDED (count rises) — not when the optimistic id reconciles to
// its persisted id — so it never yanks the user mid-read. Rendered inside the
// StickToBottom tree so useStickToBottomContext resolves.
function ScrollOnSend({ count }: { count: number }) {
  const { scrollToBottom } = useStickToBottomContext();
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      void scrollToBottom();
    }
    prevCount.current = count;
  }, [count, scrollToBottom]);
  return null;
}

export function AIChatBox({
  incognito,
  conversationId,
  onTitleUpdate,
  onConversationCreated,
}: AIChatBoxProps) {
  const { data: providers, isLoading: isLoadingProviders } =
    aiProviderQueries.useAiProviders();

  const chatProvider = providers?.find((p) => p.enabledForChat);
  const hasChatProvider = Boolean(chatProvider);

  if (!isLoadingProviders && !hasChatProvider) {
    return <SetupRequiredState />;
  }

  return (
    <ChatStoreProvider>
      <ChatBoxContent
        incognito={incognito}
        conversationId={conversationId}
        onTitleUpdate={onTitleUpdate}
        onConversationCreated={onConversationCreated}
      />
    </ChatStoreProvider>
  );
}

function ChatBoxContent({
  incognito,
  conversationId: initialConversationId,
  onTitleUpdate,
  onConversationCreated,
}: AIChatBoxProps) {
  const queryClient = useQueryClient();
  const credits = useCreditsState();

  const activeContext = useStageContext();
  const activeContextRef = useRef(activeContext);
  activeContextRef.current = activeContext;
  const getActiveContext = useCallback(() => activeContextRef.current, []);

  const stage = useStageOptional();

  const {
    messages,
    modelName,
    isStreaming,
    isResumedStream,
    isAwaitingResponse,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
    setModelName,
  } = useAgentChat({
    onTitleUpdate,
    onConversationCreated,
    onCreditsExhausted: () => credits.setCreditsExhausted(true),
    onStageOpen: (event) => {
      if (!stage) return;
      if (
        event.projectId &&
        stage.activeProjectId &&
        event.projectId !== stage.activeProjectId
      ) {
        return;
      }
      stage.open({ type: event.resourceType, id: event.resourceId });
    },
    onBrowserView: (event) => {
      if (!stage) return;
      stage.showBrowserView(event);
    },
    onStreamEnd: () => {
      stage?.pauseBrowserViewIfLive();
    },
    getActiveContext,
  });

  const quickReplies = useChatStoreContext((s) => s.quickReplies);
  const automationSuggestion = useChatStoreContext(
    (s) => s.automationSuggestion,
  );

  useEffect(() => {
    if (initialConversationId) {
      void setConversationId(initialConversationId);
    }
  }, [initialConversationId, setConversationId]);

  useEffect(() => {
    if (!isStreaming) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.closest('[role="dialog"]') ||
          target.closest('[data-radix-popper-content-wrapper]'))
      ) {
        return;
      }
      e.preventDefault();
      cancelStream();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isStreaming, cancelStream]);

  const [hasSentMessage, setHasSentMessage] = useState(false);

  const handleSend = useCallback(
    async (
      text: string,
      files?: File[],
      mentions?: ChatMention[],
      source?: ChatMessageSource,
    ) => {
      if (!text.trim() && (!files || files.length === 0)) return;
      setHasSentMessage(true);
      await sendMessage(text.trim(), files, mentions, source);
    },
    [sendMessage],
  );

  // Let Stage content (e.g. the browser hand-off "continue" button, which lives outside the chat
  // panel) post a message into the chat to resume the agent.
  useEffect(() => {
    if (!stage) return;
    stage.registerChatSend((text) => void handleSend(text));
    return () => stage.registerChatSend(null);
  }, [stage, handleSend]);

  const handleRetry = useCallback(() => {
    const lastUser = messages.findLast((m) => m.role === 'user');
    if (lastUser) void sendMessage(getTextFromParts(lastUser.parts));
  }, [messages, sendMessage]);

  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage = useMemo(
    () => messages.findLast((m) => m.role === 'assistant'),
    [messages],
  );
  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === 'user').length,
    [messages],
  );

  // Each user message stores a snapshot of what was open in the Stage. We print a
  // bare "User is on / moved to …" line above a message when its position changed
  // from the previous one — including the first message that has a position. The
  // live chip above the composer carries the "current location" signal.
  const contextMarkers = useMemo(
    () => computeContextMarkers(messages),
    [messages],
  );

  const claimedBuildIdsByMessage = useMemo(
    () => computeClaimedBuildIds(messages),
    [messages],
  );

  const hasBlockingCard = useChatStoreContext((s) =>
    chatStoreSelectors.hasBlockingCard({ state: s, lastAssistantMessage }),
  );

  const showBanner = credits.creditsExhausted || credits.creditsWarning;

  const [hasInput, setHasInput] = useState(false);

  const isAwaitingLoad =
    !!initialConversationId && messages.length === 0 && !error;
  const isEmpty =
    messages.length === 0 &&
    !isLoadingHistory &&
    !isStreaming &&
    !isAwaitingLoad &&
    !hasSentMessage;

  const cachedConversations = queryClient.getQueryData<
    SeekPage<ChatConversation>
  >(['chat-conversations']);
  const hasConversations = (cachedConversations?.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <div key="empty-state" className="flex-1 overflow-y-auto min-h-0">
            <EmptyState
              onSuggestionClick={(text) =>
                void handleSend(text, undefined, undefined, 'suggestion')
              }
              incognito={incognito}
              showFlowCards={!hasConversations}
              hasInput={hasInput}
            />
          </div>
        ) : (
          <motion.div
            key="chat-container"
            className="flex-1 min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <ChatContainerRoot
              className="flex-1 relative h-full"
              style={{
                maskImage:
                  'linear-gradient(to bottom, black 0%, black calc(100% - 12px), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black calc(100% - 12px), transparent 100%)',
              }}
            >
              <ChatContainerContent className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 gap-0 min-h-full">
                <ScrollOnSend count={userMessageCount} />
                {isLoadingHistory && <MessageSkeletons />}

                {messages.map((msg, idx) => {
                  if (msg.role === 'user') {
                    return (
                      <UserMessage
                        key={msg.id}
                        message={msg}
                        isLastMessage={idx === messages.length - 1}
                        positionMarker={contextMarkers.get(msg.id)}
                      />
                    );
                  }

                  const isLastStreamingAssistant =
                    isStreaming && idx === messages.length - 1;

                  const isLastAssistant = idx === messages.length - 1;

                  return (
                    <AssistantMessage
                      key={msg.id}
                      message={msg}
                      isStreaming={isLastStreamingAssistant}
                      isResumed={isLastStreamingAssistant && isResumedStream}
                      isLastMessage={isLastAssistant}
                      onSendPrompt={(text) => void handleSend(text)}
                      claimedBuildIds={claimedBuildIdsByMessage.get(msg.id)}
                    />
                  );
                })}

                {!isAwaitingResponse &&
                  !wasCancelled &&
                  !hasBlockingCard &&
                  (quickReplies.length > 0 || automationSuggestion) && (
                    <div className="mt-auto pt-2">
                      <QuickReplies
                        replies={quickReplies}
                        automationSuggestion={automationSuggestion}
                        onSend={handleSend}
                      />
                    </div>
                  )}

                {wasCancelled && (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground animate-in fade-in duration-200">
                    <Square className="h-3 w-3 fill-current" />
                    <span>{t('Response stopped')}</span>
                  </div>
                )}

                {error && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive gap-1.5 shrink-0 h-7 px-2"
                      onClick={handleRetry}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {t('Retry')}
                    </Button>
                  </motion.div>
                )}

                <ChatContainerScrollAnchor />
              </ChatContainerContent>
              <ScrollButton className="absolute bottom-4 right-1/2 translate-x-1/2" />
            </ChatContainerRoot>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto relative">
          <ChatBottomBar
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={cancelStream}
            onInputChange={setHasInput}
            selectedModel={modelName}
            onModelChange={setModelName}
            lastAssistantMessage={lastAssistantMessage}
            lastMessageId={lastMessage?.id}
            placeholder={
              isEmpty ? t('Ask, build, or run a task...') : undefined
            }
            contextChip={<StageContextChip context={activeContext} />}
            banner={
              showBanner ? (
                <CreditsBanner
                  creditsExhausted={credits.creditsExhausted}
                  creditsWarning={credits.creditsWarning}
                  daysUntilReset={credits.daysUntilReset}
                  onDismiss={credits.dismissCreditsWarning}
                />
              ) : null
            }
          />
        </div>
      </div>
    </div>
  );
}

function getMessageContext(msg: ChatUIMessage): ActiveChatContext | undefined {
  return msg.context;
}

// A user message's stored context prints a bare "User is on / moved to …" line
// ABOVE it when the position changed — the baseline (first message that has a
// position) and every focus-aware change, while same-position repeats stay
// silent. "Differs" includes the selected item (focus): two messages on the same
// flow but different steps each get their own line. isSameForMarker adds focus on
// top of isSame; isSame itself stays focus-blind because it mirrors the server's
// switch-line semantics (selecting a step must not read as a resource switch).
// We carry the previous context too so the line can read "(from {previous})".
function computeContextMarkers(
  messages: ChatUIMessage[],
): Map<
  string,
  { context: ActiveChatContext; previous: ActiveChatContext | undefined }
> {
  const markers = new Map<
    string,
    { context: ActiveChatContext; previous: ActiveChatContext | undefined }
  >();
  let prev: ActiveChatContext | undefined;
  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const ctx = getMessageContext(msg);
    if (!ctx) continue;
    if (prev === undefined || !activeContextUtils.isSameForMarker(ctx, prev)) {
      markers.set(msg.id, { context: ctx, previous: prev });
    }
    prev = ctx;
  }
  return markers;
}

// A build's plan is replayed across many messages; assign each build to the
// single (latest) message allowed to render its card so the plan shows once.
function computeClaimedBuildIds(
  messages: ChatUIMessage[],
): Map<string, Set<string>> {
  const ownerMessageByBuildId = new Map<string, string>();
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    for (const part of msg.parts) {
      if (!chatPartUtils.isAnyToolPart(part)) continue;
      if (chatPartUtils.getToolPartName(part) !== 'ap_set_build_plan') continue;
      const buildId = chatPartUtils.extractBuildIdFromOutput(part);
      if (buildId) ownerMessageByBuildId.set(buildId, msg.id);
    }
  }

  const claimed = new Map<string, Set<string>>();
  for (const [buildId, messageId] of ownerMessageByBuildId) {
    const existing = claimed.get(messageId);
    if (existing) {
      existing.add(buildId);
    } else {
      claimed.set(messageId, new Set([buildId]));
    }
  }
  return claimed;
}

type AIChatBoxProps = {
  incognito: boolean;
  conversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onTitleUpdate?: (title: string) => void;
};
