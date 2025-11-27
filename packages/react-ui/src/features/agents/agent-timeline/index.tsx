import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type AgentResult,
  AgentTaskStatus,
  ContentBlockType,
} from '@activepieces/shared';

import {
  AgentToolBlock,
  DoneBlock,
  FailedBlock,
  MarkdownBlock,
  PromptBlock,
  ThinkingBlock,
} from './timeline-blocks';

type AgentTimelineProps = {
  className?: string;
  agentResult: AgentResult;
};

export const AgentTimeline = ({
  agentResult,
  className = '',
}: AgentTimelineProps) => {
  const { steps = [], status } = agentResult;
  return (
    <div className={`h-full flex w-full flex-col ${className}`}>
      <ScrollArea className="flex-1 min-h-0 relative">
        <div className="absolute left-2 top-4 bottom-8 w-[1px] bg-border" />

        <div className="space-y-7 pb-4">
          {agentResult.prompt && <PromptBlock prompt={agentResult.prompt} />}

          {steps.map((step, index) => {
            switch (step.type) {
              case ContentBlockType.MARKDOWN:
                return <MarkdownBlock key={index} step={step} index={index} />;
              case ContentBlockType.TOOL_CALL:
                return (
                  <AgentToolBlock key={index} block={step} index={index} />
                );
              default:
                return null;
            }
          })}

          {status === AgentTaskStatus.IN_PROGRESS && <ThinkingBlock />}

          {status === AgentTaskStatus.COMPLETED && <DoneBlock />}

          {status === AgentTaskStatus.FAILED && <FailedBlock />}
        </div>
      </ScrollArea>
    </div>
  );
};
