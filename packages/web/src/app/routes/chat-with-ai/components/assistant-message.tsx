import { BatchProgressData, PlanStepUpdate } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, RefreshCw, Volume2, VolumeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useMemo, useState } from 'react';

import {
  ConnectionPickerData,
  getTextFromParts,
  ProjectPickerData,
} from '../lib/message-parsers';

import { ThinkingBlock } from './activity-accordion';
import { BatchProgressCard } from './batch-progress-card';
import { ConnectionPickerCard } from './connection-picker-card';
import {
  ConnectionRequiredData,
  ConnectionsRequiredCard,
} from './connections-required-card';
import { CopyIconButton } from './copy-icon-button';
import { PlanProgressCard } from './plan-progress-card';
import { ProjectPickerCard } from './project-picker-card';
import { StreamingText } from './streaming-text';
import { ToolShimmerPills } from './tool-shimmer-pills';

import { Markdown } from '@/components/prompt-kit/markdown';
import {
  Message,
  MessageAction,
  MessageActions,
} from '@/components/prompt-kit/message';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import {
  AnyToolPart,
  ChatUIMessage,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { useTts } from '@/features/chat/lib/use-tts';
import { cn } from '@/lib/utils';

const PROSE_CLASSES =
  'max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_table]:mb-4 [&_h1]:text-[18px] [&_h2]:text-[18px] [&_h3]:text-[18px]';

const ACTION_BUTTON_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onRetry,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
}) {
  const approveGate = useChatStoreContext((s) => s.approveGate);

  const {
    blocks,
    hasContent,
    lastDisplayIdx: _lastDisplayToolIdx,
    lastTextIdx,
  } = useMemo(() => {
    const result: MessageBlock[] = [];
    let currentThinking: {
      steps: ThinkingStep[];
      reasoningText: string;
    } | null = null;
    let hasText = false;
    let pendingDescription: string | null = null;

    function flushPendingDescription() {
      if (pendingDescription) {
        const thinking = ensureThinking();
        thinking.steps.push({
          kind: 'thinking-status',
          text: pendingDescription,
        });
        pendingDescription = null;
      }
    }

    function flushThinking() {
      flushPendingDescription();
      if (
        currentThinking &&
        (currentThinking.steps.length > 0 ||
          currentThinking.reasoningText.length > 0)
      ) {
        result.push({ kind: 'thinking', ...currentThinking });
      }
      currentThinking = null;
    }

    function ensureThinking() {
      if (!currentThinking) {
        currentThinking = { steps: [], reasoningText: '' };
      }
      return currentThinking;
    }

    function pushToolStep(p: AnyToolPart) {
      const thinking = ensureThinking();
      const description = pendingDescription;
      pendingDescription = null;
      thinking.steps.push({ kind: 'tool', part: p, description });
    }

    for (let i = 0; i < message.parts.length; i++) {
      const p = message.parts[i];

      if (p.type === 'text' && p.text.length > 0) {
        flushThinking();
        hasText = true;
        result.push({ kind: 'text', text: p.text });
      } else if (p.type === 'reasoning') {
        flushPendingDescription();
        const thinking = ensureThinking();
        thinking.reasoningText += p.text;
        const trimmed = p.text.trim();
        if (trimmed) {
          thinking.steps.push({ kind: 'reasoning', text: trimmed });
        }
      } else if (chatPartUtils.isAnyToolPart(p)) {
        const toolName = chatPartUtils.getToolPartName(p);
        if (chatPartUtils.isThinkingStatusTool(toolName)) {
          const input = p.input as { status?: string } | undefined;
          const statusText = (input?.status ?? '').trim();
          if (statusText) {
            flushPendingDescription();
            pendingDescription = statusText;
          }
          continue;
        }
        if (chatPartUtils.HIDDEN_TOOL_NAMES.has(toolName)) {
          continue;
        }
        if (chatPartUtils.isDisplayTool(toolName)) {
          flushThinking();
          result.push({ kind: 'display-tool', part: p });
        } else if (toolName === 'ap_request_plan_approval') {
          flushThinking();
          result.push({ kind: 'plan-marker', part: p });
        } else if (toolName === 'ap_execute_action') {
          const batchPart = chatPartUtils.extractBatchProgressFromOutput(p);
          if (batchPart) {
            flushThinking();
            result.push({ kind: 'batch-progress', data: batchPart });
          }
          pushToolStep(p);
        } else {
          pushToolStep(p);
        }
      }
    }

    flushThinking();

    for (let j = result.length - 1; j > 0; j--) {
      const block = result[j];
      const prevBlock = result[j - 1];
      if (
        block.kind === 'thinking' &&
        prevBlock.kind === 'display-tool' &&
        block.reasoningText.length === 0 &&
        block.steps.every((s) => s.kind === 'thinking-status')
      ) {
        result.splice(j, 1);
      }
    }

    const lastDisplayIdx = result.findLastIndex(
      (b) => b.kind === 'display-tool',
    );

    if (isStreaming && !hasText) {
      const hasThinkingBlock = result.some((b) => b.kind === 'thinking');
      if (!hasThinkingBlock) {
        result.push({ kind: 'thinking', steps: [], reasoningText: '' });
      }
    }

    const lastTextIdx = result.findLastIndex((b) => b.kind === 'text');

    return {
      blocks: result,
      hasContent: hasText,
      lastDisplayIdx,
      lastTextIdx,
    };
  }, [message.parts, isStreaming]);

  const fullText = useMemo(
    () => (isStreaming ? '' : getTextFromParts(message.parts)),
    [isStreaming, message.parts],
  );

  const { isSpeaking, isSupported: isTtsSupported, speak, stop } = useTts();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const hasPlanMarker = blocks.some((b) => b.kind === 'plan-marker');
  const hasRenderedContent = blocks.some(
    (b) => b.kind !== 'plan-marker' && b.kind !== 'thinking',
  );
  const hasThinkingContent = blocks.some((b) => b.kind === 'thinking');

  if (
    !hasContent &&
    !hasRenderedContent &&
    !isStreaming &&
    !hasPlanMarker &&
    !hasThinkingContent
  ) {
    return null;
  }

  const isFromHistory = message.id.startsWith('hist-');
  const lastThinkingIdx = blocks.findLastIndex((b) => b.kind === 'thinking');
  const hasActiveDisplayCard = blocks.some(
    (b) => b.kind === 'display-tool' && b.part.state === 'input-available',
  );

  return (
    <motion.div
      className="py-3 group/msg"
      initial={isFromHistory || isStreaming ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <div className="min-w-0 flex-1">
          {blocks.map((block, i) => {
            const prevBlock = i > 0 ? blocks[i - 1] : null;
            const needsSectionGap =
              block.kind === 'thinking' && prevBlock?.kind === 'text';
            switch (block.kind) {
              case 'thinking': {
                const hasTextAfter = blocks
                  .slice(i + 1)
                  .some((b) => b.kind === 'text');
                const isMessageStreaming =
                  isStreaming &&
                  i === lastThinkingIdx &&
                  !hasActiveDisplayCard &&
                  !hasTextAfter;
                const toolSteps = block.steps.filter(
                  (s): s is ThinkingStep & { kind: 'tool' } =>
                    s.kind === 'tool',
                );
                const lastThinkingStatus =
                  block.steps.filter((s) => s.kind === 'thinking-status').at(-1)
                    ?.text ?? null;
                return (
                  <div
                    key={`thinking-${i}`}
                    className={cn('py-2', needsSectionGap && 'mt-6')}
                  >
                    <ThinkingBlock
                      thinkingSteps={block.steps}
                      reasoningText={block.reasoningText}
                      isStreaming={isMessageStreaming}
                      thinkingDurationMs={
                        i === lastThinkingIdx
                          ? (
                              message as ChatUIMessage & {
                                thinkingDurationMs?: number;
                              }
                            ).thinkingDurationMs
                          : undefined
                      }
                      onOpenChange={setIsAccordionOpen}
                    />
                    {isMessageStreaming &&
                      !isAccordionOpen &&
                      (toolSteps.length > 0 ? (
                        <ToolShimmerPills
                          toolSteps={toolSteps}
                          lastThinkingStatus={lastThinkingStatus}
                        />
                      ) : (
                        lastThinkingStatus && (
                          <p className="pt-2 text-sm text-muted-foreground">
                            {lastThinkingStatus}
                          </p>
                        )
                      ))}
                  </div>
                );
              }
              case 'text': {
                const isActiveText = isStreaming && i === lastTextIdx;
                return (
                  <div key={`text-${i}`} className={cn('py-1', PROSE_CLASSES)}>
                    {isActiveText ? (
                      <StreamingText text={block.text} isStreaming={true} />
                    ) : (
                      <Markdown>{block.text}</Markdown>
                    )}
                    {isActiveText && lastTextIdx === blocks.length - 1 && (
                      <StreamingCursor />
                    )}
                  </div>
                );
              }
              case 'display-tool': {
                const toolCompleted =
                  block.part.state === 'output-available' ||
                  block.part.state === 'output-error';
                if (toolCompleted) {
                  return (
                    <div key={block.part.toolCallId} className="py-2">
                      <DisplayToolCard
                        part={block.part}
                        onResolve={approveGate}
                        isInteractive={false}
                      />
                    </div>
                  );
                }
                return null;
              }
              case 'plan-marker':
                return (
                  <div key={`plan-${i}`} className="py-2">
                    <InlinePlanCard
                      planPart={block.part}
                      message={message}
                      isStreaming={isStreaming}
                    />
                  </div>
                );
              case 'batch-progress':
                return (
                  <div key={`batch-${i}`} className="py-2">
                    <BatchProgressCard progress={block.data} />
                  </div>
                );
              default:
                return null;
            }
          })}

          <MessageActions
            className={cn(
              'gap-1 transition-opacity',
              isLastMessage
                ? 'opacity-100'
                : 'opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100',
            )}
          >
            {hasContent && !isStreaming && (
              <>
                <MessageAction tooltip={t('Copy')}>
                  <CopyIconButton textToCopy={fullText} className="h-6 w-6" />
                </MessageAction>
                {isTtsSupported && (
                  <MessageAction
                    tooltip={isSpeaking ? t('Stop reading') : t('Read aloud')}
                  >
                    <button
                      type="button"
                      onClick={() => (isSpeaking ? stop() : speak(fullText))}
                      className={cn(
                        ACTION_BUTTON_CLASS,
                        isSpeaking && 'text-foreground',
                      )}
                    >
                      {isSpeaking ? (
                        <VolumeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </MessageAction>
                )}
                <MessageAction tooltip={t('Regenerate')}>
                  <button
                    type="button"
                    onClick={onRetry}
                    className={ACTION_BUTTON_CLASS}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </MessageAction>
              </>
            )}
          </MessageActions>
        </div>
      </Message>
    </motion.div>
  );
});

function InlinePlanCard({
  planPart,
  message,
  isStreaming,
}: {
  planPart: AnyToolPart;
  message: ChatUIMessage;
  isStreaming: boolean;
}) {
  const localPlan = useMemo(() => {
    const toolOutput = chatPartUtils.parseTypedToolOutput(
      planPart,
      'ap_request_plan_approval',
    );
    if (toolOutput.state === 'success' && !toolOutput.data.success) return null;
    const input = planPart.input as
      | { planSummary?: string; steps?: string[] }
      | undefined;
    const steps = input?.steps ?? [];
    if (steps.length === 0) return null;
    return { title: input?.planSummary ?? '', steps };
  }, [planPart]);

  const planCompleted = useMemo(
    () =>
      !isStreaming &&
      (() => {
        const output = chatPartUtils.parseTypedToolOutput(
          planPart,
          'ap_request_plan_approval',
        );
        return output.state === 'success' && output.data.success;
      })(),
    [isStreaming, planPart],
  );

  const messageUpdates = useMemo(
    () => chatPartUtils.extractPlanUpdatesFromMessage(message),
    [message],
  );

  const updates = useMemo(() => {
    if (!localPlan) return [];
    if (messageUpdates.length > 0) return messageUpdates;
    if (planCompleted) {
      return localPlan.steps.map(
        (_stepText, i): PlanStepUpdate => ({ stepIndex: i, status: 'done' }),
      );
    }
    return messageUpdates;
  }, [messageUpdates, localPlan, planCompleted]);

  if (!localPlan) return null;

  return (
    <PlanProgressCard
      progress={localPlan}
      updates={updates}
      isStreaming={isStreaming}
    />
  );
}

function DisplayToolCard({
  part,
  onResolve,
  isInteractive,
}: {
  part: AnyToolPart;
  onResolve: (gateId: string, payload?: Record<string, unknown>) => void;
  isInteractive: boolean;
}) {
  if (!chatPartUtils.isReady(part)) return null;
  const data = part.input as Record<string, unknown>;
  const toolName = chatPartUtils.getToolPartName(part);
  const parsedOutput = chatPartUtils.parseToolOutput(part);
  const toolOutput =
    parsedOutput.state === 'success'
      ? (parsedOutput.data as Record<string, unknown>)
      : undefined;
  const toolCallId = chatPartUtils.getToolCallId(part);

  switch (toolName) {
    case 'ap_show_connection_required':
      return (
        <ConnectionsRequiredCard
          connections={[data as unknown as ConnectionRequiredData]}
          onResolve={(payload) => onResolve(toolCallId, payload)}
        />
      );
    case 'ap_show_connection_picker': {
      const selectedLabel =
        typeof toolOutput?.['label'] === 'string'
          ? (toolOutput['label'] as string)
          : undefined;
      return (
        <ConnectionPickerCard
          picker={data as unknown as ConnectionPickerData}
          onResolve={(payload) => onResolve(toolCallId, payload)}
          isInteractive={isInteractive}
          selectedConnectionLabel={selectedLabel}
        />
      );
    }
    case 'ap_show_project_picker': {
      const selectedProjectId =
        typeof toolOutput?.['projectId'] === 'string'
          ? (toolOutput['projectId'] as string)
          : undefined;
      return (
        <ProjectPickerCard
          picker={data as unknown as ProjectPickerData}
          isInteractive={isInteractive}
          onResolve={(payload) => onResolve(toolCallId, payload)}
          selectedProjectId={selectedProjectId}
        />
      );
    }
    case 'ap_show_questions': {
      const answersText =
        typeof toolOutput?.['answers'] === 'string'
          ? (toolOutput['answers'] as string)
          : undefined;
      if (!answersText) return null;
      return <AnsweredQuestionsCard answersText={answersText} />;
    }
    default:
      return null;
  }
}

function AnsweredQuestionsCard({ answersText }: { answersText: string }) {
  const pairs = useMemo(() => parseAnswerPairs(answersText), [answersText]);
  if (pairs.length === 0) return null;

  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b bg-muted/30">
        <div className="bg-green-100 dark:bg-green-500/20 rounded-full p-1">
          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
        </div>
        <span className="text-sm font-medium">{t('Your answers')}</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {pairs.map((pair, i) => (
          <div key={i}>
            <div className="text-xs text-muted-foreground">{pair.question}</div>
            <div className="text-sm font-medium">{pair.answer}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StreamingCursor() {
  return (
    <span
      className="inline-block w-[3px] h-[1.1em] bg-foreground/70 rounded-sm align-text-bottom ml-0.5 animate-pulse"
      style={{ animationDuration: '3s' }}
    />
  );
}

function parseAnswerPairs(
  text: string,
): Array<{ question: string; answer: string }> {
  return text
    .split('\n')
    .filter((line) => line.startsWith('- **'))
    .map((line) => {
      const match = line.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
      if (!match) return null;
      return { question: match[1], answer: match[2] };
    })
    .filter((p): p is { question: string; answer: string } => p !== null);
}

type MessageBlock =
  | {
      kind: 'thinking';
      steps: ThinkingStep[];
      reasoningText: string;
    }
  | { kind: 'text'; text: string }
  | { kind: 'display-tool'; part: AnyToolPart }
  | { kind: 'plan-marker'; part: AnyToolPart }
  | { kind: 'batch-progress'; data: BatchProgressData };
