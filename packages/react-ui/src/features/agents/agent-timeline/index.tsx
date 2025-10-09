import { t } from 'i18next';
import { Lightbulb } from 'lucide-react';

import { ApMarkdown } from '@/components/custom/markdown';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import {
  AgentTaskStatus,
  ContentBlockType,
  isNil,
  MarkdownVariant,
} from '@activepieces/shared';

import { AgentToolBlock } from '../agent-tool-block';
import { agentHooks, agentRunHooks } from '../lib/agent-hooks';

import { AgentPromptBlock } from './agent-prompt-block';

type AgentTimelineProps = {
  className?: string;
  agentRunId: string | null | undefined;
};

const AgentTimeline = ({ agentRunId, className = '' }: AgentTimelineProps) => {
  const { data: agentRun } = agentRunHooks.useGet(agentRunId);

  const { data: agent } = agentHooks.useGet(agentRun?.agentId);
  const showSkeleton = isNil(agentRun) || isNil(agent);

  if (showSkeleton) {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 mt-6 mb-3">
          <ImageWithFallback
            src={agent?.profilePictureUrl}
            alt={agent?.displayName}
            className="size-8 rounded-full"
          ></ImageWithFallback>
          <Skeleton className="h-4 w-24"></Skeleton>
        </div>
        <SkeletonList numberOfItems={6} className="h-8"></SkeletonList>
      </div>
    );
  }
  return (
    <ScrollArea className={`h-full ${className}`}>
      {agentRun.prompt !== '' && <AgentPromptBlock prompt={agentRun.prompt} />}
      <Separator className="my-3" />
      <div className="font-semibold mb-3">{t('Response')}</div>

      <div className="flex flex-col gap-3">
        {agentRun.steps.map((step, index) => {
          return (
            <div key={index} className="animate-fade">
              {step.type === ContentBlockType.MARKDOWN && (
                <ApMarkdown
                  markdown={step.markdown}
                  variant={MarkdownVariant.BORDERLESS}
                />
              )}
              {step.type === ContentBlockType.TOOL_CALL && (
                <AgentToolBlock block={step} index={index} />
              )}
            </div>
          );
        })}
      </div>
      {agentRun.status === AgentTaskStatus.IN_PROGRESS && (
        <div className="flex items-center gap-2 mt-5 py-3 border rounded-md px-4">
          <Lightbulb className="size-5 animate-primary-color-pulse" />
          <div className="text-sm font-semibold">{t('Thinking...')}</div>
        </div>
      )}
    </ScrollArea>
  );
};

export { AgentTimeline };
