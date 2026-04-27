import { isDataUIPart } from 'ai';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
} from '@/components/prompt-kit/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/prompt-kit/reasoning';
import { PlanCard } from '@/features/chat/components/plan-card';
import { ChatDataParts, ChatUIMessage } from '@/features/chat/lib/chat-types';
import { flagsHooks } from '@/hooks/flags-hooks';

import { getTextFromParts } from '../lib/message-parsers';
import {
  formatThinkingTime,
  useThinkingTimer,
} from '../lib/use-thinking-timer';

import { ChatThinkingLoader } from './chat-thinking-loader';
import { MessageContentWithAuth } from './message-content';
import { ToolCallGroup } from './tool-call-group';

export function AssistantMessage({
  message,
  isStreaming,
  onCancel,
  onRetry,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
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
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  parts: ChatUIMessage['parts'];
  isStreaming: boolean;
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
          connectedPieces={connectedPieces}
          onPieceConnected={onPieceConnected}
        />,
      );
    }
  });

  flushTools('tools-end');
  return nodes;
}

function extractPlanEntries(
  parts: ChatUIMessage['parts'],
): Array<{ content: string; status: string }> {
  return parts.flatMap((p) => {
    if (isDataUIPart<ChatDataParts>(p) && p.type === 'data-plan') {
      return p.data.entries;
    }
    return [];
  });
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
