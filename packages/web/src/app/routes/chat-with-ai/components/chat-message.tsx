import { ChatMessageItem } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Copy, Paperclip, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';

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
import { ThinkingBar } from '@/components/prompt-kit/thinking-bar';
import { PlanCard } from '@/features/chat/components/plan-card';

import { MessageContentWithAuth } from './message-content';
import { getTextFromBlocks } from '../lib/message-parsers';
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
  const [copied, setCopied] = useState(false);
  const content = getTextFromBlocks(message.blocks);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div className="flex justify-end py-3 animate-in fade-in duration-200">
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
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </MessageAction>
        </MessageActions>
      </div>
    </div>
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
  const [copied, setCopied] = useState(false);
  const hasThoughts = message.thoughts.length > 0;
  const hasBlocks = message.blocks.length > 0;
  const hasContent = message.blocks.some(
    (b) => b.type === 'text' && b.text.length > 0,
  );
  const isWaiting = isStreaming && !hasThoughts && !hasBlocks;
  const isThinkingOnly = isStreaming && hasThoughts && !hasBlocks;
  const fullText = getTextFromBlocks(message.blocks);
  const isLastBlock = (idx: number) => idx === message.blocks.length - 1;

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullText]);

  return (
    <div className="py-3 animate-in fade-in duration-200">
      <div className="min-w-0 overflow-hidden space-y-2">
        {isWaiting && (
          <ThinkingBar
            text={t('Thinking')}
            onStop={onCancel}
            stopLabel={t('Stop')}
          />
        )}

        {hasThoughts && (
          <Reasoning isStreaming={isThinkingOnly} className="">
            <ReasoningTrigger className="text-sm text-muted-foreground">
              {t('Thought for a few seconds')}
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
            return <ToolCallGroup key={idx} toolCalls={block.calls} />;
          }
          return null;
        })}

        {message.plan && <PlanCard entries={message.plan} />}

        {hasContent && !isStreaming && (
          <MessageActions className="mt-2">
            <MessageAction tooltip={t('Copy')}>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
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
    </div>
  );
}
