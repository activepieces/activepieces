import { t } from 'i18next';
import { Brain, Layers, Volume2, VolumeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useMemo, useState } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';
import {
  Message,
  MessageAction,
  MessageActions,
} from '@/components/prompt-kit/message';
import { StreamingText } from '@/components/prompt-kit/streaming-text';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { useTts } from '@/features/chat/lib/use-tts';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

import {
  buildMessageBlocks,
  MessageBlock,
  OutcomeCardBlock,
} from '../lib/message-blocks';
import {
  getTextFromParts,
  isConnectionPickerData,
  normalizePieceName,
  parseAnswerPairs,
  ProjectPickerData,
} from '../lib/message-parsers';

import { ActionReceiptCard } from './action-receipt-card';
import { ThinkingBlock } from './activity-accordion';
import { BatchProgressCard } from './batch-progress-card';
import { CardSkeleton } from './card-skeletons';
import { ChatCard, ChatCardFold, ChatCardTile } from './chat-ui/chat-card';
import { ChatStatusText } from './chat-ui/chat-status';
import { ChatLine } from './chat-ui/chat-line';
import { ConnectionPickerCard } from './connection-picker-card';
import { CopyIconButton } from './copy-icon-button';
import { FeedbackButtons } from './feedback-buttons';
import { FlowBuildCard } from './flow-build-card';
import { GeneratedImageCard } from './generated-image-card';
import { LiveReasoning } from './live-reasoning';
import { McpReconnectCard, McpReconnectData } from './mcp-reconnect-card';
import { MessageSources } from './message-sources';
import { DocumentPreview } from './previews/document-preview';
import { markdownPreviewComponents } from './previews/markdown-preview-components';
import { previewUtils } from './previews/preview-utils';
import { ProducedFileCard } from './produced-file-card';
import { ProjectPickerCard } from './project-picker-card';
import { ShowcaseCard } from './showcase-card/showcase-card';
import { ShowcaseTileData } from './showcase-card/showcase-tile';
import { SubagentGroup } from './subagent-card';

const PROSE_CLASSES = 'max-w-none break-words text-base';

const ACTION_BUTTON_CLASS =
  'flex size-7 items-center justify-center rounded-md text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8';

const EMPTY_BUILD_IDS: ReadonlySet<string> = new Set();

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  onSendPrompt,
  claimedBuildIds = EMPTY_BUILD_IDS,
  isResumed = false,
  conversationId,
  messageIndex,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onSendPrompt?: (text: string) => void;
  claimedBuildIds?: ReadonlySet<string>;
  isResumed?: boolean;
  conversationId?: string | null;
  messageIndex: number;
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
  const feedbackRating = message.feedback?.rating;

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
            <MessageSources sources={sources} />
          )}

          <MessageActions className="-ml-1.5 gap-0.5 pt-1">
            {hasContent && !isStreaming && (
              <>
                <MessageAction tooltip={t('Copy')}>
                  <CopyIconButton textToCopy={fullText} className="size-7" />
                </MessageAction>
                {isTtsSupported && (
                  <MessageAction
                    tooltip={isSpeaking ? t('Stop reading') : t('Read aloud')}
                  >
                    <button
                      type="button"
                      aria-label={
                        isSpeaking ? t('Stop reading') : t('Read aloud')
                      }
                      onClick={() => (isSpeaking ? stop() : speak(fullText))}
                      className={cn(
                        ACTION_BUTTON_CLASS,
                        isSpeaking && 'text-gray-12',
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
                {conversationId && (
                  <FeedbackButtons
                    conversationId={conversationId}
                    messageIndex={messageIndex}
                    initialRating={feedbackRating}
                  />
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
  const doneTitles = useMemo(
    () => buildDoneTitles(message.parts),
    [message.parts],
  );
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
            const isLive = isMessageStreaming && !isAccordionOpen;
            const showLiveReasoning =
              isLive && block.trailingReasoningText.length > 0;
            return (
              <div
                key={`thinking-${i}`}
                className={cn('py-2', needsSectionGap && 'mt-6')}
              >
                <ThinkingBlock
                  thinkingSteps={block.steps}
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
                  {showLiveReasoning && (
                    <LiveReasoning
                      key="live-reasoning"
                      text={block.trailingReasoningText}
                    />
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
                    onSendPrompt={onSendPrompt}
                  />
                </div>
              );
            }
            return null;
          }
          case 'tasks':
            return (
              <SubagentGroup
                key={`tasks-${block.tasks[0]?.toolCallId ?? i}`}
                tasks={block.tasks}
                toolCallMeta={toolCallMeta}
                isStreaming={isStreaming}
              />
            );
          case 'batch-progress':
            return (
              <div key={`batch-${i}`} className="py-2">
                <BatchProgressCard progress={block.data} />
              </div>
            );
          case 'memory-saved':
            return (
              <ChatLine
                key={`memory-${i}`}
                icon={<Brain className="size-3.5 text-gray-11" />}
                title={block.memory}
              >
                {t('Memory updated')}: <span>{block.memory}</span>
              </ChatLine>
            );
          case 'action-receipt':
          case 'image':
          case 'files':
            return (
              <div
                key={`card-${block.kind}-${block.toolCallId}`}
                className="py-2"
              >
                <OutcomeCard
                  block={block}
                  toolCallMeta={toolCallMeta}
                  doneTitles={doneTitles}
                />
              </div>
            );
          case 'card-group':
            return (
              <CardGroup
                key={`card-group-${i}`}
                cards={block.cards}
                toolCallMeta={toolCallMeta}
                doneTitles={doneTitles}
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
  doneTitles,
  flat,
}: {
  block: OutcomeCardBlock;
  toolCallMeta: Record<string, ToolCallMeta>;
  doneTitles: ReadonlyMap<string, string>;
  flat?: boolean;
}) {
  const doneTitle = doneTitles.get(block.toolCallId);
  switch (block.kind) {
    case 'action-receipt': {
      const receipt = toolCallMeta[block.toolCallId]?.actionReceipt;
      if (!receipt) return null;
      return (
        <ActionReceiptCard
          receipt={receipt}
          doneTitle={doneTitle}
          flat={flat}
        />
      );
    }
    case 'image': {
      const image = toolCallMeta[block.toolCallId]?.image;
      if (!image) return null;
      return (
        <GeneratedImageCard image={image} doneTitle={doneTitle} flat={flat} />
      );
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

function CardGroup({
  cards,
  toolCallMeta,
  doneTitles,
}: {
  cards: OutcomeCardBlock[];
  toolCallMeta: Record<string, ToolCallMeta>;
  doneTitles: ReadonlyMap<string, string>;
}) {
  const { receipts, pieceNames } = useMemo(() => {
    const found = cards.flatMap((card) => {
      const receipt =
        card.kind === 'action-receipt'
          ? toolCallMeta[card.toolCallId]?.actionReceipt
          : undefined;
      return receipt ? [receipt] : [];
    });
    return {
      receipts: found,
      pieceNames: [
        ...new Set(found.map((r) => normalizePieceName(r.pieceName))),
      ],
    };
  }, [cards, toolCallMeta]);
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const failedCount = receipts.filter((r) => r.status === 'failed').length;
  const appNames = summaries.map((summary) => summary.displayName);
  const meta = appNames.length > 0 ? appNames.join(', ') : undefined;

  return (
    <div className="py-2">
      <ChatCard>
        <ChatCardFold
          defaultOpen={false}
          tile={
            pieceNames[0] ? (
              <ChatCardTile kind="app" pieceName={pieceNames[0]} />
            ) : (
              <ChatCardTile kind="bits" icon={Layers} />
            )
          }
          title={t('chatOutcomeCount', { count: cards.length })}
          meta={meta}
          trailing={
            failedCount > 0 ? (
              <ChatStatusText status="failed">
                {t('{count, plural, =1 {1 failed} other {# failed}}', {
                  count: failedCount,
                })}
              </ChatStatusText>
            ) : (
              <ChatStatusText status="done" />
            )
          }
        >
          <div className="flex flex-col">
            {cards.map((card, idx) => (
              <div
                key={`${card.kind}-${card.toolCallId}-${idx}`}
                className="border-t border-gray-6"
              >
                <OutcomeCard
                  block={card}
                  toolCallMeta={toolCallMeta}
                  doneTitles={doneTitles}
                  flat
                />
              </div>
            ))}
          </div>
        </ChatCardFold>
      </ChatCard>
    </div>
  );
}

function buildDoneTitles(
  parts: ChatUIMessage['parts'],
): ReadonlyMap<string, string> {
  return new Map(
    parts.filter(chatPartUtils.isAnyToolPart).flatMap((part) => {
      const { doneTitle } = chatPartUtils.extractToolTitles(part);
      return doneTitle ? [[chatPartUtils.getToolCallId(part), doneTitle]] : [];
    }),
  );
}

function DisplayToolCard({
  part,
  onResolve,
  isInteractive,
  onSendPrompt,
}: {
  part: AnyToolPart;
  onResolve: (gateId: string, payload?: Record<string, unknown>) => void;
  isInteractive: boolean;
  onSendPrompt?: (text: string) => void;
}) {
  if (!chatPartUtils.isReady(part)) return null;
  const data = part.input as Record<string, unknown>;
  const toolName = chatPartUtils.getToolPartName(part);
  const parsedOutput = chatPartUtils.parseToolOutput(part);
  if (parsedOutput.state === 'error') return null;
  const toolOutput =
    parsedOutput.state === 'success'
      ? (parsedOutput.data as Record<string, unknown>)
      : undefined;
  const toolCallId = chatPartUtils.getToolCallId(part);
  if (toolOutput?.['notShown'] === true) return null;

  switch (toolName) {
    case 'ap_show_connection_required':
    case 'ap_show_connection_picker': {
      if (!isConnectionPickerData(data)) return null;
      if (!isInteractive && toolOutput?.['dismissed'] === true) return null;
      const selectedLabel =
        typeof toolOutput?.['label'] === 'string'
          ? (toolOutput['label'] as string)
          : undefined;
      return (
        <ConnectionPickerCard
          picker={data}
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
    case 'ap_show_showcase': {
      return (
        <ShowcaseCard
          content={{
            headline:
              typeof data['headline'] === 'string' ? data['headline'] : '',
            ...(typeof data['subhead'] === 'string'
              ? { subhead: data['subhead'] }
              : {}),
            ...(data['layout'] === 'grid' || data['layout'] === 'list'
              ? { layout: data['layout'] }
              : {}),
            tiles: Array.isArray(data['tiles'])
              ? (data['tiles'] as ShowcaseTileData[])
              : [],
          }}
          {...(onSendPrompt ? { onSendPrompt } : {})}
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
      <div className="max-w-[80%] bg-gray-3 rounded-xl rounded-br-md px-4 py-3 space-y-3">
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
