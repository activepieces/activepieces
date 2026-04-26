import { ChatMessageItem } from '@activepieces/shared';
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
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

import { getTextFromBlocks } from '../lib/message-parsers';

import { ChatThinkingLoader } from './chat-thinking-loader';
import { MessageContentWithAuth } from './message-content';
import { ToolCallGroup } from './tool-call-group';

export function ChatMessage({
  message,
  isStreaming,
  onCancel,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  message: ChatMessageItem;
  isStreaming: boolean;
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
      onCancel={onCancel}
      onRetry={onRetry}
      onSend={onSend}
      connectedPieces={connectedPieces}
      onPieceConnected={onPieceConnected}
    />
  );
}

export function UserMessage({ message }: { message: ChatMessageItem }) {
  const content = getTextFromBlocks(message.blocks);

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
            {message.fileNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {message.fileNames.map((name, i) => (
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
            <MessageContent className="prose-sm">{content}</MessageContent>
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

export function AssistantMessage({
  message,
  isStreaming,
  onCancel,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  message: ChatMessageItem;
  isStreaming: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  connectedPieces: Set<string>;
  onPieceConnected: (piece: string) => void;
}) {
  const hasThoughts = message.thoughts.length > 0;
  const hasBlocks = message.blocks.length > 0;
  const hasContent = message.blocks.some(
    (b) => b.type === 'text' && b.text.length > 0,
  );
  const isWaiting = isStreaming && !hasThoughts && !hasBlocks;
  const isThinkingOnly = isStreaming && hasThoughts && !hasBlocks;
  const isThinking = isWaiting || isThinkingOnly;
  const thinkingSeconds = useThinkingTimer(isThinking);
  const fullText = getTextFromBlocks(message.blocks);
  const isLastBlock = (idx: number) => idx === message.blocks.length - 1;

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
                {message.thoughts}
              </ReasoningContent>
            </Reasoning>
          )}

          {message.blocks.map((block, idx) => {
            if (block.type === 'text' && block.text.length > 0) {
              return (
                <MessageContentWithAuth
                  key={idx}
                  content={block.text}
                  onSend={onSend}
                  isStreaming={isStreaming && isLastBlock(idx)}
                  connectedPieces={connectedPieces}
                  onPieceConnected={onPieceConnected}
                />
              );
            }
            if (block.type === 'tool_calls') {
              return (
                <ToolCallGroup
                  key={idx}
                  toolCalls={block.calls}
                  isStreaming={isStreaming}
                />
              );
            }
            return null;
          })}

          {message.plan && <PlanCard entries={message.plan} />}

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
