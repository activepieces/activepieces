import { isTextUIPart, ToolUIPart, UIMessage } from 'ai';
import { t } from 'i18next';
import {
  ArrowUp,
  Bot,
  Check,
  Code2,
  Copy,
  FileText,
  Folder,
  Github,
  Globe,
  Puzzle,
  Search,
  Server,
  Square,
  Trash2,
  XIcon,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { usePlatformCopilot } from './use-platform-copilot';

const SUGGESTIONS = [
  { text: 'How do I build my first flow?', icon: Zap },
  { text: 'What pieces are available?', icon: Puzzle },
  { text: 'How do I write a custom piece?', icon: Code2 },
  { text: 'How do I set up webhooks?', icon: Globe },
  { text: 'How do I deploy with Docker?', icon: Server },
  { text: 'What plans does Activepieces offer?', icon: Bot },
];

export function PlatformCopilotSheet({
  open,
  onOpenChange,
}: PlatformCopilotSheetProps) {
  const { messages, sendMessage, status, stop, clearChat } =
    usePlatformCopilot();

  const isGenerating = status === 'submitted' || status === 'streaming';
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
      if (!text || isGenerating) return;
      void sendMessage({ text });
    },
    [isGenerating, sendMessage],
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
            <EmptyState onSuggest={handleSend} />
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isGenerating}
                />
              ))}
              {isGenerating && !lastAssistantHasActivity(messages) && (
                <TypingIndicator />
              )}
            </div>
          )}
        </div>

        <InputArea
          isGenerating={isGenerating}
          onSend={handleSend}
          onStop={stop}
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
    const isUser = message.role === 'user';
    const text = collectText(message);

    if (isUser) {
      return (
        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );
    }

    const toolParts = message.parts.filter(isToolPart);
    const hasActivity = toolParts.length > 0 || text.length > 0;
    if (!hasActivity && !isStreaming) return null;
    if (!hasActivity) return null;

    return (
      <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="size-7 rounded-full bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
          <img src="/logo.svg" alt="" className="size-4" />
        </div>
        <div className="flex-1 min-w-0 text-sm leading-relaxed space-y-2">
          {toolParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {toolParts.map((part, idx) => (
                <ToolChip key={`${part.type}-${idx}`} part={part} />
              ))}
            </div>
          )}
          {text.length > 0 && <AssistantMarkdown content={text} />}
          {isStreaming && (
            <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse ml-1 align-middle" />
          )}
          {!isStreaming && text.length > 0 && <CopyBtn text={text} />}
        </div>
      </div>
    );
  },
  (prev, next) => {
    if (prev.isStreaming || next.isStreaming) return false;
    if (prev.message.parts.length !== next.message.parts.length) return false;
    const prevText = collectText(prev.message);
    const nextText = collectText(next.message);
    return prevText === nextText && prev.message.role === next.message.role;
  },
);

function ToolChip({ part }: { part: ToolUIPart }) {
  const toolName = part.type.startsWith('tool-')
    ? part.type.slice('tool-'.length)
    : part.type;
  const { icon: Icon, label } = describeTool(toolName, part);
  const inProgress =
    part.state === 'input-streaming' || part.state === 'input-available';
  const errored = part.state === 'output-error';

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1.5 px-2 py-1 font-normal text-[11px] max-w-full',
        errored && 'bg-destructive-50 text-destructive-700',
      )}
    >
      <Icon className={cn('size-3 shrink-0', inProgress && 'animate-pulse')} />
      <span className="truncate">{label}</span>
    </Badge>
  );
}

function describeTool(
  toolName: string,
  part: ToolUIPart,
): { icon: typeof Search; label: string } {
  const input = (part.input ?? {}) as Record<string, unknown>;
  switch (toolName) {
    case 'research': {
      const queries = input['queries'];
      const first = Array.isArray(queries)
        ? (queries[0] as string | undefined)
        : undefined;
      return {
        icon: Search,
        label: chipLabel(t('Researching'), first),
      };
    }
    case 'web_search':
      return {
        icon: Search,
        label: chipLabel(t('Searching'), input['query'] as string | undefined),
      };
    case 'read_url':
      return {
        icon: FileText,
        label: chipLabel(
          t('Reading'),
          shortUrl(input['url'] as string | undefined),
        ),
      };
    case 'search_github_code':
      return {
        icon: Github,
        label: chipLabel(
          t('Searching repo'),
          input['query'] as string | undefined,
        ),
      };
    case 'read_github_file':
      return {
        icon: FileText,
        label: chipLabel(t('Reading'), input['filePath'] as string | undefined),
      };
    case 'list_github_directory':
      return {
        icon: Folder,
        label: chipLabel(t('Browsing'), input['dirPath'] as string | undefined),
      };
    default:
      return { icon: Search, label: toolName };
  }
}

function chipLabel(prefix: string, detail: string | undefined): string {
  const trimmed = (detail ?? '').toString().trim();
  if (trimmed.length === 0) return `${prefix}…`;
  const truncated = trimmed.length > 60 ? trimmed.slice(0, 60) + '…' : trimmed;
  return `${prefix}: ${truncated}`;
}

function shortUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname + u.pathname;
  } catch {
    return url;
  }
}

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

function lastAssistantHasActivity(msgs: UIMessage[]): boolean {
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== 'assistant') return false;
  if (last.parts.some(isToolPart)) return true;
  return collectText(last).length > 0;
}

function EmptyState({ onSuggest }: { onSuggest: (s: string) => void }) {
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
      <div className="w-full grid grid-cols-2 gap-2">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.text}
              type="button"
              onClick={() => onSuggest(s.text)}
              style={{
                animationDelay: `${200 + i * 60}ms`,
                animationFillMode: 'both',
              }}
              className="group text-left p-3 rounded-xl border bg-muted/30 animate-in fade-in slide-in-from-bottom-1 duration-400 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex flex-col gap-2">
                <Icon className="size-4 transition-colors duration-150 text-muted-foreground group-hover:text-primary" />
                <span className="text-xs leading-snug transition-colors duration-150 text-muted-foreground group-hover:text-foreground">
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
  onSend,
  onStop,
}: {
  isGenerating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [localInput, setLocalInput] = useState('');

  const handleSend = () => {
    const trimmed = localInput.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setLocalInput('');
  };

  return (
    <div className="px-4 pb-4 pt-3 bg-background border-t shrink-0">
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
          disabled={isGenerating}
        />
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <span className="text-[11px] text-muted-foreground/70">
            {t('Powered by Activepieces')}
          </span>
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
              disabled={!localInput.trim()}
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

function collectText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join('');
}

function isToolPart(part: UIMessage['parts'][number]): part is ToolUIPart {
  return typeof part.type === 'string' && part.type.startsWith('tool-');
}

type PlatformCopilotSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
