import { isTextUIPart, UIMessage } from 'ai';
import { t } from 'i18next';
import {
  ArrowUp,
  Bot,
  Check,
  ChevronsUpDown,
  Code2,
  Copy,
  Globe,
  Puzzle,
  RefreshCw,
  Server,
  Settings,
  Square,
  Trash2,
  XIcon,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_URL } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import {
  CopilotModel,
  useCopilotModels,
  usePlatformCopilot,
} from './use-platform-copilot';

const SUGGESTIONS = [
  { text: 'How do I build my first flow?', icon: Zap },
  { text: 'What pieces are available?', icon: Puzzle },
  { text: 'How do I write a custom piece?', icon: Code2 },
  { text: 'How do I set up webhooks?', icon: Globe },
  { text: 'How do I deploy with Docker?', icon: Server },
  { text: 'How do I configure AI providers?', icon: Bot },
];

export function PlatformCopilotSheet({
  open,
  onOpenChange,
}: PlatformCopilotSheetProps) {
  const navigate = useNavigate();
  const { models, isLoading: modelsLoading } = useCopilotModels();
  const [selectedModel, setSelectedModel] = useState<CopilotModel | null>(null);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  useEffect(() => {
    if (!selectedModel && models.length > 0) setSelectedModel(models[0]);
  }, [models, selectedModel]);

  const { messages, sendMessage, status, stop, clearChat } = usePlatformCopilot(
    { selectedModel },
  );

  const isGenerating = status === 'submitted' || status === 'streaming';
  const canChat = selectedModel !== null;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGenerating) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'auto',
        });
      });
    }
  }, [messages, isGenerating]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text || isGenerating || !canChat) return;
      void sendMessage({ text });
    },
    [isGenerating, canChat, sendMessage],
  );

  const hasMessages = messages.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideCloseButton
        className="w-full sm:max-w-[680px] flex flex-col p-0 gap-0 border-l shadow-2xl outline-none"
      >
        <Header
          hasMessages={hasMessages}
          clearChat={clearChat}
          onClose={() => onOpenChange(false)}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          {!hasMessages && !isGenerating ? (
            <EmptyState
              canChat={canChat}
              modelsLoading={modelsLoading}
              onSuggest={handleSend}
              onConfigure={() => {
                onOpenChange(false);
                navigate('/platform/setup/ai');
              }}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isGenerating}
                />
              ))}
              {isGenerating && !lastAssistantHasText(messages) && (
                <TypingIndicator />
              )}
            </div>
          )}
        </div>

        <InputArea
          isGenerating={isGenerating}
          canChat={canChat}
          modelsLoading={modelsLoading}
          models={models}
          selectedModel={selectedModel}
          modelPopoverOpen={modelPopoverOpen}
          setModelPopoverOpen={setModelPopoverOpen}
          setSelectedModel={setSelectedModel}
          onSend={handleSend}
          onStop={stop}
          onConfigure={() => {
            onOpenChange(false);
            navigate('/platform/setup/ai');
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function Header({
  hasMessages,
  clearChat,
  onClose,
}: {
  hasMessages: boolean;
  clearChat: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b bg-background shrink-0">
      <div className="flex items-center gap-2.5">
        <img src="/logo.svg" alt="Activepieces" className="size-6" />
        <SheetTitle className="text-sm font-semibold">
          {t('Activepieces AI')}
        </SheetTitle>
      </div>
      <div className="flex items-center gap-0.5">
        {hasMessages && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={clearChat}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Clear conversation')}
            </TooltipContent>
          </Tooltip>
        )}
        <ReindexButton />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Close')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

const MessageBubble = React.memo(
  function MessageBubble({
    message,
    isStreaming,
  }: {
    message: UIMessage;
    isStreaming: boolean;
  }) {
    const content = message.parts.find(isTextUIPart)?.text ?? '';
    const isUser = message.role === 'user';

    if (isUser) {
      return (
        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      );
    }

    if (!content && !isStreaming) return null;
    if (!content) return null;

    return (
      <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="size-7 rounded-full bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
          <img src="/logo.svg" alt="" className="size-4" />
        </div>
        <div className="flex-1 min-w-0 text-sm leading-relaxed">
          <AssistantMarkdown content={content} />
          {isStreaming && (
            <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse ml-1 align-middle" />
          )}
          {!isStreaming && content && <CopyBtn text={content} />}
        </div>
      </div>
    );
  },
  (prev, next) => {
    // Always re-render the currently-streaming bubble so it shows each new token
    if (prev.isStreaming || next.isStreaming) return false;
    // Completed messages: skip re-render unless content or role actually changed
    const prevText = prev.message.parts.find(isTextUIPart)?.text ?? '';
    const nextText = next.message.parts.find(isTextUIPart)?.text ?? '';
    return prevText === nextText && prev.message.role === next.message.role;
  },
);

const AssistantMarkdown = React.memo(
  function AssistantMarkdown({ content }: { content: string }) {
    return (
      <div className="space-y-2">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 leading-7">{children}</p>
            ),
            h1: ({ children }) => (
              <h1 className="text-base font-bold mt-4 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold mt-4 mb-2 border-b border-border pb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary/30 pl-3 my-2 italic text-foreground/70">
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const lang = /language-(\w+)/.exec(className ?? '')?.[1];
              const text = String(children).trim();
              if (!lang)
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono">
                    {text}
                  </code>
                );
              return <CodeBlock lang={lang} code={text} />;
            },
            table: ({ children }) => (
              <div className="my-2 overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 text-left font-semibold bg-muted/50 border-b text-xs">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 border-b">{children}</td>
            ),
            tr: ({ children }) => (
              <tr className="even:bg-muted/20">{children}</tr>
            ),
          }}
        >
          {content}
        </Markdown>
      </div>
    );
  },
  (prev, next) => prev.content === next.content,
);

const CodeBlock = React.memo(function CodeBlock({
  lang,
  code,
}: {
  lang: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          {lang}
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={cn(
            'text-[10px] px-1.5 py-0.5 rounded',
            copied
              ? 'text-emerald-500'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto bg-muted/20">
        <code className="text-[12px] leading-relaxed font-mono">{code}</code>
      </pre>
    </div>
  );
});

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        'text-[10px] px-2 py-0.5 rounded-md border border-transparent hover:border-border mt-2 block',
        copied
          ? 'text-emerald-500'
          : 'text-muted-foreground/50 hover:text-muted-foreground',
      )}
    >
      {copied ? (
        <>
          <Check className="size-3 inline" /> {t('Copied')}
        </>
      ) : (
        <>
          <Copy className="size-3 inline" /> {t('Copy')}
        </>
      )}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="size-7 rounded-full bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
        <img src="/logo.svg" alt="" className="size-4" />
      </div>
      <div className="flex items-center gap-1.5 py-2">
        <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-duration:0.8s]" />
        <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
        <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
      </div>
    </div>
  );
}

function lastAssistantHasText(msgs: UIMessage[]): boolean {
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== 'assistant') return false;
  return (last.parts.find(isTextUIPart)?.text ?? '').length > 0;
}

function EmptyState({
  canChat,
  modelsLoading,
  onSuggest,
  onConfigure,
}: {
  canChat: boolean;
  modelsLoading: boolean;
  onSuggest: (s: string) => void;
  onConfigure: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full gap-8 py-4">
      <div className="flex flex-col items-center text-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="relative">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center">
            <img src="/logo.svg" alt="" className="size-8" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold">{t('Activepieces AI')}</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            {t(
              'Ask about flows, pieces, deployment, or anything Activepieces.',
            )}
          </p>
        </div>
      </div>
      {!canChat && !modelsLoading && (
        <Button
          variant="outline"
          className="gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100"
          onClick={onConfigure}
        >
          <Settings className="size-4" />
          {t('Configure AI Provider')}
        </Button>
      )}
      <div className="w-full grid grid-cols-2 gap-2">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.text}
              type="button"
              disabled={!canChat}
              onClick={() => onSuggest(s.text)}
              style={{
                animationDelay: `${200 + i * 60}ms`,
                animationFillMode: 'both',
              }}
              className={cn(
                'group text-left p-3 rounded-xl border bg-muted/30 animate-in fade-in slide-in-from-bottom-1 duration-400',
                canChat
                  ? 'hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm transition-all duration-150'
                  : 'opacity-40 cursor-not-allowed',
              )}
            >
              <div className="flex flex-col gap-2">
                <Icon
                  className={cn(
                    'size-4 transition-colors duration-150',
                    canChat
                      ? 'text-muted-foreground group-hover:text-primary'
                      : 'text-muted-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-xs leading-snug transition-colors duration-150',
                    canChat
                      ? 'text-muted-foreground group-hover:text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {t(s.text)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InputArea({
  isGenerating,
  canChat,
  modelsLoading,
  models,
  selectedModel,
  modelPopoverOpen,
  setModelPopoverOpen,
  setSelectedModel,
  onSend,
  onStop,
  onConfigure,
}: {
  isGenerating: boolean;
  canChat: boolean;
  modelsLoading: boolean;
  models: CopilotModel[];
  selectedModel: CopilotModel | null;
  modelPopoverOpen: boolean;
  setModelPopoverOpen: (v: boolean) => void;
  setSelectedModel: (m: CopilotModel) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onConfigure: () => void;
}) {
  const [localInput, setLocalInput] = useState('');

  const handleSend = () => {
    const trimmed = localInput.trim();
    if (!trimmed || isGenerating || !canChat) return;
    onSend(trimmed);
    setLocalInput('');
  };

  return (
    <div className="px-4 pb-4 pt-3 bg-background border-t shrink-0">
      {!canChat && !modelsLoading && (
        <Button
          variant="outline"
          className="w-full mb-3 gap-2 text-sm"
          onClick={onConfigure}
        >
          <Settings className="size-4" />
          {t('Configure AI Provider')}
        </Button>
      )}
      <div className="flex flex-col rounded-xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring transition-shadow">
        <textarea
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm placeholder:text-muted-foreground outline-none min-h-11 max-h-40 leading-relaxed"
          placeholder={t('Ask anything about Activepieces...')}
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isGenerating || !canChat}
        />
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            modelsLoading={modelsLoading}
            open={modelPopoverOpen}
            onOpenChange={setModelPopoverOpen}
            onSelect={setSelectedModel}
          />
          {isGenerating ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
              onClick={onStop}
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="size-8 rounded-lg"
              disabled={!localInput.trim() || !canChat}
              onClick={handleSend}
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModelSelector({
  models,
  selectedModel,
  modelsLoading,
  open,
  onOpenChange,
  onSelect,
}: {
  models: CopilotModel[];
  selectedModel: CopilotModel | null;
  modelsLoading: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (m: CopilotModel) => void;
}) {
  if (models.length === 0)
    return (
      <span className="text-[11px] text-muted-foreground">
        {modelsLoading ? t('Loading...') : ''}
      </span>
    );
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 h-7 px-1.5 text-[11px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors max-w-[200px]"
        >
          <span className="truncate">
            {selectedModel
              ? `${selectedModel.providerDisplayName} / ${selectedModel.modelName}`
              : t('Select model')}
          </span>
          <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" side="top">
        <Command>
          <CommandInput
            placeholder={t('Search models...')}
            className="h-9 text-sm"
          />
          <CommandList className="max-h-[220px] overflow-y-scroll">
            <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
              {t('No models found')}
            </CommandEmpty>
            {models.map((m) => (
              <CommandItem
                key={`${m.provider}-${m.modelId}`}
                value={`${m.providerDisplayName} ${m.modelName} ${m.modelId}`}
                onSelect={() => {
                  onSelect(m);
                  onOpenChange(false);
                }}
                className="text-xs gap-2 flex items-center"
              >
                <Check
                  className={cn(
                    'size-3.5 shrink-0',
                    selectedModel?.modelId === m.modelId
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
                <span className="text-muted-foreground whitespace-nowrap shrink-0">
                  {m.providerDisplayName} /
                </span>
                <span className="truncate ml-1">{m.modelName}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ReindexButton() {
  const [s, setS] = useState<'idle' | 'loading' | 'done'>('idle');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          disabled={s === 'loading'}
          onClick={() => {
            setS('loading');
            void fetch(`${API_URL}/v1/platform-copilot/index`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${
                  authenticationSession.getToken() ?? ''
                }`,
              },
            })
              .then(() => {
                setS('done');
                setTimeout(() => setS('idle'), 3000);
              })
              .catch(() => setS('idle'));
          }}
        >
          <RefreshCw
            className={cn(
              'size-4',
              s === 'loading' && 'animate-spin',
              s === 'done' && 'text-emerald-500',
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('Reindex')}</TooltipContent>
    </Tooltip>
  );
}

type PlatformCopilotSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};