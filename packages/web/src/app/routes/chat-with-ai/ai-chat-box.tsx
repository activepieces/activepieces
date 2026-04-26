import { AIProviderName } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { aiProviderQueries } from '@/features/platform-admin';

import {
  EmptyState,
  MessageSkeletons,
  SandboxNotConfiguredState,
  SetupRequiredState,
  SuggestionCards,
} from './components/chat-empty-state';
import { ChatInput } from './components/chat-input';
import { ChatMessage } from './components/chat-message';
import { QuickReplies } from './components/message-content';
import { getTextFromBlocks, parseQuickReplies } from './lib/message-parsers';

export function AIChatBox({
  incognito,
  conversationId,
  onTitleUpdate,
  onConversationCreated,
}: AIChatBoxProps) {
  const { data: providers, isLoading: isLoadingProviders } =
    aiProviderQueries.useAiProviders();

  const hasChatProvider = providers?.some(
    (p) =>
      p.provider === AIProviderName.ACTIVEPIECES ||
      p.provider === AIProviderName.ANTHROPIC,
  );

  const { data: warmResult, isLoading: isLoadingWarm } = useQuery({
    queryKey: ['chat-warm'],
    queryFn: () => chatApi.warm(),
    enabled: Boolean(hasChatProvider),
    staleTime: Infinity,
  });

  if (isLoadingProviders || (hasChatProvider && isLoadingWarm)) {
    return (
      <div className="flex items-center justify-center h-full flex-1 min-w-0">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!hasChatProvider) {
    return <SetupRequiredState />;
  }

  if (!warmResult?.configured) {
    return <SandboxNotConfiguredState />;
  }

  return (
    <ChatBoxContent
      incognito={incognito}
      conversationId={conversationId}
      onTitleUpdate={onTitleUpdate}
      onConversationCreated={onConversationCreated}
    />
  );
}

function ChatBoxContent({
  incognito,
  conversationId: initialConversationId,
  onTitleUpdate,
  onConversationCreated,
}: AIChatBoxProps) {
  const {
    messages,
    isStreaming,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
  } = useAgentChat({ onTitleUpdate, onConversationCreated });
  const [connectedPieces, setConnectedPieces] = useState<Set<string>>(
    new Set(),
  );
  const markPieceConnected = useCallback((piece: string) => {
    setConnectedPieces((prev) => new Set(prev).add(piece));
  }, []);

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
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) void sendMessage(getTextFromBlocks(lastUser.blocks));
  }, [messages, sendMessage]);

  const isEmpty =
    messages.length === 0 && !initialConversationId && !isLoadingHistory;

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full flex-1 min-w-0 items-center justify-center px-6 pb-8">
        <div className="flex-1" />
        <EmptyState incognito={incognito} />
        <div className="w-full max-w-4xl mt-6">
          <ChatInput
            isStreaming={isStreaming}
            onSend={handleSend}
            onCancel={cancelStream}
          />
          <SuggestionCards onSend={handleSend} />
        </div>
        <div className="flex-1" />
        <p className="text-[11px] text-muted-foreground text-center mt-4">
          {t('Activepieces AI can help you automate anything.')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <ChatContainerRoot className="flex-1 relative">
        <ChatContainerContent className="max-w-4xl mx-auto px-6 py-8 gap-0">
          {(isLoadingHistory ||
            (initialConversationId &&
              messages.length === 0 &&
              !isStreaming)) && <MessageSkeletons />}

          {messages.map((msg, idx) => {
            const isLastStreamingAssistant =
              isStreaming &&
              idx === messages.length - 1 &&
              msg.role === 'assistant';

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isLastStreamingAssistant}
                onCancel={cancelStream}
                onSend={handleSend}
                connectedPieces={connectedPieces}
                onPieceConnected={markPieceConnected}
                onRetry={handleRetry}
              />
            );
          })}

          {wasCancelled && (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground animate-in fade-in duration-200">
              <Square className="h-3 w-3 fill-current" />
              <span>{t('Response stopped')}</span>
            </div>
          )}

          {!isStreaming &&
            !wasCancelled &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === 'assistant' && (
              <QuickReplies
                replies={
                  parseQuickReplies(
                    getTextFromBlocks(messages[messages.length - 1].blocks),
                  ).replies
                }
                onSend={handleSend}
              />
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

      <div className="pb-4 px-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            isStreaming={isStreaming}
            onSend={handleSend}
            onCancel={cancelStream}
          />
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[11px] text-muted-foreground">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
                Enter
              </kbd>{' '}
              {t('to send')}
            </span>
            <span className="text-[11px] text-muted-foreground">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
                Shift+Enter
              </kbd>{' '}
              {t('new line')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

type AIChatBoxProps = {
  incognito: boolean;
  conversationId?: string | null;
  onConversationCreated?: () => void;
  onTitleUpdate?: (title: string, conversationId?: string) => void;
};
