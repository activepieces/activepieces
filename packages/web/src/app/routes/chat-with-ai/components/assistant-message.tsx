import {
  BatchProgressData,
  isObject,
  PlanStepUpdate,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, RefreshCw, Volume2, VolumeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';
import {
  Message,
  MessageAction,
  MessageActions,
} from '@/components/prompt-kit/message';
import { chatStoreSelectors } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import {
  AnyToolPart,
  ChatUIMessage,
  ThinkingStep,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { useTts } from '@/features/chat/lib/use-tts';
import { cn } from '@/lib/utils';

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

const PROSE_CLASSES =
  'max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_table]:mb-4 [&_h1]:text-[18px] [&_h2]:text-[18px] [&_h3]:text-[18px]';

const ACTION_BUTTON_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onRetry,
  lastAssistantMessage,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
  lastAssistantMessage?: ChatUIMessage;
}) {
  const resolveDisplayCard = useChatStoreContext((s) => s.resolveDisplayCard);
  const displayCard = useChatStoreContext((s) => s.displayCard);
  const hasActiveDisplayCard =
    isStreaming && displayCard !== null && !displayCard.resolved;

  const {
    blocks,
    hasContent,
    lastDisplayIdx: lastDisplayToolIdx,
  } = useMemo(() => {
    const result: MessageBlock[] = [];
    let currentThinking: {
      steps: ThinkingStep[];
      reasoningText: string;
    } | null = null;
    let hasText = false;
    let lastThinkingStatus: string | null = null;

    function flushThinking() {
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

    const hasBatchProgressDataPart = message.parts.some(
      (p) => p.type === 'data-batch-progress',
    );

    for (let i = 0; i < message.parts.length; i++) {
      const p = message.parts[i];

      if (p.type === 'text' && p.text.length > 0) {
        flushThinking();
        hasText = true;
        result.push({ kind: 'text', text: p.text });
      } else if (p.type === 'data-batch-progress' && 'data' in p) {
        flushThinking();
        const batchPart = p as { data: BatchProgressData };
        result.push({ kind: 'batch-progress', data: batchPart.data });
      } else if (p.type === 'reasoning') {
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
            const thinking = ensureThinking();
            thinking.steps.push({
              kind: 'thinking-status',
              text: statusText,
            });
            lastThinkingStatus = statusText;
          }
          continue;
        }
        if (chatPartUtils.HIDDEN_TOOL_NAMES.has(toolName)) {
          continue;
        }
        const batchData =
          toolName === 'ap_execute_action' &&
          !hasBatchProgressDataPart &&
          p.state === 'output-available'
            ? extractBatchProgress(p)
            : null;

        if (chatPartUtils.isDisplayTool(toolName)) {
          flushThinking();
          result.push({ kind: 'display-tool', part: p });
        } else if (toolName === 'ap_request_plan_approval') {
          flushThinking();
          result.push({ kind: 'plan-marker', part: p });
        } else if (batchData) {
          flushThinking();
          result.push({ kind: 'batch-progress', data: batchData });
        } else {
          const thinking = ensureThinking();
          const lastStep = thinking.steps[thinking.steps.length - 1];
          if (
            lastThinkingStatus &&
            lastStep?.kind === 'thinking-status' &&
            lastStep.text === lastThinkingStatus
          ) {
            thinking.steps[thinking.steps.length - 1] = {
              ...lastStep,
              toolPart: p,
            };
          } else {
            thinking.steps.push({ kind: 'tool', part: p });
          }
          lastThinkingStatus = null;
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

    if (isStreaming) {
      const hasThinkingAfter = result.some(
        (b, idx) => b.kind === 'thinking' && idx > lastDisplayIdx,
      );
      if (result.length === 0 || (lastDisplayIdx >= 0 && !hasThinkingAfter)) {
        result.push({ kind: 'thinking', steps: [], reasoningText: '' });
      }
    }

    return { blocks: result, hasContent: hasText, lastDisplayIdx };
  }, [message.parts, isStreaming]);

  const fullText = useMemo(
    () => (isStreaming ? '' : getTextFromParts(message.parts)),
    [isStreaming, message.parts],
  );

  const { isSpeaking, isSupported: isTtsSupported, speak, stop } = useTts();

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

  return (
    <motion.div
      className="py-3 group/msg"
      initial={isFromHistory ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <div className="min-w-0 space-y-2 flex-1">
          {blocks.map((block, i) => {
            switch (block.kind) {
              case 'thinking':
                return (
                  <ThinkingBlock
                    key={`thinking-${i}`}
                    thinkingSteps={block.steps}
                    reasoningText={block.reasoningText}
                    isStreaming={
                      isStreaming &&
                      i === lastThinkingIdx &&
                      !hasActiveDisplayCard &&
                      i > lastDisplayToolIdx
                    }
                    thinkingDurationMs={
                      i === lastThinkingIdx
                        ? (
                            message as ChatUIMessage & {
                              thinkingDurationMs?: number;
                            }
                          ).thinkingDurationMs
                        : undefined
                    }
                  />
                );
              case 'text':
                return (
                  <div key={`text-${i}`} className={PROSE_CLASSES}>
                    <Markdown>{block.text}</Markdown>
                  </div>
                );
              case 'display-tool': {
                const toolCompleted =
                  block.part.state === 'output-available' ||
                  block.part.state === 'output-error';
                if (toolCompleted) {
                  return (
                    <DisplayToolCard
                      key={block.part.toolCallId}
                      part={block.part}
                      onResolve={resolveDisplayCard}
                      isInteractive={false}
                    />
                  );
                }
                return null;
              }
              case 'plan-marker':
                return (
                  <InlinePlanCard
                    key={`plan-${i}`}
                    planPart={block.part}
                    lastAssistantMessage={lastAssistantMessage}
                    isStreaming={isStreaming}
                  />
                );
              case 'batch-progress':
                return (
                  <BatchProgressCard key={`batch-${i}`} progress={block.data} />
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
                : 'opacity-0 group-hover/msg:opacity-100',
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
  lastAssistantMessage,
  isStreaming,
}: {
  planPart: AnyToolPart;
  lastAssistantMessage?: ChatUIMessage;
  isStreaming: boolean;
}) {
  const storePlanProgress = useChatStoreContext((s) =>
    chatStoreSelectors.planProgress({ state: s, lastAssistantMessage }),
  );
  const storePlanUpdates = useChatStoreContext((s) =>
    chatStoreSelectors.effectivePlanUpdates({ state: s }),
  );

  const localPlan = (() => {
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
  })();

  const progress = storePlanProgress ?? localPlan;

  const planCompleted =
    !isStreaming &&
    (() => {
      const output = chatPartUtils.parseTypedToolOutput(
        planPart,
        'ap_request_plan_approval',
      );
      return output.state === 'success' && output.data.success;
    })();

  const updates = useMemo(() => {
    if (!progress) return [];
    if (planCompleted) {
      return progress.steps.map(
        (_stepText, i): PlanStepUpdate => ({ stepIndex: i, status: 'done' }),
      );
    }
    return storePlanUpdates;
  }, [storePlanUpdates, progress, planCompleted]);

  if (!progress) return null;

  return (
    <PlanProgressCard
      progress={progress}
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
  onResolve: (payload: Record<string, unknown>) => void;
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

  switch (toolName) {
    case 'ap_show_connection_required':
      return (
        <ConnectionsRequiredCard
          connections={[data as unknown as ConnectionRequiredData]}
          onResolve={onResolve}
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
          onResolve={onResolve}
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
          onResolve={onResolve}
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

function extractBatchProgress(part: AnyToolPart): BatchProgressData | null {
  const output = chatPartUtils.parseToolOutput(part);
  if (output.state !== 'success') return null;
  if (!isObject(output.data) || !('batchProgress' in output.data)) return null;
  return output.data.batchProgress as BatchProgressData;
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
