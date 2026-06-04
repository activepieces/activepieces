import { ChatConversation, SeekPage } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo } from 'react';

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
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { useCreditsState } from '@/features/chat/lib/use-credits-state';
import { aiProviderQueries } from '@/features/platform-admin';
import { cn } from '@/lib/utils';

import { AssistantMessage } from './components/assistant-message';
import { ChatBottomBar } from './components/chat-bottom-bar';
import {
  EmptyState,
  MessageSkeletons,
  SetupRequiredState,
} from './components/chat-empty-state';
import { CreditsBanner } from './components/credits-banner';
import { QuickReplies } from './components/quick-replies';
import { UserMessage } from './components/user-message';
import { getTextFromParts } from './lib/message-parsers';

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

  const {
    messages,
    modelName,
    isStreaming,
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
  });

  const quickReplies = useChatStoreContext((s) => s.quickReplies);

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

  const handleSend = useCallback(
    async (text: string, files?: File[]) => {
      if (!text.trim() && (!files || files.length === 0)) return;
      await sendMessage(text.trim(), files);
    },
    [sendMessage],
  );

  const handleRetry = useCallback(() => {
    const lastUser = messages.findLast((m) => m.role === 'user');
    if (lastUser) void sendMessage(getTextFromParts(lastUser.parts));
  }, [messages, sendMessage]);

  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage = useMemo(
    () => messages.findLast((m) => m.role === 'assistant'),
    [messages],
  );

  const hasBlockingCard = useChatStoreContext((s) =>
    chatStoreSelectors.hasBlockingCard({ state: s, lastAssistantMessage }),
  );

  const showBanner = credits.creditsExhausted || credits.creditsWarning;

  const isEmpty = messages.length === 0 && !isLoadingHistory && !isStreaming;

  const cachedConversations = queryClient.getQueryData<
    SeekPage<ChatConversation>
  >(['chat-conversations']);
  const hasConversations = (cachedConversations?.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <AnimatePresence>
        {isEmpty ? (
          <motion.div
            key="empty-state"
            className="flex-1 overflow-y-auto min-h-0"
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              onSuggestionClick={(text) => void handleSend(text)}
              incognito={incognito}
              showFlowCards={!hasConversations}
            />
          </motion.div>
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
                  'linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)',
              }}
            >
              <ChatContainerContent className="max-w-3xl mx-auto px-6 pt-8 pb-16 gap-0">
                {isLoadingHistory && <MessageSkeletons />}

                {messages.map((msg, idx) => {
                  if (msg.role === 'user') {
                    return (
                      <UserMessage
                        key={msg.id}
                        message={msg}
                        isLastMessage={idx === messages.length - 1}
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
                      isLastMessage={isLastAssistant}
                      onRetry={handleRetry}
                    />
                  );
                })}

                {!isStreaming && !wasCancelled && quickReplies.length > 0 && (
                  <QuickReplies replies={quickReplies} onSend={handleSend} />
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

      <div className="px-6 pb-4">
        <div className="max-w-3xl mx-auto relative">
          <div
            className={cn(
              !hasBlockingCard &&
                'overflow-hidden rounded-2xl border border-foreground/20 hover:border-foreground/40 focus-within:border-foreground/40 transition-colors',
            )}
          >
            {showBanner && !hasBlockingCard && (
              <CreditsBanner
                creditsExhausted={credits.creditsExhausted}
                creditsWarning={credits.creditsWarning}
                daysUntilReset={credits.daysUntilReset}
                onDismiss={credits.dismissCreditsWarning}
              />
            )}
            <ChatBottomBar
              isStreaming={isStreaming}
              onSend={handleSend}
              onStop={cancelStream}
              selectedModel={modelName}
              onModelChange={setModelName}
              lastAssistantMessage={lastAssistantMessage}
              lastMessageId={lastMessage?.id}
              placeholder={
                isEmpty ? t('Ask, build, or run a task...') : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type AIChatBoxProps = {
  incognito: boolean;
  conversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onTitleUpdate?: (title: string) => void;
};
