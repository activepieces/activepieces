import { ApMarkdown } from '@/components/custom/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AgentResult,
  ContentBlockType,
  MarkdownVariant,
} from '@activepieces/shared';

import { AgentToolBlock } from '../agent-tool-block';

import { AgentPromptBlock } from './agent-prompt-block';

type AgentTimelineProps = {
  className?: string;
  agentResult: AgentResult;
};

const AgentTimeline = ({ agentResult, className = '' }: AgentTimelineProps) => {
  return (
    <div className={`h-full ${className}`}>
      {agentResult.prompt !== '' && (
        <AgentPromptBlock prompt={agentResult.prompt} />
      )}
      <ScrollArea className="flex-1 min-h-0 mt-3">
        <div className="flex flex-col gap-3">
          {agentResult.steps.map((step, index) => {
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
