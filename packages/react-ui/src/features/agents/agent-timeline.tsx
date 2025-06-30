import { Loader2 } from 'lucide-react';
import React from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AgentStepBlock,
  ContentBlockType,
  isNil,
  MarkdownVariant,
} from '@activepieces/shared';

import { AgentToolBlock } from './agent-tool-block';

type AgentTimelineProps = {
  steps: AgentStepBlock[];
  prompt?: string;
  isLoading?: boolean;
  className?: string;
};

const AgentTimeline = ({
  steps,
  prompt,
  className = '',
}: AgentTimelineProps) => {
  if (isNil(steps)) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full ${className}`}
      >
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="text-sm text-gray-500 mt-2">Thinking...</div>
      </div>
    );
  }

  return (
    <ScrollArea className={`h-full p-4 ${className}`}>
      <div className=" flex flex-col gap-3">
        {!isNil(prompt) && (
          <div className="text-sm text-gray-500">{prompt}</div>
        )}
        {steps.map((step, index) => {
          return (
            <div key={index}>
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
  );
};

export { AgentTimeline };
