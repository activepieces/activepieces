import { isTextUIPart, UIMessage } from 'ai';
import { t } from 'i18next';
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronsUpDown,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  FileCode,
  RefreshCw,
  Settings,
  Square,
  Trash2,
  XIcon,
} from 'lucide-react';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import remarkBreaks from 'remark-breaks';
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

const SUGGESTION_GROUPS = [
  {
    icon: BookOpen,
    items: ['How do I build my first flow?', 'What pieces are available?'],
  },
  {
    icon: Code2,
    items: ['How do I write a custom piece?', 'How do I set up webhooks?'],
  },
  {
    icon: Cpu,
    items: ['How do I deploy with Docker?', 'How do I configure AI providers?'],
  },
] as const;

const GITHUB_BASE = 'https://github.com/activepieces/activepieces/blob/main';
const DOCS_BASE = 'https://activepieces.com/docs';

export function PlatformCopilotSheet({
  open,
  onOpenChange,
}: PlatformCopilotSheetProps) {
  const navigate = useNavigate();
  const { models, isLoading: modelsLoading } = useCopilotModels();
  const [selectedModel, setSelectedModel] = useState<CopilotModel | null>(null);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0]);
    }
  }, [models, selectedModel]);

  const { messages, sendMessage, status, stop, clearChat } = usePlatformCopilot(
    { selectedModel },
  );
  const isLoading = status === 'submitted' || status === 'streaming';
  const canChat = selectedModel !== null;

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasActivity = messages.length > 0 || isLoading;

  const fileSnippets = useMemo(() => extractFileSnippets(messages), [messages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120;
    if (isNearBottom || isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = input.trim();
        if (trimmed && !isLoading && canChat) {
          setInput('');
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
          void sendMessage({ text: trimmed });
        }
      }
    },
    [input, isLoading, canChat, sendMessage],
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading || !canChat) return;
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      void sendMessage({ text: trimmed });
    },
    [input, isLoading, canChat, sendMessage],
  );

  const handleSuggest = useCallback(
    (text: string) => {
      if (!isLoading && canChat) void sendMessage({ text });
    },
    [isLoading, canChat, sendMessage],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideCloseButton
        className="w-full sm:max-w-[680px] flex flex-col p-0 gap-0 border-l shadow-2xl outline-none focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt="Activepieces"
              className="size-6 shrink-0"
            />
            <SheetTitle className="text-sm font-semibold">
              {t('Activepieces AI')}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-0.5">
            {hasActivity && (
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
                  onClick={() => onOpenChange(false)}
                >
                  <XIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Close')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-muted/20"
        >
          {!hasActivity ? (
            <IntroScreen
              onSuggest={handleSuggest}
              canChat={canChat}
              modelsLoading={modelsLoading}
              onConfigureProviders={() => {
                onOpenChange(false);
                navigate('/platform/setup/ai');
              }}
            />
          ) : (
            <div className="flex flex-col gap-6 px-5 py-5">
              {messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  chatDone={status === 'ready'}
                  files={fileSnippets}
                  index={index}
                />
              ))}
              {isLoading &&
                messages[messages.length - 1]?.role !== 'assistant' && (
                  <ThinkingRow />
                )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-3 bg-background border-t shrink-0">
          {!canChat && !modelsLoading && (
            <Button
              variant="outline"
              className="w-full mb-3 gap-2 text-sm"
              onClick={() => {
                onOpenChange(false);
                navigate('/platform/setup/ai');
              }}
            >
              <Settings className="size-4" />
              {t('Configure AI Provider')}
            </Button>
          )}
          <form
            onSubmit={handleSend}
            className="flex flex-col rounded-xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring transition-shadow"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm placeholder:text-muted-foreground outline-none min-h-[44px] max-h-[160px] leading-relaxed"
              placeholder={t('Ask anything about Activepieces...')}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !canChat}
            />
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              {models.length > 0 ? (
                <Popover
                  open={modelPopoverOpen}
                  onOpenChange={setModelPopoverOpen}
                >
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
                  <PopoverContent
                    className="w-[280px] p-0"
                    align="start"
                    side="top"
                  >
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
                              setSelectedModel(m);
                              setModelPopoverOpen(false);
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
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {modelsLoading ? t('Loading models...') : ''}
                </span>
              )}
              {isLoading ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={stop}
                >
                  <Square className="size-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="size-8 rounded-lg shrink-0"
                  disabled={!input.trim() || !canChat}
                >
                  <ArrowUp className="size-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Reindex button ── */

function ReindexButton() {
  const [reindexStatus, setReindexStatus] = useState<
    'idle' | 'loading' | 'done'
  >('idle');

  const handleReindex = async () => {
    setReindexStatus('loading');
    try {
      await fetch(`${API_URL}/v1/platform-copilot/index`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authenticationSession.getToken() ?? ''}`,
        },
      });
      setReindexStatus('done');
      setTimeout(() => setReindexStatus('idle'), 3000);
    } catch {
      setReindexStatus('idle');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 rounded-full"
      onClick={() => void handleReindex()}
      disabled={reindexStatus === 'loading'}
      title={t('Reindex knowledge base')}
    >
      <RefreshCw
        className={cn(
          'size-4',
          reindexStatus === 'loading' && 'animate-spin',
          reindexStatus === 'done' && 'text-emerald-500',
        )}
      />
    </Button>
  );
}

/* ── Message item ── */

function MessageItem({
  message,
  chatDone,
  files,
  index,
}: {
  message: UIMessage;
  chatDone: boolean;
  files: FileSnippet[];
  index: number;
}) {
  const isUser = message.role === 'user';
  const content = message.parts.find(isTextUIPart)?.text ?? '';

  const animationDelay = `${Math.min(index * 60, 300)}ms`;

  if (isUser) {
    return (
      <div
        className="flex flex-col items-end gap-1"
        style={{
          animation: 'copilot-fade-in 0.25s ease-out both',
          animationDelay,
        }}
      >
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] leading-relaxed shadow-sm whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }

  const isComplete = chatDone || message.role !== 'assistant';

  if (!content && isComplete) return null;

  return (
    <div
      className="flex items-start gap-3"
      style={{
        animation: 'copilot-fade-in 0.25s ease-out both',
        animationDelay,
      }}
    >
      <div className="flex items-center justify-center size-7 rounded-full bg-background border border-border shrink-0 mt-0.5">
        <img src="/logo.svg" alt="" className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        {content ? (
          <>
            {/* While chat is still generating: plain pre-wrap text (fast).
                Once status='ready': full markdown with code highlighting. */}
            {isComplete ? (
              <>
                <CopilotMarkdown content={content} />
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {files.map((f) => {
                      const url = buildFileUrl(f.filePath);
                      return (
                        <a
                          key={f.filePath}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-mono',
                            'px-2 py-1 rounded-md border border-border',
                            'bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors',
                          )}
                        >
                          <FileCode className="size-3 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {f.filePath.split('/').pop()}
                          </span>
                          <ExternalLink className="size-2.5 shrink-0 opacity-50" />
                        </a>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <CopyButton text={content} />
                </div>
              </>
            ) : (
              <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {content}
                <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse ml-1 align-middle" />
              </div>
            )}
          </>
        ) : (
          <ThinkingDots />
        )}
      </div>
    </div>
  );
}

/* ── Copy button ── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? t('Response copied') : t('Copy response')}
      className={cn(
        'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md transition-all',
        'border border-transparent hover:border-border',
        copied
          ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
          : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50',
      )}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      <span>{copied ? t('Response copied') : t('Copy response')}</span>
    </button>
  );
}

/* ── Code block with copy + syntax highlighting ── */

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="my-3 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {lang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors',
            copied
              ? 'text-emerald-500'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto bg-muted/30">
        <code className="text-[12px] leading-relaxed font-mono text-foreground/85">
          {code}
        </code>
      </pre>
    </div>
  );
}

/* ── Lightweight markdown ── */

const CopilotMarkdown = memo(
  ({ content }: { content: string }) => (
    <div className="copilot-prose text-sm leading-relaxed text-foreground/90">
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-7">{children}</p>;
          },
          h1({ children }) {
            return (
              <h1 className="text-base font-bold mt-5 mb-2.5 text-foreground tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm font-bold mt-4 mb-2 text-foreground border-b border-border pb-1.5">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>
            );
          },
          li({ children }) {
            return (
              <li className="text-foreground/85 leading-relaxed">{children}</li>
            );
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-foreground">
                {children}
              </strong>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                {children}
                <ExternalLink className="size-2.5 opacity-60 shrink-0" />
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-foreground/65 italic bg-muted/30 py-2 rounded-r-md">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-4 border-border" />;
          },
          code({ className, children }) {
            const lang = /language-(\w+)/.exec(className ?? '')?.[1];
            const text = String(children).trim();

            if (!lang) {
              return (
                <code className="bg-muted/70 text-foreground border border-border/50 px-1.5 py-0.5 rounded text-[12px] font-mono">
                  {text}
                </code>
              );
            }

            return <CodeBlock lang={lang} code={text} />;
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead>{children}</thead>;
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return (
              <tr className="even:bg-muted/30 border-b border-border last:border-b-0">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-left font-semibold bg-muted/60 text-foreground text-xs uppercase tracking-wide">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-3 py-2 text-foreground/85">{children}</td>;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  ),
  (prev, next) => prev.content === next.content,
);
CopilotMarkdown.displayName = 'CopilotMarkdown';

/* ── Thinking dots (standalone) ── */

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <div className="size-1.5 rounded-full bg-primary/40 animate-bounce animation-duration-[0.8s]" />
      <div className="size-1.5 rounded-full bg-primary/40 animate-bounce animation-duration-[0.8s] [animation-delay:0.2s]" />
      <div className="size-1.5 rounded-full bg-primary/40 animate-bounce animation-duration-[0.8s] [animation-delay:0.4s]" />
    </div>
  );
}

/* ── Thinking row (with avatar) ── */

function ThinkingRow() {
  return (
    <div
      className="flex items-start gap-3"
      style={{ animation: 'copilot-fade-in 0.25s ease-out both' }}
    >
      <div className="flex items-center justify-center size-7 rounded-full bg-background border border-border shrink-0 mt-0.5">
        <img src="/logo.svg" alt="" className="size-4" />
      </div>
      <ThinkingDots />
    </div>
  );
}

/* ── Intro screen ── */

function IntroScreen({
  onSuggest,
  canChat,
  modelsLoading,
  onConfigureProviders,
}: {
  onSuggest: (text: string) => void;
  canChat: boolean;
  modelsLoading: boolean;
  onConfigureProviders: () => void;
}) {
  const allItems = SUGGESTION_GROUPS.flatMap((g) =>
    g.items.map((item) => ({ item, group: g })),
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 gap-10">
      <div
        className="flex flex-col items-center text-center gap-4"
        style={{
          animation: 'copilot-fade-in 0.4s ease-out both',
          animationDelay: '0ms',
        }}
      >
        <div className="flex items-center justify-center size-16 rounded-2xl bg-background border border-border shadow-sm">
          <img src="/logo.svg" alt="Activepieces" className="size-9" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('Activepieces AI')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Ask about flows, pieces, or the codebase.')}
          </p>
        </div>
      </div>

      {!canChat && !modelsLoading && (
        <div
          className="w-full flex flex-col items-center gap-3"
          style={{
            animation: 'copilot-fade-in 0.4s ease-out both',
            animationDelay: '60ms',
          }}
        >
          <p className="text-sm text-muted-foreground text-center">
            {t('Configure an AI provider to start chatting.')}
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onConfigureProviders}
          >
            <Settings className="size-4" />
            {t('Configure AI Provider')}
          </Button>
        </div>
      )}

      <div
        className="w-full grid grid-cols-2 gap-2"
        style={{
          animation: 'copilot-fade-in 0.4s ease-out both',
          animationDelay: '80ms',
        }}
      >
        {allItems.map(({ item, group }, idx) => (
          <button
            key={item}
            type="button"
            onClick={() => onSuggest(item)}
            disabled={!canChat}
            style={{
              animation: 'copilot-fade-in 0.35s ease-out both',
              animationDelay: `${120 + idx * 40}ms`,
            }}
            className={cn(
              'flex items-start gap-2 text-left text-xs p-3 rounded-xl border border-border/60 bg-background',
              canChat
                ? 'hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm'
                : 'opacity-50 cursor-not-allowed',
              'transition-all duration-150',
            )}
          >
            <group.icon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-foreground/80 leading-snug">{t(item)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function buildFileUrl(filePath: string): string {
  if (filePath.startsWith('docs/')) {
    const slug = filePath.replace(/^docs\//, '').replace(/\.mdx?$/, '');
    return `${DOCS_BASE}/${slug}`;
  }
  return `${GITHUB_BASE}/${filePath}`;
}

function extractFileSnippets(messages: UIMessage[]): FileSnippet[] {
  const files: FileSnippet[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    for (const part of msg.parts) {
      if (part.type !== 'dynamic-tool') continue;
      if (part.toolName !== 'read_file') continue;
      if (part.state !== 'output-available') continue;

      const output = part.output;
      if (!output || typeof output !== 'object') continue;

      const record = output as Record<string, unknown>;
      const filePath =
        typeof record['filePath'] === 'string' ? record['filePath'] : null;
      if (!filePath) continue;
      if (seen.has(filePath)) continue;

      seen.add(filePath);
      files.push({ filePath });
    }
  }
  return files;
}
const COPILOT_ANIMATION_STYLES = `
@keyframes copilot-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}`;

let stylesInjected = false;
function ensureAnimationStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.textContent = COPILOT_ANIMATION_STYLES;
  document.head.appendChild(el);
}
if (typeof document !== 'undefined') {
  ensureAnimationStyles();
}

type FileSnippet = {
  filePath: string;
};

type PlatformCopilotSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
