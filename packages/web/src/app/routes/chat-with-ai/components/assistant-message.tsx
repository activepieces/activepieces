import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
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
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
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
  const { renderedParts, thinkingToolParts, hasContent, reasoningText } =
    useMemo(() => {
      const rendered: RenderedPart[] = [];
      const thinkingTools: AnyToolPart[] = [];
      let hasText = false;
      let reasoning = '';

      for (let i = 0; i < message.parts.length; i++) {
        const p = message.parts[i];

        if (p.type === 'text' && p.text.length > 0) {
          hasText = true;
          rendered.push({ kind: 'text', text: p.text });
        } else if (p.type === 'reasoning') {
          reasoning += p.text;
        } else if (chatPartUtils.isAnyToolPart(p)) {
          const toolName = chatPartUtils.getToolPartName(p);
          if (chatPartUtils.HIDDEN_TOOL_NAMES.has(toolName)) {
            continue;
          }
          if (chatPartUtils.isDisplayTool(toolName)) {
            rendered.push({ kind: 'display-tool', part: p });
          } else if (toolName === 'ap_request_plan_approval') {
            rendered.push({ kind: 'plan-marker' });
          } else {
            thinkingTools.push(p);
          }
        }
      }

      const planMarkerIdx = rendered.findIndex((r) => r.kind === 'plan-marker');
      if (planMarkerIdx > -1) {
        const [marker] = rendered.splice(planMarkerIdx, 1);
        rendered.unshift(marker);
      }

      const lastDisplayIdx = rendered.findLastIndex(
        (r) => r.kind === 'display-tool',
      );
      if (lastDisplayIdx > -1) {
        for (let j = rendered.length - 1; j >= 0; j--) {
          if (rendered[j].kind === 'display-tool' && j !== lastDisplayIdx) {
            rendered.splice(j, 1);
          }
        }
      }

      return {
        renderedParts: rendered,
        thinkingToolParts: thinkingTools,
        hasContent: hasText,
        reasoningText: reasoning,
      };
    }, [message.parts, isStreaming]);

  const fullText = useMemo(
    () => (isStreaming ? '' : getTextFromParts(message.parts)),
    [isStreaming, message.parts],
  );

  const openThinkingDetails = useChatStoreContext((s) => s.openThinkingDetails);
  const showPlanCard = useChatStoreContext((s) =>
    chatStoreSelectors.shouldShowPlan({
      state: s,
      isStreaming,
      isLastAssistant: isLastMessage,
      lastAssistantMessage,
    }),
  );
  const planProgress = useChatStoreContext((s) =>
    chatStoreSelectors.planProgress({ state: s, lastAssistantMessage }),
  );
  const planProgressUpdates = useChatStoreContext((s) =>
    chatStoreSelectors.effectivePlanUpdates({ state: s, lastAssistantMessage }),
  );

  const hasRenderedContent = renderedParts.some(
    (p) => p.kind !== 'plan-marker',
  );
  if (!hasContent && !hasRenderedContent && !isStreaming && !showPlanCard) {
    return null;
  }

  const showThinking =
    isStreaming ||
    ((thinkingToolParts.length > 0 || reasoningText.length > 0) && hasContent);

  return (
    <motion.div
      className="py-3 group/msg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Message>
        <div className="min-w-0 space-y-2 flex-1">
          {showThinking && (
            <ThinkingBlock
              toolParts={thinkingToolParts}
              reasoningText={reasoningText}
              isStreaming={isStreaming}
              onOpenDetails={() => openThinkingDetails(message.id)}
            />
          )}

          {renderedParts.map((part, i) => {
            switch (part.kind) {
              case 'text':
                return (
                  <div key={i} className={PROSE_CLASSES}>
                    <Markdown>{part.text}</Markdown>
                  </div>
                );
              case 'display-tool':
                return isLastMessage ? (
                  <DisplayToolCard
                    key={part.part.toolCallId}
                    part={part.part}
                    onSend={onSend}
                    isInteractive={true}
                  />
                ) : null;
              case 'plan-marker':
                return showPlanCard && planProgress ? (
                  <PlanProgressCard
                    key={`plan-${i}`}
                    progress={planProgress}
                    updates={planProgressUpdates ?? []}
                    isStreaming={isStreaming}
                  />
                ) : null;
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
});

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

type RenderedPart =
  | { kind: 'text'; text: string }
  | { kind: 'display-tool'; part: AnyToolPart }
  | { kind: 'plan-marker' };
