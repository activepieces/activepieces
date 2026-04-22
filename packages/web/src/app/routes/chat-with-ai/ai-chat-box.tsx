import { AIProviderName } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUp,
  Cable,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Plus,
  Sparkles,
  RefreshCw,
  Settings,
  Square,
  Table2,
  Workflow,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/prompt-kit/chat-container';
import { Markdown } from '@/components/prompt-kit/markdown';
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/prompt-kit/reasoning';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { ThinkingBar } from '@/components/prompt-kit/thinking-bar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanCard } from '@/features/chat/components/plan-card';
import { ToolCallCard } from '@/features/chat/components/tool-call-card';
import {
  useAgentChat,
  type ChatMessageItem,
} from '@/features/chat/lib/use-chat';
import { aiProviderQueries } from '@/features/platform-admin';
import { cn } from '@/lib/utils';

type AIChatBoxProps = {
  incognito: boolean;
  conversationId?: string | null;
  onFirstMessage: (text: string) => void;
  onConversationCreated?: () => void;
  onTitleUpdate?: (title: string) => void;
};

export function AIChatBox({
  incognito,
  conversationId,
  onFirstMessage,
  onTitleUpdate,
  onConversationCreated,
}: AIChatBoxProps) {
  const { data: providers, isLoading: isLoadingProviders } =
    aiProviderQueries.useAiProviders();

  const hasAnthropic = providers?.some(
    (p) => p.provider === AIProviderName.ANTHROPIC,
  );

  if (isLoadingProviders) {
    return (
      <div className="flex items-center justify-center h-full flex-1 min-w-0">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!hasAnthropic) {
    return <SetupRequiredState />;
  }

  return (
    <ChatBoxContent
      incognito={incognito}
      conversationId={conversationId}
      onFirstMessage={onFirstMessage}
      onTitleUpdate={onTitleUpdate}
      onConversationCreated={onConversationCreated}
    />
  );
}

function ChatBoxContent({
  incognito,
  conversationId: initialConversationId,
  onFirstMessage,
  onTitleUpdate,
  onConversationCreated,
}: AIChatBoxProps) {
  const {
    messages,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    cancelStream,
    setConversationId,
  } = useAgentChat({ onTitleUpdate, onConversationCreated });
  const hasSentFirst = useRef(false);

  useEffect(() => {
    if (initialConversationId) {
      void setConversationId(initialConversationId);
    }
  }, [initialConversationId, setConversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!hasSentFirst.current) {
        hasSentFirst.current = true;
        onFirstMessage(text.trim().slice(0, 100));
      }
      await sendMessage(text.trim());
    },
    [sendMessage, onFirstMessage],
  );

  // no separate isThinking — handled inside AssistantMessage

  const isEmpty =
    messages.length === 0 && !initialConversationId && !isLoadingHistory;

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full flex-1 min-w-0 items-center justify-center px-6 pb-8">
        <div className="flex-1" />
        <EmptyState onSend={handleSend} incognito={incognito} />
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
      <ChatContainerRoot className="flex-1">
        <ChatContainerContent className="max-w-4xl mx-auto px-6 py-8 gap-0">
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
                onCancel={cancelStream}
                onRetry={() => {
                  const lastUser = [...messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUser) void sendMessage(lastUser.content);
                }}
              />
            );
          })}

          {!isStreaming &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === 'assistant' && (
              <QuickReplies
                content={messages[messages.length - 1].content}
                onSend={handleSend}
              />
            )}

          {error && (
            <div className="flex items-center gap-3 py-4 text-destructive text-sm animate-in fade-in duration-200">
              <span className="flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive gap-1.5 shrink-0"
                onClick={() => {
                  const lastUser = [...messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUser) void sendMessage(lastUser.content);
                }}
              >
                <RefreshCw className="h-3 w-3" />
                {t('Retry')}
              </Button>
            </div>
          )}

          <ChatContainerScrollAnchor />
        </ChatContainerContent>
        <ScrollButton />
      </ChatContainerRoot>

      <div className="pb-4 px-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            isStreaming={isStreaming}
            onSend={handleSend}
            onCancel={cancelStream}
          />
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            {t('Activepieces AI can help you automate anything.')}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  isStreaming,
  onCancel,
  onRetry,
}: {
  message: ChatMessageItem;
  isStreaming: boolean;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      onCancel={onCancel}
      onRetry={onRetry}
    />
  );
}

function UserMessage({ message }: { message: ChatMessageItem }) {
  const [copied, setCopied] = useState(false);
  const time = formatTime(message.timestamp);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className="flex flex-col items-end py-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="bg-muted rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        {time && (
          <span className="text-[11px] text-muted-foreground">{time}</span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          title={t('Copy')}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  isStreaming,
  onCancel,
  onRetry,
}: {
  message: ChatMessageItem;
  isStreaming: boolean;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const hasThoughts = message.thoughts.length > 0;
  const hasContent = message.content.length > 0;
  const hasToolCalls = message.toolCalls.length > 0;
  const isWaiting = isStreaming && !hasThoughts && !hasContent && !hasToolCalls;
  const isThinkingOnly = isStreaming && hasThoughts && !hasContent;

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className="py-3 animate-in fade-in duration-200">
      <div className="min-w-0 overflow-hidden space-y-2">
        {isWaiting && (
          <ThinkingBar
            text={t('Reasoning')}
            onStop={onCancel}
            stopLabel={t('Stop')}
          />
        )}

        {hasThoughts && (
          <Reasoning isStreaming={isThinkingOnly} className="">
            <ReasoningTrigger className="text-sm text-muted-foreground">
              {t('Reasoned for a few seconds')}
            </ReasoningTrigger>
            <ReasoningContent markdown contentClassName="text-xs">
              {message.thoughts}
            </ReasoningContent>
          </Reasoning>
        )}

        {hasToolCalls && <ToolCallGroup toolCalls={message.toolCalls} />}

        {message.plan && <PlanCard entries={message.plan} />}

        {hasContent && <MessageContentWithAuth content={message.content} />}

        {hasContent && !isStreaming && (
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title={t('Copy')}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title={t('Regenerate')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallGroup({
  toolCalls,
}: {
  toolCalls: ChatMessageItem['toolCalls'];
}) {
  const allDone = toolCalls.every((tc) => tc.status !== 'running');
  const runningCount = toolCalls.filter((tc) => tc.status === 'running').length;

  const count = allDone ? toolCalls.length : runningCount || toolCalls.length;
  const summary = allDone
    ? t('Used {count} tools', { count })
    : t('Running {count} tools...', { count });

  return (
    <Collapsible defaultOpen={!allDone}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-0.5">
        {allDone ? (
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}
        <span>{summary}</span>
        <ChevronDown className="h-3 w-3" />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="ml-5 mt-1 space-y-0.5">
          {toolCalls.map((tc) => (
            <ToolCallCard key={tc.id} toolCall={tc} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function extractChoices(content: string): string[] {
  if (!content.includes('?')) return [];

  const orMatch = content.match(
    /(?:which|what|choose|pick|select)[^?]*?[—–-]\s*(.+?)\?/i,
  );
  if (orMatch) {
    const choiceStr = orMatch[1];
    const choices = choiceStr
      .split(/\s+or\s+|,\s*/i)
      .map((c) => c.replace(/\*\*/g, '').trim())
      .filter((c) => c.length > 0 && c.length < 60);
    if (choices.length >= 2 && choices.length <= 4) return choices;
  }

  const bulletChoices: string[] = [];
  const bulletRegex = /^[-•*]\s+\*?\*?(.+?)\*?\*?\s*$/gm;
  let match = bulletRegex.exec(content);
  while (match) {
    bulletChoices.push(match[1].trim());
    match = bulletRegex.exec(content);
  }
  if (bulletChoices.length >= 2 && bulletChoices.length <= 4) {
    return bulletChoices;
  }

  return [];
}

function QuickReplies({
  content,
  onSend,
}: {
  content: string;
  onSend: (text: string) => void;
}) {
  const choices = extractChoices(content);
  if (choices.length === 0) return null;

  const visibleChoices = choices.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-2 py-2 animate-in fade-in duration-300">
      {visibleChoices.map((choice) => (
        <button
          key={choice}
          type="button"
          onClick={() => onSend(choice)}
          className="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted transition-colors cursor-pointer"
        >
          {choice}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onSend(t('All of them'))}
        className="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted transition-colors cursor-pointer text-muted-foreground"
      >
        {t('All of them')}
      </button>
    </div>
  );
}

function MessageContentWithAuth({ content }: { content: string }) {
  const hasAuthUrl = /https?:\/\/[^\s]*\/authorize\?[^\s]*/.test(content);

  if (hasAuthUrl) {
    const cleanContent = content
      .replace(/https?:\/\/[^\s]*\/authorize\?[^\s]*/g, '')
      .replace(/Please open this URL in your browser to authorize:?\s*/gi, '')
      .replace(/After authorizing.*$/gis, '')
      .replace(/If the browser shows.*$/gis, '')
      .replace(/If you see a connection error.*$/gis, '')
      .replace(/Once you've completed.*$/gis, '')
      .replace(/paste the full URL.*$/gis, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div className="space-y-3">
        {cleanContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <Markdown>{cleanContent}</Markdown>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
          <Zap className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            {t(
              'Project tools (flows, tables, connections) will be available automatically in a future update.',
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <Markdown>{content}</Markdown>
    </div>
  );
}

function ChatInput({
  isStreaming,
  onSend,
  onCancel,
}: {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onCancel();
    } else if (value.trim()) {
      onSend(value.trim());
      setValue('');
    }
  }, [isStreaming, value, onSend, onCancel]);

  const canSend = value.trim().length > 0;

  return (
    <PromptInput
      isLoading={isStreaming}
      value={value}
      onValueChange={setValue}
      onSubmit={handleSubmit}
      className="rounded-2xl border shadow-sm"
    >
      <PromptInputTextarea
        placeholder={t('Message Spark...')}
        className="min-h-[44px] text-sm"
      />
      <PromptInputActions className="justify-between px-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {isStreaming ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs px-3"
              onClick={onCancel}
            >
              <Square className="h-3 w-3 fill-current" />
              {t('Stop')}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg transition-all',
                canSend
                  ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
              onClick={handleSubmit}
              disabled={!canSend}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </PromptInputActions>
    </PromptInput>
  );
}

function EmptyState({
  incognito,
}: {
  onSend: (text: string) => void;
  incognito: boolean;
}) {
  const greetings = [
    t('Quiet moments build the best things'),
    t('Ideas become automations here'),
    t('Turn repetitive work into magic'),
    t('Your next workflow starts here'),
  ];

  const getGreeting = () => {
    if (incognito) return t('Private Chat');
    const index = new Date().getDate() % greetings.length;
    return greetings[index];
  };

  return (
    <div className="flex items-center gap-3">
      <Sparkles className="h-7 w-7 text-primary shrink-0" />
      <h2
        className="text-[32px] font-bold leading-tight bg-gradient-to-r from-foreground via-foreground/80 to-primary bg-clip-text text-transparent"
        style={{ textWrap: 'balance' }}
      >
        {getGreeting()}
      </h2>
    </div>
  );
}

function SuggestionCards({ onSend }: { onSend: (text: string) => void }) {
  const suggestions = [
    { icon: Zap, text: t('Help me write an automation flow') },
    { icon: Table2, text: t('Create a new table') },
    { icon: Workflow, text: t('What integrations do you support?') },
    { icon: Cable, text: t('How do I connect two apps?') },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {suggestions.map((s) => (
        <button
          key={s.text}
          type="button"
          onClick={() => onSend(s.text)}
          className="flex flex-col items-start gap-2 p-3 rounded-xl border bg-background hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <s.icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground leading-snug">
            {s.text}
          </span>
        </button>
      ))}
    </div>
  );
}

function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20 flex-1 min-w-0">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t('Set up Anthropic to get started')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t(
            'AI Chat requires an Anthropic API key. Add your Anthropic provider in the AI settings to start chatting.',
          )}
        </p>
      </div>
      <Button onClick={() => navigate('/platform/setup/ai')} className="gap-2">
        <Settings className="h-4 w-4" />
        {t('Go to AI Settings')}
      </Button>
    </div>
  );
}

function MessageSkeletons() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 py-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
