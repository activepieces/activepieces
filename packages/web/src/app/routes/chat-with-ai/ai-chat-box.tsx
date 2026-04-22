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
    wasCancelled,
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
                onSend={handleSend}
                onRetry={() => {
                  const lastUser = [...messages]
                    .reverse()
                    .find((m) => m.role === 'user');
                  if (lastUser) void sendMessage(lastUser.content);
                }}
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
            messages[messages.length - 1]?.role === 'assistant' &&
            !parseAutomationProposal(messages[messages.length - 1].content)
              .proposal && (
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
  onSend,
}: {
  message: ChatMessageItem;
  isStreaming: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onSend: (text: string) => void;
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
      onSend={onSend}
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
  onSend,
}: {
  message: ChatMessageItem;
  isStreaming: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onSend: (text: string) => void;
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

        {hasContent && (
          <MessageContentWithAuth content={message.content} onSend={onSend} />
        )}

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

type QuickReply = {
  label: string;
  value: string;
  variant?: 'default' | 'muted';
};

function extractQuickReplies(content: string): QuickReply[] {
  if (!content.includes('?')) return [];

  const lastQuestion =
    content
      .split('\n')
      .reverse()
      .find((l) => l.includes('?')) ?? '';

  const isConfirmation =
    /\b(shall i|should i|want me to|would you like|do you want|ready to|proceed|go ahead|confirm)\b/i.test(
      lastQuestion,
    );
  if (isConfirmation) {
    return [
      { label: t('Yes, go ahead'), value: 'Yes, go ahead' },
      { label: t('No'), value: 'No', variant: 'muted' },
    ];
  }

  const orMatch = content.match(
    /(?:which|what|choose|pick|select)[^?]*?[—–-]\s*(.+?)\?/i,
  );
  if (orMatch) {
    const choices = orMatch[1]
      .split(/\s+or\s+|,\s*/i)
      .map((c) => c.replace(/\*\*/g, '').trim())
      .filter((c) => c.length > 0 && c.length < 60);
    if (choices.length >= 2 && choices.length <= 4) {
      return [
        ...choices.map((c) => ({ label: c, value: c })),
        {
          label: t('All of them'),
          value: 'All of them',
          variant: 'muted' as const,
        },
      ];
    }
  }

  const bulletChoices: string[] = [];
  const bulletRegex = /^[-•*]\s+\*?\*?(.+?)\*?\*?\s*$/gm;
  let match = bulletRegex.exec(content);
  while (match) {
    bulletChoices.push(match[1].trim());
    match = bulletRegex.exec(content);
  }
  if (bulletChoices.length >= 2 && bulletChoices.length <= 4) {
    return bulletChoices.map((c) => ({ label: c, value: c }));
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
  const replies = extractQuickReplies(content);
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-2 animate-in fade-in duration-300">
      {replies.map((reply) => (
        <button
          key={reply.value}
          type="button"
          onClick={() => onSend(reply.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted transition-colors cursor-pointer',
            reply.variant === 'muted' && 'text-muted-foreground',
          )}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}

type AutomationProposal = {
  title: string;
  description: string;
  steps: string[];
};

function parseAutomationProposal(content: string): {
  proposal: AutomationProposal | null;
  cleanContent: string;
} {
  const regex = /```automation-proposal\n([\s\S]*?)```/;
  const match = regex.exec(content);
  if (!match) return { proposal: null, cleanContent: content };

  const block = match[1];
  const titleMatch = /^title:\s*(.+)$/m.exec(block);
  const descMatch = /^description:\s*(.+)$/m.exec(block);
  const stepsMatch = block.match(/^-\s+.+$/gm);

  if (!titleMatch || !stepsMatch || stepsMatch.length === 0) {
    return { proposal: null, cleanContent: content };
  }

  return {
    proposal: {
      title: titleMatch[1].trim(),
      description: descMatch?.[1].trim() ?? '',
      steps: stepsMatch.map((s) => s.replace(/^-\s+/, '').trim()),
    },
    cleanContent: content.replace(regex, '').trim(),
  };
}

function AutomationProposalCard({
  proposal,
  onBuild,
}: {
  proposal: AutomationProposal;
  onBuild: () => void;
}) {
  return (
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden my-2">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
            <Zap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{proposal.title}</h3>
            {proposal.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {proposal.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 ml-12">
          {proposal.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground/80">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t px-4 py-3 bg-muted/30">
        <Button size="sm" className="gap-1.5" onClick={onBuild}>
          <Zap className="h-3.5 w-3.5" />
          {t('Build this automation')}
        </Button>
      </div>
    </div>
  );
}

type ConnectionRequired = {
  piece: string;
  displayName: string;
};

function parseConnectionRequired(content: string): {
  connection: ConnectionRequired | null;
  cleanContent: string;
} {
  const regex = /```connection-required\n([\s\S]*?)```/;
  const match = regex.exec(content);
  if (!match) return { connection: null, cleanContent: content };

  const block = match[1];
  const pieceMatch = /^piece:\s*(.+)$/m.exec(block);
  const nameMatch = /^displayName:\s*(.+)$/m.exec(block);

  if (!pieceMatch) return { connection: null, cleanContent: content };

  return {
    connection: {
      piece: pieceMatch[1].trim(),
      displayName: nameMatch?.[1].trim() ?? pieceMatch[1].trim(),
    },
    cleanContent: content.replace(regex, '').trim(),
  };
}

function ConnectionRequiredCard({
  connection,
}: {
  connection: ConnectionRequired;
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden my-2">
      <div className="p-4 flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-500/10 shrink-0">
          <Cable className="h-4.5 w-4.5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">
            {t('Connect {name}', { name: connection.displayName })}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('This automation needs a {name} connection to work', {
              name: connection.displayName,
            })}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={() => navigate('/connections')}
        >
          <Cable className="h-3.5 w-3.5" />
          {t('Connect')}
        </Button>
      </div>
    </div>
  );
}

function MessageContentWithAuth({
  content,
  onSend,
}: {
  content: string;
  onSend?: (text: string) => void;
}) {
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

  const { proposal, cleanContent: afterProposal } =
    parseAutomationProposal(content);
  const { connection, cleanContent: finalContent } =
    parseConnectionRequired(afterProposal);

  return (
    <div className="space-y-2">
      {finalContent && (
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <Markdown>{finalContent}</Markdown>
        </div>
      )}
      {connection && <ConnectionRequiredCard connection={connection} />}
      {proposal && (
        <AutomationProposalCard
          proposal={proposal}
          onBuild={() =>
            onSend?.(`Yes, build the "${proposal.title}" automation`)
          }
        />
      )}
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
        placeholder={t('Message...')}
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
    { icon: Zap, text: t('What can I automate today?') },
    { icon: Workflow, text: t('Show me what I have running') },
    { icon: Table2, text: t('I keep doing something manually...') },
    { icon: Cable, text: t('Help me connect two apps') },
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
