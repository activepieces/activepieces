import { t } from 'i18next';
import { Check, Copy, Paperclip, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
} from 'react';

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage, DynamicToolPart } from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { cn } from '@/lib/utils';

import { getTextFromParts, parseBuildProgress } from '../lib/message-parsers';

import { ThinkingBlock } from './activity-accordion';
import { BuildProgressCard } from './build-progress-card';
import { MessageContentWithAuth } from './message-content';

export function ChatMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onRetry,
  onSend,
  selectedProjectId,
  onSelectProject,
  allConversationToolParts,
  buildProgressUpdates,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  allConversationToolParts?: DynamicToolPart[];
  buildProgressUpdates?: Array<{
    phase: string;
    stepIndex?: number;
    status?: string;
  }>;
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
      selectedProjectId={selectedProjectId}
      onSelectProject={onSelectProject}
      allConversationToolParts={allConversationToolParts}
      buildProgressUpdates={buildProgressUpdates}
    />
  );
}

function UserMessage({
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

function AssistantMessage({
  message,
  isStreaming,
  isLastMessage = false,
  onRetry,
  onSend,
  selectedProjectId,
  onSelectProject,
  allConversationToolParts,
  buildProgressUpdates,
}: {
  message: ChatUIMessage;
  isStreaming: boolean;
  isLastMessage?: boolean;
  onRetry: () => void;
  onSend: (text: string, files?: File[]) => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  allConversationToolParts?: DynamicToolPart[];
  buildProgressUpdates?: Array<{
    phase: string;
    stepIndex?: number;
    status?: string;
  }>;
}) {
  const allToolParts = useMemo(
    () =>
      message.parts.filter(
        (p): p is DynamicToolPart => p.type === 'dynamic-tool',
      ),
    [message.parts],
  );

  const reasoningText = useMemo(
    () =>
      message.parts
        .filter(
          (p): p is { type: 'reasoning'; text: string } =>
            p.type === 'reasoning',
        )
        .map((p) => p.text)
        .join(''),
    [message.parts],
  );
  const hasReasoning = reasoningText.length > 0;
  const renderableParts = message.parts.filter(
    (p): p is { type: 'text'; text: string } =>
      p.type === 'text' && p.text.length > 0,
  );
  const hasContent = renderableParts.length > 0;
  const hasToolCalls = allToolParts.length > 0;
  const hasAnyVisible = hasToolCalls || hasContent || hasReasoning;

  const isWaiting = isStreaming && !hasAnyVisible;
  const activityActive =
    isWaiting || hasToolCalls || (isStreaming && hasReasoning && !hasContent);

  const [activityEverShown, setActivityEverShown] = useState(
    activityActive || hasToolCalls,
  );
  if ((activityActive || hasToolCalls) && !activityEverShown) {
    setActivityEverShown(true);
  }

  const fullText = getTextFromParts(message.parts);
  const hasBuildProgress = useMemo(
    () => parseBuildProgress(fullText).progress !== null,
    [fullText],
  );

  const thinkingToolParts = useMemo(
    () =>
      hasBuildProgress
        ? allToolParts.filter(
            (p) => !chatUtils.BUILD_TOOL_NAMES.has(p.toolName),
          )
        : allToolParts,
    [allToolParts, hasBuildProgress],
  );

  if (!isStreaming && !isLastMessage && !hasContent) {
    return null;
  }

  return (
    <motion.div
      className="py-3 group/msg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <div className="min-w-0 space-y-2 flex-1">
          {activityEverShown && (
            <ThinkingBlock
              toolParts={thinkingToolParts}
              reasoningText={reasoningText}
              isStreaming={isStreaming}
            />
          )}

          <AnimatePresence>
            {hasContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {renderTextParts({
                  parts: renderableParts,
                  isStreaming,
                  isLastMessage,
                  onSend,
                  selectedProjectId,
                  onSelectProject,
                  allParts: message.parts,
                  allConversationToolParts,
                  buildProgressUpdates,
                })}
              </motion.div>
            )}
          </AnimatePresence>

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
                <MessageAction tooltip={t('Regenerate')}>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
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
}

function renderTextParts({
  parts,
  isStreaming,
  onSend,
  selectedProjectId,
  onSelectProject,
  isLastMessage,
  allParts,
  allConversationToolParts,
  buildProgressUpdates,
}: {
  parts: Array<{ type: 'text'; text: string }>;
  isStreaming: boolean;
  isLastMessage: boolean;
  onSend: (text: string, files?: File[]) => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  allParts: ChatUIMessage['parts'];
  allConversationToolParts?: DynamicToolPart[];
  buildProgressUpdates?: Array<{
    phase: string;
    stepIndex?: number;
    status?: string;
  }>;
}): React.ReactNode[] {
  const fullText = parts.map((p) => p.text).join('');
  const { progress: buildProgress } = parseBuildProgress(fullText);

  const nodes: React.ReactNode[] = [];

  if (buildProgress) {
    const toolParts =
      allConversationToolParts ??
      allParts.filter((p) => p.type === 'dynamic-tool');
    nodes.push(
      <BuildProgressCard
        key="build-progress"
        progress={buildProgress}
        toolParts={toolParts}
        allParts={allParts}
        buildStepUpdates={buildProgressUpdates}
        isStreaming={isStreaming}
      />,
    );
  }

  for (let i = 0; i < parts.length; i++) {
    nodes.push(
      <MessageContentWithAuth
        key={i}
        content={parts[i].text}
        onSend={onSend}
        selectedProjectId={selectedProjectId}
        onSelectProject={onSelectProject}
        isLastMessage={isLastMessage}
      />,
    );
  }

  return nodes;
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
