import { ApMarkdown } from '@/components/custom/markdown';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const showSkeleton =
    isNil(agentRun) ||
    isNil(agent) ||
    agentRun.status === AgentTaskStatus.IN_PROGRESS;

  if (showSkeleton) {
    return (
      <div>
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
    <div className={`h-full ${className}`}>
      {agentRun.prompt !== '' && <AgentPromptBlock prompt={agentRun.prompt} />}
      <div className="flex items-center gap-3 mt-6">
        <ImageWithFallback
          src={agent?.profilePictureUrl}
          alt={agent?.displayName}
          className="size-8 rounded-full"
        ></ImageWithFallback>
        <div className="text-sm">{agent?.displayName}</div>
      </div>
      <ScrollArea className="flex-1 min-h-0 mt-3">
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
      </ScrollArea>
    </div>
  );
};

export { AgentTimeline };
