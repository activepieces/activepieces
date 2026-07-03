import { t } from 'i18next';
import { ChevronDown, Volume2, VolumeOff } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { memo, useMemo, useState } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';
import {
  Message,
  MessageAction,
  MessageActions,
} from '@/components/prompt-kit/message';
import { Source } from '@/components/prompt-kit/source';
import { StreamingText } from '@/components/prompt-kit/streaming-text';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { useTts } from '@/features/chat/lib/use-tts';
import { cn } from '@/lib/utils';

import {
  buildMessageBlocks,
  getLastThinkingSegment,
  MessageBlock,
  OutcomeCardBlock,
} from '../lib/message-blocks';
import {
  ConnectionPickerData,
  getTextFromParts,
  ProjectPickerData,
} from '../lib/message-parsers';

import { ActionReceiptCard } from './action-receipt-card';
import { ThinkingBlock } from './activity-accordion';
import { BatchProgressCard } from './batch-progress-card';
import { CardSkeleton } from './card-skeletons';
import { CodeModeCard } from './code-mode-card';
import { ConnectionPickerCard } from './connection-picker-card';
import { CopyIconButton } from './copy-icon-button';
import { FlowBuildCard } from './flow-build-card';
import { GeneratedImageCard } from './generated-image-card';
import { McpReconnectCard, McpReconnectData } from './mcp-reconnect-card';
import { DocumentPreview } from './previews/document-preview';
import { markdownPreviewComponents } from './previews/markdown-preview-components';
import { previewUtils } from './previews/preview-utils';
import { ProducedFileCard } from './produced-file-card';
import { ProjectPickerCard } from './project-picker-card';
import { ToolShimmerPills } from './tool-shimmer-pills';

const PROSE_CLASSES = 'max-w-none break-words';

const ACTION_BUTTON_CLASS =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const EMPTY_BUILD_IDS: ReadonlySet<string> = new Set();

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onSendPrompt,
  claimedBuildIds = EMPTY_BUILD_IDS,
  isResumed = false,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onSendPrompt?: (text: string) => void;
  claimedBuildIds?: ReadonlySet<string>;
  isResumed?: boolean;
}) {
  const approveGate = useChatStoreContext((s) => s.approveGate);
  const toolCallMeta = useChatStoreContext((s) => s.toolCallMeta);

  const { blocks, hasContent, sources } = useMemo(
    () =>
      buildMessageBlocks({
        parts: message.parts,
        isStreaming,
        toolCallMeta,
        claimedBuildIds,
      }),
    [message.parts, isStreaming, toolCallMeta, claimedBuildIds],
  );

  const fullText = useMemo(
    () => (isStreaming ? '' : getTextFromParts(message.parts)),
    [isStreaming, message.parts],
  );

  const { isSpeaking, isSupported: isTtsSupported, speak, stop } = useTts();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const hasRenderedContent = blocks.some((b) => b.kind !== 'thinking');
  const hasThinkingContent = blocks.some((b) => b.kind === 'thinking');

  if (
    !hasContent &&
    !hasRenderedContent &&
    !isStreaming &&
    !hasThinkingContent
  ) {
    return null;
  }

  const isFromHistory = message.id.startsWith('hist-');

  return (
    <motion.div
      className="py-3 group/msg"
      initial={isFromHistory || isStreaming ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <div className="min-w-0 flex-1">
          <MessageBlocks
            blocks={blocks}
            isStreaming={isStreaming}
            message={message}
            toolCallMeta={toolCallMeta}
            approveGate={approveGate}
            onSendPrompt={onSendPrompt}
            isAccordionOpen={isAccordionOpen}
            setIsAccordionOpen={setIsAccordionOpen}
            isResumed={isResumed}
          />

          {!isStreaming && sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <motion.span
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {t('Sources')}
              </motion.span>
              {sources.map((source, i) => {
                if (!source.href && !source.title) return null;
                return (
                  <motion.span
                    key={source.key}
                    className="inline-flex"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 + i * 0.06 }}
                  >
                    {source.href ? (
                      <Source href={source.href} title={source.title} />
                    ) : (
                      <span className="inline-flex items-center rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-foreground/80">
                        {source.title}
                      </span>
                    )}
                  </motion.span>
                );
              })}
            </div>
          )}

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
              </>
            )}
          </MessageActions>
        </div>
      </Message>
    </motion.div>
  );
});

function MessageBlocks({
  blocks,
  isStreaming,
  message,
  toolCallMeta,
  approveGate,
  onSendPrompt,
  isAccordionOpen,
  setIsAccordionOpen,
  isResumed = false,
}: {
  blocks: MessageBlock[];
  isStreaming: boolean;
  message: ChatUIMessage;
  toolCallMeta: Record<string, ToolCallMeta>;
  approveGate: (gateId: string, payload?: Record<string, unknown>) => void;
  onSendPrompt?: (text: string) => void;
  isAccordionOpen: boolean;
  setIsAccordionOpen: (open: boolean) => void;
  isResumed?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const lastThinkingIdx = blocks.findLastIndex((b) => b.kind === 'thinking');
  const lastTextIdx = blocks.findLastIndex((b) => b.kind === 'text');
  const hasActiveDisplayCard = blocks.some(
    (b) => b.kind === 'display-tool' && b.part.state === 'input-available',
  );

  return (
    <>
      {blocks.map((block, i) => {
        const prevBlock = i > 0 ? blocks[i - 1] : null;
        const needsSectionGap =
          block.kind === 'thinking' && prevBlock?.kind === 'text';
        switch (block.kind) {
          case 'thinking': {
            const hasTextAfter = blocks
              .slice(i + 1)
              .some((b) => b.kind === 'text');
            // A skeleton after this block IS the live indicator now — let the
            // thinking accordion settle so we don't show a shimmer pill and a
            // skeleton at once.
            const hasSkeletonAfter = blocks
              .slice(i + 1)
              .some((b) => b.kind === 'card-skeleton');
            // A build card after this block owns the live indicator now — this
            // is the settled discovery accordion above it, not the active one.
            const hasBuildAfter = blocks
              .slice(i + 1)
              .some((b) => b.kind === 'build-plan');
            const isMessageStreaming =
              isStreaming &&
              i === lastThinkingIdx &&
              !hasActiveDisplayCard &&
              !hasTextAfter &&
              !hasSkeletonAfter &&
              !hasBuildAfter;
            const lastStep =
              block.steps.length > 0
                ? block.steps[block.steps.length - 1]
                : null;
            // Collapsed view = ONLY the last segment: the last thought and the
            // tools after it. Earlier segments live in the expanded accordion.
            // The thought lives in the first tool's `description`, so derive the
            // segment from that — not from `thinking-status` steps (which only
            // exist for a dangling thought).
            // The thought MUST come from this round's own block — never borrow
            // a previous round's thought (the segments are isolated by text).
            const lastSegment = getLastThinkingSegment(block.steps);
            const lastSegmentToolSteps = lastSegment.toolSteps;
            const lastThinkingStatus = lastSegment.thought;
            // One stable identity per thought group: constant while a segment
            // streams in more tools, changes on a new thought. When it changes
            // (or the live phase ends) AnimatePresence swings the OLD group up
            // into the title to hide it; the new group quietly fades in.
            const segmentKey =
              lastThinkingStatus ??
              lastSegmentToolSteps[0]?.part.toolCallId ??
              'segment';
            const showLiveGroup =
              isMessageStreaming && !isAccordionOpen && Boolean(lastStep);
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
                <AnimatePresence initial={false}>
                  {showLiveGroup && (
                    <motion.div
                      key={segmentKey}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.12 }
                          : {
                              height: {
                                duration: 0.3,
                                ease: [0.32, 0.72, 0, 1],
                              },
                              opacity: { duration: 0.2, ease: 'easeOut' },
                            }
                      }
                      style={{ overflow: 'hidden' }}
                    >
                      <ToolShimmerPills
                        toolSteps={lastSegmentToolSteps}
                        lastThinkingStatus={lastThinkingStatus}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          case 'text': {
            const isActiveText = isStreaming && i === lastTextIdx;
            if (previewUtils.isLikelyDocument(block.text)) {
              return (
                <div key={`text-${i}`} className={cn('py-1', PROSE_CLASSES)}>
                  <DocumentPreview
                    markdown={block.text}
                    streaming={isActiveText && !isResumed}
                  />
                </div>
              );
            }
            return (
              <div key={`text-${i}`} className={cn('py-1', PROSE_CLASSES)}>
                {isActiveText && !isResumed ? (
                  <StreamingText
                    text={block.text}
                    components={markdownPreviewComponents}
                  />
                ) : (
                  <Markdown components={markdownPreviewComponents}>
                    {block.text}
                  </Markdown>
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
          case 'code-mode':
            return (
              <div key={`code-mode-${block.toolCallId}`} className="py-1">
                <CodeModeCard part={block.part} />
              </div>
            );
          case 'batch-progress':
            return (
              <div key={`batch-${i}`} className="py-2">
                <BatchProgressCard progress={block.data} />
              </div>
            );
          case 'action-receipt':
          case 'image':
          case 'files':
            return (
              <div
                key={`card-${block.kind}-${block.toolCallId}`}
                className="py-2"
              >
                <OutcomeCard block={block} toolCallMeta={toolCallMeta} />
              </div>
            );
          case 'card-group':
            return (
              <CardGroup
                key={`card-group-${i}`}
                cards={block.cards}
                toolCallMeta={toolCallMeta}
              />
            );
          case 'card-skeleton':
            return (
              <div key={`skeleton-${block.toolCallId}`} className="py-2">
                <CardSkeleton
                  cardKind={block.cardKind}
                  phase={block.phase}
                  part={block.part}
                  description={block.description}
                />
              </div>
            );
          case 'build-plan': {
            const children = block.children ?? [];
            return (
              <div key={`build-${block.buildId}`} className="py-2">
                <FlowBuildCard
                  buildId={block.buildId}
                  onSendPrompt={onSendPrompt}
                  activity={
                    children.length > 0 ? (
                      <MessageBlocks
                        blocks={children}
                        isStreaming={isStreaming}
                        message={message}
                        toolCallMeta={toolCallMeta}
                        approveGate={approveGate}
                        onSendPrompt={onSendPrompt}
                        isAccordionOpen={isAccordionOpen}
                        setIsAccordionOpen={setIsAccordionOpen}
                      />
                    ) : null
                  }
                />
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}

function OutcomeCard({
  block,
  toolCallMeta,
}: {
  block: OutcomeCardBlock;
  toolCallMeta: Record<string, ToolCallMeta>;
}) {
  switch (block.kind) {
    case 'action-receipt': {
      const receipt = toolCallMeta[block.toolCallId]?.actionReceipt;
      if (!receipt) return null;
      return <ActionReceiptCard receipt={receipt} />;
    }
    case 'image': {
      const image = toolCallMeta[block.toolCallId]?.image;
      if (!image) return null;
      return <GeneratedImageCard image={image} />;
    }
    case 'files': {
      const files = toolCallMeta[block.toolCallId]?.files;
      if (!files || files.length === 0) return null;
      return (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <ProducedFileCard key={file.fileId} file={file} />
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

// A run of adjacent outcome cards collapses into one quiet, expandable group so
// a batch of writes doesn't flood the timeline. Collapsed by default — the count
// header tells the user how many landed; expanding reveals each card.
function CardGroup({
  cards,
  toolCallMeta,
}: {
  cards: OutcomeCardBlock[];
  toolCallMeta: Record<string, ToolCallMeta>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-2">
      <Collapsible open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>{t('chatOutcomeCount', { count: cards.length })}</span>
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 opacity-50 transition-transform duration-300',
              open && 'rotate-180',
            )}
          />
        </button>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="mt-2 flex flex-col gap-2">
            {cards.map((card, idx) => (
              <OutcomeCard
                key={`${card.kind}-${card.toolCallId}-${idx}`}
                block={card}
                toolCallMeta={toolCallMeta}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
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
    case 'ap_show_connection_picker': {
      if (!isInteractive && toolOutput?.['dismissed'] === true) return null;
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
    case 'ap_show_mcp_reconnect': {
      if (!isInteractive && toolOutput?.['dismissed'] === true) return null;
      return (
        <McpReconnectCard
          reconnect={data as unknown as McpReconnectData}
          onResolve={(payload) => onResolve(toolCallId, payload)}
          isInteractive={isInteractive}
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
      className="flex justify-end my-2"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-[80%] bg-muted rounded-2xl rounded-br-md px-4 py-3 space-y-3">
        {pairs.map((pair, i) => (
          <div key={i} className="space-y-0.5">
            <p className="text-sm font-semibold">
              {t('Q{number}. {question}', {
                number: i + 1,
                question: pair.question,
              })}
            </p>
            <p className="text-sm">
              {t('→ {answer}', { answer: pair.answer })}
            </p>
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
