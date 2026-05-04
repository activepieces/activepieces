import { Project } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Copy, Paperclip, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
} from 'react';

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '@/components/prompt-kit/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/prompt-kit/reasoning';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

import { getTextFromParts } from '../lib/message-parsers';

import { ChatThinkingLoader } from './chat-thinking-loader';
import { MessageContentWithAuth } from './message-content';
import { ToolCallGroup } from './tool-call-group';

const HIDDEN_TOOLS = new Set(['ap_set_session_title', 'ap_select_project']);

export function ChatMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
  selectedProjectId,
  projects,
  onSelectProject,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
  selectedProjectId?: string | null;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
}) {
  if (message.role === 'user') {
    return <UserMessage message={message} isLastMessage={isLastMessage} />;
  }

  return (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      isLastMessage={isLastMessage}
      onRetry={onRetry}
      onSend={onSend}
      connectedPieces={connectedPieces}
      onPieceConnected={onPieceConnected}
      selectedProjectId={selectedProjectId}
      projects={projects}
      onSelectProject={onSelectProject}
    />
  );
}

export function UserMessage({
  message,
  isLastMessage = false,
}: {
  message: ChatUIMessage;
  isLastMessage?: boolean;
}) {
  const content = getTextFromParts(message.parts);
  const fileNames = message.parts
    .filter(
      (
        p,
      ): p is {
        type: 'file';
        filename: string;
        mediaType: string;
        url: string;
      } =>
        p.type === 'file' && 'filename' in p && typeof p.filename === 'string',
    )
    .map((p) => p.filename);

  return (
    <motion.div
      className="flex justify-end py-3 group/msg"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-[80%]">
        <Message className="flex-row-reverse">
          <div className="bg-muted rounded-2xl rounded-br-md px-2.5 py-1 text-sm">
            {fileNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {fileNames.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <Paperclip className="size-3" />
                    <span className="max-w-[150px] truncate">{name}</span>
                  </span>
                ))}
              </div>
            )}
            <MessageContent markdown className="prose-sm">
              {content}
            </MessageContent>
          </div>
        </Message>
        <MessageActions
          className={cn(
            'justify-end mt-1 transition-opacity',
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 group-hover/msg:opacity-100',
          )}
        >
          <MessageAction tooltip={t('Copy')}>
            <CopyIconButton textToCopy={content} className="h-6 w-6" />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
}

export function AssistantMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
  selectedProjectId,
  projects,
  onSelectProject,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
  selectedProjectId?: string | null;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
}) {
  const reasoningParts = message.parts.filter(
    (p): p is { type: 'reasoning'; text: string } => p.type === 'reasoning',
  );
  const thoughts = reasoningParts.map((p) => p.text).join('');
  const hasThoughts = thoughts.length > 0;

  const dynamicToolParts = message.parts.filter(
    (p) => p.type === 'dynamic-tool' && !HIDDEN_TOOLS.has(p.toolName),
  );
  const textParts = message.parts.filter(
    (p): p is { type: 'text'; text: string } =>
      p.type === 'text' && p.text.length > 0,
  );
  const hasContent = textParts.length > 0;
  const hasAnyParts = hasThoughts || dynamicToolParts.length > 0 || hasContent;

  const isWaiting = isStreaming && !hasAnyParts;
  const isThinkingOnly =
    isStreaming && hasThoughts && !hasContent && dynamicToolParts.length === 0;
  const isThinking = isWaiting || isThinkingOnly;
  const thinkingSeconds = useThinkingTimer(isThinking);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const fullText = getTextFromParts(message.parts);

  const renderableParts = message.parts.filter(
    (p) =>
      (p.type === 'text' && 'text' in p && p.text.length > 0) ||
      (p.type === 'dynamic-tool' && !HIDDEN_TOOLS.has(p.toolName)),
  );

  return (
    <motion.div
      className="py-3 group/msg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <div className="min-w-0 space-y-2 flex-1">
          <AnimatePresence mode="wait">
            {isWaiting && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ChatThinkingLoader />
              </motion.div>
            )}
          </AnimatePresence>

          {renderParts({
            parts: renderableParts,
            isStreaming,
            isLastMessage,
            onSend,
            connectedPieces,
            onPieceConnected,
            selectedProjectId,
            projects,
            onSelectProject,
          })}

          {isStreaming && !isWaiting && <ChatThinkingLoader showText={false} />}

          {hasContent && !isStreaming && (
            <Reasoning
              isStreaming={isThinkingOnly}
              open={isReasoningOpen}
              onOpenChange={setIsReasoningOpen}
            >
              {hasThoughts && (
                <ReasoningContent
                  markdown
                  className="pl-2"
                  contentClassName="text-xs italic text-muted-foreground relative pl-3 py-3 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-0.5 before:bg-muted-foreground/30"
                >
                  {thoughts}
                </ReasoningContent>
              )}
              <MessageActions
                className={cn(
                  'gap-1 transition-opacity',
                  isLastMessage
                    ? 'opacity-100'
                    : 'opacity-0 group-hover/msg:opacity-100',
                )}
              >
                <MessageAction tooltip={t('Copy')}>
                  <CopyIconButton textToCopy={fullText} className="h-6 w-6" />
                </MessageAction>
                <MessageAction tooltip={t('Regenerate')}>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </MessageAction>
                {hasThoughts && thinkingSeconds >= 0.1 && (
                  <MessageAction
                    tooltip={
                      isReasoningOpen ? t('Hide thinking') : t('Show thinking')
                    }
                  >
                    <ReasoningTrigger className="text-xs text-muted-foreground rounded-md px-1.5 py-1 gap-1 transition-colors hover:bg-muted hover:text-foreground [&>span]:!text-muted-foreground hover:[&>span]:!text-foreground [&>div>svg]:!h-3 [&>div>svg]:!w-3">
                      {formatThinkingTime({ seconds: thinkingSeconds })}
                    </ReasoningTrigger>
                  </MessageAction>
                )}
              </MessageActions>
            </Reasoning>
          )}
        </div>
      </Message>
    </motion.div>
  );
}

function renderParts({
  parts,
  isStreaming,
  isLastMessage = false,
  onSend,
  connectedPieces,
  onPieceConnected,
  selectedProjectId,
  projects,
  onSelectProject,
}: {
  parts: ChatUIMessage['parts'];
  isStreaming: boolean;
  isLastMessage?: boolean;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
  selectedProjectId?: string | null;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
}): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const toolBuffer: ChatUIMessage['parts'] = [];

  function flushTools(key: string) {
    if (toolBuffer.length === 0) return;
    const snapshot = [...toolBuffer];
    toolBuffer.length = 0;
    nodes.push(
      <ToolCallGroup
        key={key}
        toolParts={snapshot}
        isStreaming={isStreaming}
      />,
    );
  }

  parts.forEach((part, idx) => {
    if (part.type === 'dynamic-tool') {
      toolBuffer.push(part);
    } else if (part.type === 'text') {
      flushTools(`tools-before-${idx}`);
      nodes.push(
        <MessageContentWithAuth
          key={idx}
          content={part.text}
          onSend={onSend}
          isLastMessage={isLastMessage}
          connectedPieces={connectedPieces}
          onPieceConnected={onPieceConnected}
          selectedProjectId={selectedProjectId}
          projects={projects}
          onSelectProject={onSelectProject}
        />,
      );
    }
  });

  flushTools('tools-end');
  return nodes;
}

function useThinkingTimer(isActive: boolean): number {
  const startRef = useRef<number | null>(null);
  const finalRef = useRef<number>(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isActive) {
      startRef.current = Date.now();
    } else {
      if (startRef.current) {
        finalRef.current = (Date.now() - startRef.current) / 1000;
      }
      startRef.current = null;
      setSeconds(finalRef.current);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (startRef.current) {
        setSeconds((Date.now() - startRef.current) / 1000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  return seconds;
}

function formatThinkingTime({ seconds }: { seconds: number }): string {
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}s` : `${rounded.toFixed(1)}s`;
}

const CopyIconButton = forwardRef<
  HTMLButtonElement,
  {
    textToCopy: string;
    className?: string;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function CopyIconButton({ textToCopy, className, ...rest }, ref) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard not available
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) handleCopy();
      }}
      className={cn(
        'flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
});
