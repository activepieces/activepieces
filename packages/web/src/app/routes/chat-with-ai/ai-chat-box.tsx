import { isNil } from '@activepieces/core-utils';
import {
  AgentMessageSource,
  AgentPageContext,
  ChatPersonalizationStatus,
  ModelOptions,
  PlatformRole,
} from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle, RefreshCw, Square } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStickToBottomContext } from 'use-stick-to-bottom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelPicker, modelPickerUtils } from '@/features/agents';
import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import { ChatCreditsAlert } from '@/features/billing';
import { useHasConversations } from '@/features/chat/lib/chat-conversations';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import {
  ChatStoreProvider,
  useChatStoreContext,
} from '@/features/chat/lib/chat-store-context';
import { ChatUIMessage, chatPartUtils } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { followHold } from '@/features/chat/lib/follow/follow-hold';
import { onboardingPrefillUtils } from '@/features/chat/lib/onboarding-prefill';
import { useAgentChat } from '@/features/chat/lib/use-chat';
import { useCreditsState } from '@/features/chat/lib/use-credits-state';
import { usePersonalization } from '@/features/chat/lib/use-personalization';
import { MOTION } from '@/features/workspace/lib/chat-layout';
import { platformHooks } from '@/hooks/platform-hooks';
import { useSessionProjectId } from '@/hooks/use-session-project-id';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { AssistantMessage } from './components/assistant-message';
import { ChatResourceLinks } from './components/chat-app-links';
import { ChatBottomBar } from './components/chat-bottom-bar';
import {
  ChatEmptyState,
  MessageSkeletons,
  SetupRequiredState,
} from './components/chat-empty-state';
import { ComposerHandle } from './components/chat-input';
import {
  KeepBottomOnFooterGrowth,
  MatchScrollGutter,
} from './components/chat-scroll-sync';
import { MemoryImportNudgeCard } from './components/memory-import-nudge-card';
import { OnboardingQuestionCard } from './components/onboarding-question-card';
import {
  PersonalizationChip,
  PersonalizationChipState,
} from './components/personalization-chip';
import { QuickReplies } from './components/quick-replies';
import { TaskPanelLayout } from './components/task-panel';
import { UserMessage } from './components/user-message';
import { getTextFromParts } from './lib/message-parsers';

export function AIChatBox(props: AIChatBoxProps) {
  return (
    <MotionConfig reducedMotion="user">
      <ChatStoreProvider>
        <TaskPanelLayout>
          <ChatBoxContent {...props} />
        </TaskPanelLayout>
      </ChatStoreProvider>
    </MotionConfig>
  );
}

function ChatBoxContent({
  incognito,
  initialPrompt,
  agentId,
  builder,
  onTurnEnd,
  emptyState,
  footerNote,
  placeholder,
  conversationId: initialConversationId,
  onTitleUpdate,
  onConversationCreated,
  onConversationMissing,
  compact,
  autoFocusComposer,
}: AIChatBoxProps) {
  const reduced = useReducedMotion();
  const credits = useCreditsState();
  const sessionProjectId = useSessionProjectId();
  const { data: gateUser } = userHooks.useCurrentUser();
  const gate = useModelGate({
    gated:
      agentId === undefined &&
      isNil(initialConversationId) &&
      (!isNil(sessionProjectId) ||
        gateUser?.platformRole === PlatformRole.ADMIN),
    projectId: sessionProjectId,
  });

  const {
    session,
    conversationId,
    conversationProjectId,
    modelPick,
    messages,
    isStreaming,
    isResumedStream,
    isAwaitingResponse,
    wasCancelled,
    isLoadingHistory,
    error,
    failed,
    historyFailed,
    reloadHistory,
    sendMessage,
    retryLastMessage,
    cancelStream,
    setConversationId,
    setModelPick,
  } = useAgentChat({
    ...(agentId === undefined ? {} : { agentId }),
    ...(builder === undefined ? {} : { builder }),
    projectId: sessionProjectId,
    onTitleUpdate,
    onConversationCreated,
    onTurnEnd,
    onConversationMissing,
    onCreditsExhausted: () => credits.setCreditsExhausted(true),
  });

  const setStoreConversationId = useChatStoreContext(
    (s) => s.setConversationId,
  );
  const quickReplies = useChatStoreContext((s) => s.quickReplies);
  const offerRecurringAutomation = useChatStoreContext(
    (s) => s.offerRecurringAutomation,
  );

  useEffect(() => {
    if (initialConversationId) {
      setConversationId(initialConversationId).catch(() => undefined);
    }
  }, [initialConversationId, setConversationId]);

  useEffect(() => {
    setStoreConversationId(conversationId ?? null);
  }, [conversationId, setStoreConversationId]);

  const rootRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isStreaming) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        e.key !== 'Escape' ||
        !(target instanceof HTMLElement) ||
        !(
          rootRef.current?.contains(target) ||
          (!compact && target === document.body)
        ) ||
        chatDom.isCardField(target) ||
        !chatDom.escapeFree(e)
      ) {
        return;
      }
      chatDom.claimEscape(e);
      cancelStream();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isStreaming, cancelStream, compact]);

  const chatProjectId = conversationProjectId ?? sessionProjectId;
  const showsPicker = agentId === undefined && !isNil(chatProjectId);
  const { data: modelOptions } = aiModelHooks.useModelOptions({
    projectId: chatProjectId ?? '',
    surface: 'chat',
    tierId: modelPick?.modelTierId ?? undefined,
    enabled: showsPicker,
  });
  const shownChoice = isNil(modelOptions)
    ? null
    : chatUtils.choiceOf({ pick: modelPick, options: modelOptions }) ??
      modelOptions.defaultChoice ??
      null;
  const awaitingSavedPick =
    !isNil(initialConversationId) &&
    (isLoadingHistory ||
      (initialConversationId !== conversationId && !failed && !historyFailed));
  const showHistorySkeleton = useDelayedFlag({
    value: isLoadingHistory,
    delayMs: HISTORY_SKELETON_DELAY_MS,
  });
  const pickUnavailable =
    showsPicker &&
    !isNil(modelOptions) &&
    modelPickerUtils.isUnavailable({
      options: modelOptions,
      value: shownChoice,
    });

  const [hasSentMessage, setHasSentMessage] = useState(false);
  const historyLoading = isLoadingHistory && !isNil(conversationId);

  const handleSend = useCallback(
    async (
      text: string,
      files?: File[],
      options?: {
        messageSource?: AgentMessageSource;
        pageContext?: AgentPageContext | null;
      },
    ) => {
      if (!text.trim() && (!files || files.length === 0)) return;
      if (pickUnavailable || historyFailed || historyLoading) return;
      if (isNil(conversationId) && isNil(modelPick) && !isNil(shownChoice)) {
        await setModelPick(chatUtils.pickOf({ choice: shownChoice }));
      }
      setHasSentMessage(true);
      await sendMessage(text.trim(), files, options);
    },
    [
      sendMessage,
      pickUnavailable,
      historyFailed,
      historyLoading,
      conversationId,
      modelPick,
      shownChoice,
      setModelPick,
    ],
  );

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;
  const sendPrompt = useCallback((text: string) => {
    handleSendRef.current(text).catch(() => undefined);
  }, []);

  const [hasInput, setHasInput] = useState(false);
  const composerRef = useRef<ComposerHandle>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const sentInitialPrompt = useRef(false);

  useEffect(() => {
    const shouldSendInitialPrompt =
      initialPrompt !== undefined &&
      initialPrompt.trim().length > 0 &&
      !initialConversationId &&
      gate === 'ready' &&
      !sentInitialPrompt.current;
    if (!shouldSendInitialPrompt) return;
    sentInitialPrompt.current = true;
    handleSend(initialPrompt).catch(() => undefined);
  }, [initialPrompt, initialConversationId, handleSend, gate]);

  const handleRetry = useCallback(() => {
    const lastUser = messages.findLast((m) => m.role === 'user');
    if (lastUser && !pickUnavailable)
      retryLastMessage(getTextFromParts(lastUser.parts)).catch(() => undefined);
  }, [messages, retryLastMessage, pickUnavailable]);

  const lastMessage = messages[messages.length - 1];
  const lastAssistantMessage = useMemo(
    () => messages.findLast((m) => m.role === 'assistant'),
    [messages],
  );

  const claimedBuildIdsByMessage = useMemo(
    () => computeClaimedBuildIds(messages),
    [messages],
  );

  const { embedState } = useEmbedding();
  const onFirstReplyOfMainChat =
    !incognito &&
    !embedState.isEmbedded &&
    isNil(agentId) &&
    !builder &&
    !isNil(conversationId) &&
    !isAwaitingResponse &&
    !wasCancelled &&
    !failed &&
    messages.filter((m) => m.role === 'assistant').length === 1;

  const hasBlockingCard = useChatStoreContext((s) =>
    chatStoreSelectors.hasBlockingCard({ state: s, lastAssistantMessage }),
  );

  const showBanner = credits.creditsExhausted || credits.showLowCreditsWarning;

  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const personalization = usePersonalization({ enabled: !incognito });

  const isAwaitingLoad =
    !!initialConversationId &&
    messages.length === 0 &&
    !error &&
    !historyFailed;
  const isEmpty =
    messages.length === 0 &&
    !isLoadingHistory &&
    !isStreaming &&
    !isAwaitingLoad &&
    !historyFailed &&
    !hasSentMessage;

  const isFirstRun =
    personalization.personalStatus === ChatPersonalizationStatus.UNSET;
  const companyLocked =
    (personalization.companyInput ?? '').trim().length > 0 &&
    currentUser?.platformRole !== PlatformRole.ADMIN;
  const showOnboardingCard =
    isEmpty && !incognito && !compact && (isFirstRun || promptOpen);
  const showPersonalizationDonut =
    isEmpty &&
    !incognito &&
    !compact &&
    isNil(agentId) &&
    !showOnboardingCard &&
    !personalization.isResolving &&
    personalization.status !== null &&
    personalization.status !== ChatPersonalizationStatus.UNSET;
  const personalizationChipState: PersonalizationChipState =
    personalization.isResearching
      ? 'researching'
      : personalization.status === ChatPersonalizationStatus.FAILED
      ? 'failed'
      : personalization.roleInput
      ? 'ready'
      : 'unanswered';

  const initialAnswers = onboardingPrefillUtils.resolveInitialAnswers({
    view: {
      roleInput: personalization.roleInput,
      companyInput: personalization.companyInput,
      profile: personalization.profile,
      prefill: personalization.prefill,
      personalStatus:
        personalization.personalStatus ?? ChatPersonalizationStatus.UNSET,
    },
    platformName: platform?.name,
  });

  const handleOnboardingComplete = (answers: {
    role: string;
    company: string;
    companyDomain: string | null;
  }) => {
    setPromptOpen(false);
    personalization.start({
      role: answers.role,
      company: companyLocked ? '' : answers.companyDomain ?? answers.company,
    });
    void handleSend(
      t(
        'I work at {company} and my role is: {role}. What can you take off my plate?',
        { role: answers.role, company: answers.company },
      ),
      undefined,
      { messageSource: 'onboarding' },
    );
  };

  const handleOnboardingDismiss = () => {
    setPromptOpen(false);
    if (isFirstRun) {
      personalization.reset();
    }
  };

  const hasConversations = useHasConversations();

  if (gate === 'loading') {
    return <MessageSkeletons />;
  }

  if (gate === 'setup') {
    return <SetupRequiredState />;
  }

  return (
    <div
      ref={rootRef}
      className="@container/chat flex flex-col h-full flex-1 min-w-0 [&_*]:[scrollbar-width:thin]"
    >
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <div
            key="empty-state"
            className={cn(
              'flex-1 overflow-y-auto min-h-0',
              showPersonalizationDonut && 'pb-14',
            )}
          >
            {emptyState ?? (
              <ChatEmptyState
                incognito={incognito}
                hasInput={hasInput}
                onboarding={showOnboardingCard}
                showFlowCards={!hasConversations}
                onSend={(text) => handleSend(text).catch(() => undefined)}
                onFill={(text) => composerRef.current?.fill(text)}
              />
            )}
          </div>
        ) : (
          <motion.div
            key="chat-container"
            className="flex-1 min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION.base, ease: MOTION.easeOut }}
          >
            <ChatContainerRoot
              className="flex-1 relative h-full"
              style={{
                maskImage:
                  'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black calc(100% - 24px), transparent 100%)',
              }}
            >
              <ChatContainerContent
                scrollClassName="px-3 @chat-sm/chat:px-6"
                className="max-w-3xl mx-auto pt-8 pb-4 gap-0 min-h-full"
              >
                {showHistorySkeleton && <MessageSkeletons />}

                {historyFailed && (
                  <DataFetchErrorState
                    entity={t('this chat')}
                    onRetry={reloadHistory}
                  />
                )}

                <ChatResourceLinks messages={messages}>
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
                        isResumed={isLastStreamingAssistant && isResumedStream}
                        isLastMessage={isLastAssistant}
                        onSendPrompt={sendPrompt}
                        claimedBuildIds={claimedBuildIdsByMessage.get(msg.id)}
                        conversationId={conversationId}
                        messageIndex={idx}
                      />
                    );
                  })}
                </ChatResourceLinks>

                {!isAwaitingResponse &&
                  !wasCancelled &&
                  !hasBlockingCard &&
                  (quickReplies.length > 0 || offerRecurringAutomation) && (
                    <div className="mt-auto pt-2">
                      <QuickReplies
                        replies={quickReplies}
                        offerRecurringAutomation={offerRecurringAutomation}
                        onSend={handleSend}
                      />
                    </div>
                  )}

                {onFirstReplyOfMainChat && (
                  <MemoryImportNudgeCard conversationId={conversationId} />
                )}

                {wasCancelled && (
                  <div className="flex items-center gap-2 py-2 text-xs text-gray-11 animate-in fade-in duration-(--dur-base) ease-(--ease-ap-out) motion-reduce:animate-none">
                    <Square className="h-3 w-3 fill-current" />
                    <span>{t('Response stopped')}</span>
                  </div>
                )}

                {failed && (
                  <motion.div
                    className={cn(
                      'flex items-center gap-2 text-danger-11 text-sm',
                      error &&
                        'rounded-xl border border-danger-6 bg-danger-3 px-3 py-2',
                    )}
                    initial={{ opacity: 0, y: reduced ? 0 : 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: MOTION.base, ease: MOTION.easeOut }}
                  >
                    {error && (
                      <>
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-danger-11 hover:text-danger-11 gap-1.5"
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
              <ScrolledEdge />
              <MatchScrollGutter footerRef={footerRef} />
              <KeepBottomOnFooterGrowth footerRef={footerRef} />
              <ReportScrolledUp />
            </ChatContainerRoot>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={footerRef}
        className="pl-3 pr-[calc(0.75rem+var(--chat-scroll-gutter,0px))] @chat-sm/chat:pl-6 @chat-sm/chat:pr-[calc(1.5rem+var(--chat-scroll-gutter,0px))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-3xl mx-auto relative">
          {showOnboardingCard && (
            <div className="mb-3">
              <OnboardingQuestionCard
                initialRole={initialAnswers.role}
                initialCompany={initialAnswers.company}
                initialCompanyDomain={initialAnswers.companyDomain}
                companyLocked={companyLocked}
                onComplete={handleOnboardingComplete}
                onDismiss={handleOnboardingDismiss}
              />
            </div>
          )}
          {showPersonalizationDonut && (
            <div className="pointer-events-none absolute inset-x-0 bottom-full z-10 mb-3 flex justify-center">
              <div className="pointer-events-auto">
                <PersonalizationChip
                  state={personalizationChipState}
                  role={personalization.roleInput}
                  company={
                    personalization.profile?.companyName ??
                    personalization.companyInput
                  }
                  onClick={() => setPromptOpen(true)}
                  onClear={personalization.reset}
                />
              </div>
            </div>
          )}
          <ChatBottomBar
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={cancelStream}
            onInputChange={setHasInput}
            replyStopped={wasCancelled || failed}
            composerRef={composerRef}
            chatSession={session}
            autoFocus={autoFocusComposer}
            recede={showOnboardingCard}
            modelPicker={
              showsPicker && awaitingSavedPick ? (
                <Skeleton className="h-8 w-24 rounded-full" />
              ) : showsPicker && !isNil(chatProjectId) ? (
                <ModelPicker
                  variant="pill"
                  surface="chat"
                  projectId={chatProjectId}
                  value={shownChoice}
                  onChange={(choice) =>
                    void setModelPick(chatUtils.pickOf({ choice }))
                  }
                />
              ) : null
            }
            sendBlockedReason={
              historyFailed
                ? t('Load this chat again before you reply.')
                : historyLoading
                ? t('Loading…')
                : pickUnavailable
                ? t('Pick another model to continue')
                : undefined
            }
            lastAssistantMessage={lastAssistantMessage}
            lastMessageId={lastMessage?.id}
            placeholder={
              placeholder ??
              (showOnboardingCard
                ? t('Or tell me the work you want gone')
                : isEmpty
                ? t('Ask, build, or run a task...')
                : undefined)
            }
            banner={
              showBanner && !hasBlockingCard ? (
                <ChatCreditsAlert
                  creditsExhausted={credits.creditsExhausted}
                  creditsPercentUsed={credits.creditsPercentUsed}
                  onDismiss={credits.dismissCreditsWarning}
                />
              ) : null
            }
          />
          {footerNote !== undefined && (
            <p className="pt-[9px] text-center text-xs leading-3.5 text-gray-11">
              {footerNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function useModelGate({
  gated,
  projectId,
}: {
  gated: boolean;
  projectId: string | null;
}): ModelGate {
  const { data: options, isLoading } = aiModelHooks.useModelOptions({
    projectId: projectId ?? undefined,
    surface: 'chat',
    enabled: gated,
  });
  if (gated && isLoading) return 'loading';
  if (gated && !isNil(options) && !hasAnyModel({ options })) return 'setup';
  return 'ready';
}

function hasAnyModel({ options }: { options: ModelOptions }): boolean {
  return (
    options.tiers.length > 0 ||
    !isNil(options.credits) ||
    options.keys.length > 0
  );
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

function ScrolledEdge() {
  const { scrollRef } = useStickToBottomContext();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const update = () => setScrolled(scroller.scrollTop > 0);
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, [scrollRef]);
  return (
    <div
      aria-hidden
      data-scrolled={scrolled}
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gray-5 transition-opacity duration-(--dur-micro) ease-[ease]',
        scrolled ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}

function ReportScrolledUp() {
  const { isAtBottom, scrollRef } = useStickToBottomContext();
  useEffect(() => {
    if (!chatDom.inChat(scrollRef.current)) return;
    followHold.report({ scrolledUp: !isAtBottom });
    return () => followHold.report({ scrolledUp: false });
  }, [isAtBottom, scrollRef]);
  return null;
}

function useDelayedFlag({
  value,
  delayMs,
}: {
  value: boolean;
  delayMs: number;
}): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    setElapsed(false);
    if (!value) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return value && elapsed;
}

const HISTORY_SKELETON_DELAY_MS = 150;

type AIChatBoxProps = {
  incognito: boolean;
  initialPrompt?: string;
  agentId?: string;
  builder?: boolean;
  onTurnEnd?: () => void;
  emptyState?: React.ReactNode;
  footerNote?: string;
  placeholder?: string;
  conversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
  onConversationMissing?: () => void;
  onTitleUpdate?: (title: string) => void;
  compact?: boolean;
  autoFocusComposer?: boolean;
};

type ModelGate = 'loading' | 'setup' | 'ready';
