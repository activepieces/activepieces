import { isDataUIPart } from 'ai';
import { t } from 'i18next';
import { Paperclip, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
} from '@/components/prompt-kit/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/prompt-kit/reasoning';
import { PlanCard } from '@/features/chat/components/plan-card';
import { ChatDataParts, ChatUIMessage } from '@/features/chat/lib/chat-types';
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

import { getTextFromParts } from '../lib/message-parsers';

import { ChatThinkingLoader } from './chat-thinking-loader';
import { MessageContentWithAuth } from './message-content';
import { ToolCallGroup } from './tool-call-group';

export function ChatMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onCancel,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
}) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }

  return (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      isLastMessage={isLastMessage}
      onCancel={onCancel}
      onRetry={onRetry}
      onSend={onSend}
      connectedPieces={connectedPieces}
      onPieceConnected={onPieceConnected}
    />
  );
}

export function UserMessage({ message }: { message: ChatUIMessage }) {
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
          <div className="bg-muted rounded-2xl rounded-br-md px-4 py-2.5">
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
        <MessageActions className="justify-end mt-1">
          <MessageAction tooltip={t('Copy')}>
            <CopyButton
              textToCopy={content}
              withoutTooltip
              variant="ghost"
              className="h-6 w-6 p-0"
            />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
}

function extractPlanEntries(
  parts: ChatUIMessage['parts'],
): Array<{ content: string; status: string }> {
  const last = parts.findLast(
    (p): p is Extract<typeof p, { type: 'data-plan' }> =>
      isDataUIPart<ChatDataParts>(p) && p.type === 'data-plan',
  );
  return last ? last.data.entries : [];
}

export function AssistantMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onCancel,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
}) {
  const reasoningParts = message.parts.filter(
    (p): p is { type: 'reasoning'; text: string } => p.type === 'reasoning',
  );
  const thoughts = reasoningParts.map((p) => p.text).join('');
  const hasThoughts = thoughts.length > 0;

  const dynamicToolParts = message.parts.filter(
    (p) => p.type === 'dynamic-tool',
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
  const fullText = getTextFromParts(message.parts);

  const planEntries = extractPlanEntries(message.parts);

  const renderableParts = message.parts.filter(
    (p) =>
      (p.type === 'text' && 'text' in p && p.text.length > 0) ||
      p.type === 'dynamic-tool',
  );

  return (
    <motion.div
      className="py-3 group/msg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <AssistantAvatar />
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
                <ChatThinkingLoader onStop={onCancel} />
              </motion.div>
            )}
          </AnimatePresence>

          {hasThoughts && (
            <Reasoning isStreaming={isThinkingOnly} className="">
              <ReasoningTrigger className="text-sm text-muted-foreground">
                {formatThinkingTime({
                  seconds: thinkingSeconds,
                  isActive: isThinking,
                })}
              </ReasoningTrigger>
              <ReasoningContent markdown contentClassName="text-xs">
                {thoughts}
              </ReasoningContent>
            </Reasoning>
          )}

          {renderParts({
            parts: renderableParts,
            isStreaming,
            isLastMessage,
            onSend,
            connectedPieces,
            onPieceConnected,
          })}

          {planEntries.length > 0 && <PlanCard entries={planEntries} />}

          {hasContent && !isStreaming && (
            <MessageActions className="mt-2">
              <MessageAction tooltip={t('Copy')}>
                <CopyButton
                  textToCopy={fullText}
                  withoutTooltip
                  variant="ghost"
                  className="h-7 w-7 p-0"
                />
              </MessageAction>
              <MessageAction tooltip={t('Regenerate')}>
                <button
                  type="button"
                  onClick={onRetry}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </MessageAction>
            </MessageActions>
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
}: {
  parts: ChatUIMessage['parts'];
  isStreaming: boolean;
  isLastMessage?: boolean;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
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
      const isLast = idx === parts.length - 1;
      nodes.push(
        <MessageContentWithAuth
          key={idx}
          content={part.text}
          onSend={onSend}
          isStreaming={isStreaming && isLast}
          isLastMessage={isLastMessage}
          connectedPieces={connectedPieces}
          onPieceConnected={onPieceConnected}
        />,
      );
    }
  });

  flushTools('tools-end');
  return nodes;
}

function useThinkingTimer(isActive: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    setSeconds(0);
    const interval = setInterval(() => {
      if (startRef.current) {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return seconds;
}

function formatThinkingTime({
  seconds,
  isActive,
}: {
  seconds: number;
  isActive: boolean;
}): string {
  if (seconds < 1) {
    return isActive ? t('Thinking...') : t('Thought for a few seconds');
  }
  const duration = formatUtils.formatToHoursAndMinutes(seconds);
  return isActive
    ? t('Thinking for {duration}...', { duration })
    : t('Thought for {duration}', { duration });
}

const AssistantAvatar = memo(function AssistantAvatar() {
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <MessageAvatar
      src={branding.logos.logoIconUrl}
      alt=""
      fallback="AI"
      className="h-6 w-6 rounded-none overflow-visible"
    />
  );
});
