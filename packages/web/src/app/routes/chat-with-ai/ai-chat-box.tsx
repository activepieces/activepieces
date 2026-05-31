import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo } from 'react';

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { Button } from '@/components/ui/button';
import {
  ChatStoreProvider,
  useChatStoreContext,
} from '@/features/chat/lib/chat-store-context';
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { useCreditsState } from '@/features/chat/lib/use-credits-state';
import { aiProviderQueries } from '@/features/platform-admin';

import { AssistantMessage } from './components/assistant-message';
import { ChatBottomBar } from './components/chat-bottom-bar';
import {
  EmptyState,
  MessageSkeletons,
  SetupRequiredState,
  SuggestionCards,
} from './components/chat-empty-state';
import { ChatInput } from './components/chat-input';
import { ChatModelSelector } from './components/chat-model-selector';
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

  const showBanner = credits.creditsExhausted || credits.creditsWarning;

  const isEmpty = messages.length === 0 && !isLoadingHistory && !isStreaming;

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full flex-1 min-w-0 items-center justify-center px-6 pb-8">
        <div className="flex-1" />
        <EmptyState incognito={incognito} />
        <div className="w-full max-w-3xl mt-6">
          <SuggestionCards onSend={handleSend} />
          <div className="mt-3">
            <div className="overflow-hidden rounded-2xl border border-foreground/20 hover:border-foreground/40 focus-within:border-foreground/40 transition-colors">
              {showBanner && (
                <CreditsBanner
                  creditsExhausted={credits.creditsExhausted}
                  creditsWarning={credits.creditsWarning}
                  daysUntilReset={credits.daysUntilReset}
                  onDismiss={credits.dismissCreditsWarning}
                />
              )}
              <ChatInput
                isStreaming={isStreaming}
                onSend={handleSend}
                onStop={cancelStream}
                rightActions={
                  <ChatModelSelector
                    selectedModel={modelName}
                    onModelChange={setModelName}
                  />
                }
              />
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <ChatContainerRoot
        className="flex-1 relative"
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
                onSend={handleSend}
                lastAssistantMessage={
                  isLastAssistant ? lastAssistantMessage : msg
                }
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

      <div className="px-6 pb-4">
        <div className="max-w-3xl mx-auto relative">
          <div className="overflow-hidden rounded-2xl border border-foreground/20 hover:border-foreground/40 focus-within:border-foreground/40 transition-colors">
            {showBanner && (
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
