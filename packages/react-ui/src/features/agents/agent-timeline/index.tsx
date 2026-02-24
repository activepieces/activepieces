import { t } from 'i18next';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type AgentResult,
  AgentTaskStatus,
  ContentBlockType,
  isNil,
} from '@activepieces/shared';

import {
  AgentToolBlock,
  DoneBlock,
  FailedBlock,
  MarkdownBlock,
  PromptBlock,
  StructuredOutputBlock,
  ThinkingBlock,
} from './timeline-blocks';

type AgentTimelineProps = {
  className?: string;
  agentResult?: AgentResult;
};

export const AgentTimeline = ({
  agentResult,
  className = '',
}: AgentTimelineProps) => {
  if (isNil(agentResult)) {
    return <p>{t('No agent output available')}</p>;
  }

  return (
    <div className={`h-full flex w-full flex-col ${className}`}>
      <ScrollArea className="flex-1 min-h-0 relative">
        <div className="absolute left-2 top-4 bottom-8 w-px bg-border" />

        <div className="space-y-7 pb-4">
          {agentResult.prompt.length > 0 && (
            <PromptBlock prompt={agentResult.prompt} />
          )}

          {agentResult.steps.map((step, index) => {
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

          {!isNil(agentResult.structuredOutput) && (
            <StructuredOutputBlock output={agentResult.structuredOutput} />
          )}

          {agentResult.status === AgentTaskStatus.IN_PROGRESS && (
            <ThinkingBlock />
          )}
          {agentResult.status === AgentTaskStatus.COMPLETED && <DoneBlock />}
          {agentResult.status === AgentTaskStatus.FAILED && <FailedBlock />}
        </div>
      </ScrollArea>
    </div>
  );
};
