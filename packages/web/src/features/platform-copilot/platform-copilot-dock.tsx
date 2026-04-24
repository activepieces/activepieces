import { isTextUIPart, ToolUIPart, UIMessage } from 'ai';
import { t } from 'i18next';
import { ArrowUp, Check, ChevronDown, Copy, SquarePen } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  CopilotComposer,
  CopilotComposerHandle,
} from './platform-copilot-composer';
import { CopilotGlyph } from './platform-copilot-glyph';
import { CopilotStarters } from './platform-copilot-starters';
import { InlineToolCluster } from './platform-copilot-tool-trace';
import { usePlatformCopilot } from './use-platform-copilot';

export function PlatformCopilotDock() {
  const [expanded, setExpanded] = useState(false);
  const modKey = useModKey();
  const panelRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setExpanded(true), []);
  const close = useCallback(() => setExpanded(false), []);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === 'Escape' && expanded) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded, toggle, close]);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (target.closest?.('[data-ap-copilot-portal]')) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, close]);

  return (
    <div
      className="absolute inset-x-0 bottom-6 z-40 pointer-events-none flex justify-center px-4"
      aria-label={t('Activepieces AI')}
    >
      <button
        type="button"
        onClick={open}
        aria-label={t('Ask Activepieces AI')}
        aria-hidden={expanded}
        tabIndex={expanded ? -1 : 0}
        className={cn(
          'pointer-events-auto group flex h-14 w-full md:w-[640px] max-w-[640px] items-center gap-3 rounded-full border border-border/60 bg-background/85 pl-4 pr-2 text-left backdrop-blur-2xl shadow-lg transition-all duration-150 ease-out',
          'hover:border-primary/40 hover:shadow-xl',
          expanded
            ? 'opacity-0 translate-y-4 pointer-events-none'
            : 'opacity-100 translate-y-0',
        )}
        style={{ position: expanded ? 'absolute' : 'relative' }}
      >
        <CopilotGlyph size={30} state="idle" />
        <span className="flex-1 truncate text-[14px] font-medium text-muted-foreground transition-colors group-hover:text-foreground/90">
          {t('Ask Activepieces AI')}
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-mono text-muted-foreground/80">
          {modKey}K
        </kbd>
        <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:scale-[1.04]">
          <ArrowUp className="size-[18px]" strokeWidth={2.4} />
        </span>
      </button>

      <div
        ref={panelRef}
        aria-hidden={!expanded}
        className={cn(
          'pointer-events-auto w-full md:w-[720px] max-w-[720px] transition-all duration-150 ease-out',
          expanded
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-[0.98] pointer-events-none',
        )}
        style={{ position: expanded ? 'relative' : 'absolute' }}
      >
        <ExpandedPanel expanded={expanded} onMinimize={close} />
      </div>
    </div>
  );
}

function ExpandedPanel({
  expanded,
  onMinimize,
}: {
  expanded: boolean;
  onMinimize: () => void;
}) {
  const { messages, sendMessage, status, stop, clearChat } =
    usePlatformCopilot();
  const isGenerating = status === 'submitted' || status === 'streaming';
  const composerRef = useRef<CopilotComposerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stuckToBottomRef = useRef(true);

  const hasMessages = messages.length > 0;
  const showStarters = !hasMessages && !isGenerating;

  useEffect(() => {
    if (!expanded) return;
    const id = setTimeout(() => composerRef.current?.focus(), 180);
    return () => clearTimeout(id);
  }, [expanded]);

  useEffect(() => {
    if (!isGenerating) return;
    if (!stuckToBottomRef.current) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, isGenerating]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text || isGenerating) return;
      stuckToBottomRef.current = true;
      void sendMessage({ text });
    },
    [isGenerating, sendMessage],
  );

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stuckToBottomRef.current = distance <= 32;
  }, []);

  return (
    <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background/95 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <CopilotGlyph size={30} state="idle" />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[16px] font-semibold tracking-tight">
            {t('Activepieces AI')}
          </span>
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {hasMessages && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearChat}
                aria-label={t('New conversation')}
                className="size-9 rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              >
                <SquarePen className="size-[16px]" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('New conversation')}
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMinimize}
              aria-label={t('Minimize')}
              className="size-9 rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            >
              <ChevronDown className="size-[16px]" strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Minimize (Esc)')}</TooltipContent>
        </Tooltip>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="max-h-[min(560px,calc(100vh-240px))] overflow-y-auto px-5 pb-2"
      >
        {showStarters ? (
          <div className="pt-3 pb-4">
            <CopilotStarters onSelect={handleSend} />
          </div>
        ) : (
          <div className="pt-2 flex flex-col gap-5">
            {messages.map((msg) => (
              <MessageRow
                key={msg.id}
                message={msg}
                isStreaming={
                  isGenerating && msg.id === messages[messages.length - 1]?.id
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-3 pb-5">
        <CopilotComposer
          ref={composerRef}
          onSend={handleSend}
          onStop={stop}
          streaming={isGenerating}
        />
      </div>
    </div>
  );
}

const MessageRow = React.memo(
  function MessageRow({
    message,
    isStreaming,
  }: {
    message: UIMessage;
    isStreaming: boolean;
  }) {
    const isUser = message.role === 'user';
    const segments = segmentParts(message.parts);
    const lastClusterIdx = findLastClusterIdx(segments);

    if (isUser) {
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {collectText(message)}
          </div>
        </div>
      );
    }

    const fullText = collectText(message);
    const hasActivity = segments.length > 0;
    if (!hasActivity && !isStreaming) return null;

    return (
      <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="shrink-0 mt-0.5">
          <CopilotGlyph size={28} state={isStreaming ? 'thinking' : 'done'} />
        </div>
        <div className="flex-1 min-w-0 space-y-2 text-sm leading-relaxed">
          {segments.map((segment, idx) => {
            if (segment.kind === 'toolCluster') {
              return (
                <InlineToolCluster
                  key={idx}
                  parts={segment.parts}
                  streaming={isStreaming && idx === lastClusterIdx}
                />
              );
            }
            return <AssistantMarkdown key={idx} content={segment.text} />;
          })}
          {isStreaming && fullText.length === 0 && segments.length === 0 && (
            <TypingDots />
          )}
          {!isStreaming && fullText.length > 0 && (
            <CopyButton text={fullText} />
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    if (prev.isStreaming || next.isStreaming) return false;
    if (prev.message.parts.length !== next.message.parts.length) return false;
    return collectText(prev.message) === collectText(next.message);
  },
);

type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'toolCluster'; parts: ToolUIPart[] };

function findLastClusterIdx(segments: Segment[]): number {
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i].kind === 'toolCluster') return i;
  }
  return -1;
}

function segmentParts(parts: UIMessage['parts']): Segment[] {
  const segments: Segment[] = [];
  let currentTool: ToolUIPart[] | null = null;
  let currentText = '';

  const flushText = () => {
    if (currentText.length === 0) return;
    segments.push({ kind: 'text', text: currentText });
    currentText = '';
  };

  for (const part of parts) {
    if (isToolPart(part)) {
      flushText();
      if (!currentTool) {
        currentTool = [];
        segments.push({ kind: 'toolCluster', parts: currentTool });
      }
      currentTool.push(part);
      continue;
    }
    if (isTextUIPart(part)) {
      currentTool = null;
      currentText += part.text;
    }
  }
  flushText();
  return segments;
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-7">{children}</p>
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-bold mt-3 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
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
          if (!lang) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono">
                {text}
              </code>
            );
          }
          return <CodeBlock lang={lang} code={text} />;
        },
      }}
    >
      {content}
    </Markdown>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
        <span className="text-[10px] font-mono uppercase text-muted-foreground">
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
}

function CopyButton({ text }: { text: string }) {
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
        'mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] border border-transparent transition-colors hover:border-border',
        copied
          ? 'text-emerald-500'
          : 'text-muted-foreground/60 hover:text-muted-foreground',
      )}
    >
      {copied ? (
        <>
          <Check className="size-3" /> {t('Copied')}
        </>
      ) : (
        <>
          <Copy className="size-3" /> {t('Copy')}
        </>
      )}
    </button>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-duration:0.8s]" />
      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
      <span className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
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

function useModKey() {
  const subscribe = useCallback(() => () => {}, []);
  const isMac = useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent),
    () => false,
  );
  return isMac ? '⌘' : 'Ctrl';
}
