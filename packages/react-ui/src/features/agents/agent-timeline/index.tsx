
import { ApMarkdown } from '@/components/custom/markdown';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AgentTaskStatus,
  ContentBlockType,
  isNil,
  MarkdownVariant,
} from '@activepieces/shared';
import { agentRunHooks } from '../lib/agent-hooks';
import { AgentPromptBlock } from './agent-prompt-block';
import { AgentToolBlock } from '../agent-tool-block';
import { AgentStepSkeleton } from './agent-step-skeleton';


type AgentTimelineProps = {
  className?: string;
  agentRunId: string | null | undefined;
};

const AgentTimeline = ({
  agentRunId,
  className = '',
}: AgentTimelineProps) => {
  const { data: agentRun } = agentRunHooks.useGet(agentRunId);

  const showSkeleton = isNil(agentRun) || agentRun.status === AgentTaskStatus.IN_PROGRESS;
  if(isNil(agentRun)) {
    return <></>
  }
  return (
    <ScrollArea className={`h-full p-4 ${className}`}>
      {agentRun.prompt !== '' && <AgentPromptBlock prompt={agentRun.prompt} />}
      <div className=" flex flex-col gap-3">
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
        {showSkeleton && <AgentStepSkeleton agentId={agentRun?.agentId!} />}
      </div>
    </ScrollArea>
  );
};


export { AgentTimeline };
