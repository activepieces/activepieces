import { PlanStepUpdate } from '@activepieces/shared';
import { t } from 'i18next';
import { RefreshCw, Volume2, VolumeOff } from 'lucide-react';
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
  onSend,
  lastAssistantMessage,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  lastAssistantMessage?: ChatUIMessage;
}) {
  const { blocks, hasContent } = useMemo(() => {
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

    for (let i = 0; i < message.parts.length; i++) {
      const p = message.parts[i];

      if (p.type === 'text' && p.text.length > 0) {
        flushThinking();
        hasText = true;
        result.push({ kind: 'text', text: p.text });
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
        if (chatPartUtils.isDisplayTool(toolName)) {
          flushThinking();
          result.push({ kind: 'display-tool', part: p });
        } else if (toolName === 'ap_request_plan_approval') {
          flushThinking();
          result.push({ kind: 'plan-marker', part: p });
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

    const lastDisplayIdx = result.findLastIndex(
      (b) => b.kind === 'display-tool',
    );
    if (lastDisplayIdx > -1) {
      for (let j = result.length - 1; j >= 0; j--) {
        if (result[j].kind === 'display-tool' && j !== lastDisplayIdx) {
          result.splice(j, 1);
        }
      }
    }

    if (
      isStreaming &&
      !result.some((b) => b.kind === 'thinking') &&
      result.length === 0
    ) {
      result.push({ kind: 'thinking', steps: [], reasoningText: '' });
    }

    return { blocks: result, hasContent: hasText };
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
                    isStreaming={isStreaming && i === lastThinkingIdx}
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
              case 'display-tool':
                if (isStreaming) return null;
                return (
                  <DisplayToolCard
                    key={block.part.toolCallId}
                    part={block.part}
                    onSend={onSend}
                    isInteractive={isLastMessage}
                  />
                );
              case 'plan-marker':
                return (
                  <InlinePlanCard
                    key={`plan-${i}`}
                    planPart={block.part}
                    lastAssistantMessage={lastAssistantMessage}
                    isStreaming={isStreaming}
                  />
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
  onSend,
  isInteractive,
}: {
  part: AnyToolPart;
  onSend: (text: string, files?: File[]) => void;
  isInteractive: boolean;
}) {
  if (!chatPartUtils.isReady(part)) return null;
  const data = part.input as Record<string, unknown>;
  const toolName = chatPartUtils.getToolPartName(part);

  switch (toolName) {
    case 'ap_show_connection_required':
      return (
        <ConnectionsRequiredCard
          connections={[data as unknown as ConnectionRequiredData]}
          onSend={onSend}
        />
      );
    case 'ap_show_connection_picker':
      return (
        <ConnectionPickerCard
          picker={data as unknown as ConnectionPickerData}
          onSelect={onSend}
          isInteractive={isInteractive}
        />
      );
    case 'ap_show_project_picker':
      return (
        <ProjectPickerCard
          picker={data as unknown as ProjectPickerData}
          isInteractive={isInteractive}
          onSelect={(_projectId, projectName) => {
            onSend(`Use ${projectName}.`);
          }}
        />
      );
    default:
      return null;
  }
}

type MessageBlock =
  | {
      kind: 'thinking';
      steps: ThinkingStep[];
      reasoningText: string;
    }
  | { kind: 'text'; text: string }
  | { kind: 'display-tool'; part: AnyToolPart }
  | { kind: 'plan-marker'; part: AnyToolPart };
