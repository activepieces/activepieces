import {
  AIProviderName,
  PROJECT_COLOR_PALETTE,
  Project,
  ProjectType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { Button } from '@/components/ui/button';
import { ChatUIMessage, DynamicToolPart } from '@/features/chat/lib/chat-types';
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { useToolApproval } from '@/features/chat/lib/use-tool-approval';
import { aiProviderQueries } from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';

import {
  EmptyState,
  MessageSkeletons,
  SetupRequiredState,
  SuggestionCards,
} from './components/chat-empty-state';
import { ChatInput } from './components/chat-input';
import { ChatMessage } from './components/chat-message';
import { ChatModelSelector } from './components/chat-model-selector';
import { QuickReplies } from './components/message-content';
import { MultiQuestionForm } from './components/multi-question-form';
import { ToolApprovalForm } from './components/tool-approval-form';
import {
  getTextFromParts,
  parseMultiQuestion,
  parseQuickReplies,
} from './lib/message-parsers';

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
    <ChatBoxContent
      incognito={incognito}
      conversationId={conversationId}
      onTitleUpdate={onTitleUpdate}
      onConversationCreated={onConversationCreated}
      chatProviderName={chatProvider?.provider}
    />
  );
}

function ChatBoxContent({
  incognito,
  conversationId: initialConversationId,
  onTitleUpdate,
  onConversationCreated,
  chatProviderName,
}: AIChatBoxProps) {
  const {
    messages,
    modelName,
    selectedProjectId,
    projectSetInSession,
    isStreaming,
    wasCancelled,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
    setModelName,
    setProjectContext,
    pendingApprovalRequest,
  } = useAgentChat({ onTitleUpdate, onConversationCreated });
  const { data: allProjects } = projectCollectionUtils.useAll();
  const projects = useMemo(() => allProjects ?? [], [allProjects]);

  const handleProjectChange = useCallback(
    (projectId: string | null) => {
      void setProjectContext(projectId);
    },
    [setProjectContext],
  );

  const [dismissedFormIds, setDismissedFormIds] = useState<Set<string>>(
    new Set(),
  );

  const activeProject = useMemo(
    () =>
      resolveActiveProject({
        selectedProjectId,
        projectSetInSession,
        projects,
      }),
    [selectedProjectId, projectSetInSession, projects],
  );

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
    if (lastUser) void sendMessage(getTextFromParts(lastUser.parts));
  }, [messages, sendMessage]);

  const lastMessage = messages[messages.length - 1];
  const lastMessageText = useMemo(
    () =>
      lastMessage?.role === 'assistant'
        ? getTextFromParts(lastMessage.parts)
        : '',
    [lastMessage],
  );
  const activeQuestions = useMemo(
    () => parseMultiQuestion(lastMessageText).questions,
    [lastMessageText],
  );
  const hasActiveForm =
    activeQuestions.length > 0 &&
    !!lastMessage &&
    !dismissedFormIds.has(lastMessage.id);

  const {
    hasActiveApproval,
    approvalDisplayName,
    approve,
    reject,
    dismiss: dismissApproval,
  } = useToolApproval({ pendingApprovalRequest });

  const allConversationToolParts = useMemo(
    () =>
      messages.flatMap((m: ChatUIMessage) =>
        m.parts.filter((p): p is DynamicToolPart => p.type === 'dynamic-tool'),
      ),
    [messages],
  );

  const isEmpty = messages.length === 0 && !isLoadingHistory && !isStreaming;

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full flex-1 min-w-0 items-center justify-center px-6 pb-8">
        <div className="flex-1" />
        <EmptyState incognito={incognito} />
        <div className="w-full max-w-3xl mt-6">
          <SuggestionCards onSend={handleSend} />
          <div className="mt-3">
            <ChatInput
              isStreaming={isStreaming}
              onSend={handleSend}
              onStop={cancelStream}
              activeProject={activeProject}
              leftActions={
                <ChatModelSelector
                  chatProviderName={chatProviderName}
                  selectedModel={modelName}
                  onModelChange={setModelName}
                />
              }
            />
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
            const isLastStreamingAssistant =
              isStreaming &&
              idx === messages.length - 1 &&
              msg.role === 'assistant';

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isLastStreamingAssistant}
                isLastMessage={idx === messages.length - 1}
                onSend={handleSend}
                onRetry={handleRetry}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleProjectChange}
                allConversationToolParts={allConversationToolParts}
              />
            );
          })}

          {wasCancelled && (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground animate-in fade-in duration-200">
              <Square className="h-3 w-3 fill-current" />
              <span>{t('Response stopped')}</span>
            </div>
          )}

          {!wasCancelled && lastMessageText && (
            <QuickReplies
              replies={parseQuickReplies(lastMessageText).replies}
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

      <div className="px-6 pb-4">
        <div className="max-w-3xl mx-auto relative">
          {activeProject && (
            <div
              className="absolute top-0 right-3 z-20 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-medium flex items-center gap-1"
              style={{
                backgroundColor: activeProject.color,
                color: activeProject.textColor,
              }}
            >
              {activeProject.name}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
                onClick={() => handleProjectChange(null)}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          {hasActiveApproval ? (
            <ToolApprovalForm
              key={pendingApprovalRequest?.gateId}
              displayName={approvalDisplayName ?? ''}
              onApprove={approve}
              onReject={reject}
              onDismiss={dismissApproval}
            />
          ) : hasActiveForm ? (
            <MultiQuestionForm
              key={lastMessage?.id}
              questions={activeQuestions}
              onSubmit={(text) => {
                if (lastMessage?.id) {
                  setDismissedFormIds((prev) => {
                    const next = new Set(prev);
                    next.add(lastMessage.id);
                    return next;
                  });
                }
                void handleSend(text);
              }}
              onDismiss={() => {
                if (lastMessage?.id) {
                  setDismissedFormIds((prev) => {
                    const next = new Set(prev);
                    next.add(lastMessage.id);
                    return next;
                  });
                }
                void handleSend(t('Skip these questions'));
              }}
            />
          ) : (
            <ChatInput
              isStreaming={isStreaming}
              onSend={handleSend}
              onStop={cancelStream}
              placeholder={t('Reply...')}
              activeProject={activeProject}
              leftActions={
                <ChatModelSelector
                  chatProviderName={chatProviderName}
                  selectedModel={modelName}
                  onModelChange={setModelName}
                />
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function resolveActiveProject({
  selectedProjectId,
  projectSetInSession,
  projects,
}: {
  selectedProjectId: string | null;
  projectSetInSession: boolean;
  projects: Project[];
}): ActiveProjectInfo | undefined {
  if (!selectedProjectId || !projectSetInSession) return undefined;
  const project = projects.find((p) => p.id === selectedProjectId);
  if (!project) return undefined;

  if (project.type === ProjectType.PERSONAL) {
    return {
      name: t('Personal Project'),
      color: '#0a0a0a',
      textColor: '#ffffff',
    };
  }

  const palette = project.icon?.color
    ? PROJECT_COLOR_PALETTE[project.icon.color]
    : undefined;
  return {
    name: project.displayName,
    color: palette?.color ?? '#0a0a0a',
    textColor: palette?.textColor ?? '#ffffff',
  };
}

type ActiveProjectInfo = {
  name: string;
  color: string;
  textColor: string;
};

type AIChatBoxProps = {
  incognito: boolean;
  conversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onTitleUpdate?: (title: string, conversationId?: string) => void;
  chatProviderName?: AIProviderName;
};
