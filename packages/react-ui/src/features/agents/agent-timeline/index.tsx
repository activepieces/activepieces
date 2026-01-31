import { t } from 'i18next';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type AgentResult,
  AgentTaskStatus,
  isNil,
  AssistantConversationContent,
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

// Extract all parts from assistant messages in the conversation
const getAssistantParts = (agentResult: AgentResult): AssistantConversationContent[] => {
  const conversation = agentResult.conversation ?? [];
  return conversation
    .filter((msg) => msg.role === 'assistant')
    .flatMap((msg) => msg.parts);
};

export const AgentTimeline = ({
  agentResult,
  className = '',
}: AgentTimelineProps) => {
  if (isNil(agentResult)) {
    return <p>{t('No agent output available')}</p>;
  }
  const parts = getAssistantParts(agentResult);

  return (
    <div className={`h-full flex w-full flex-col ${className}`}>
      <ScrollArea className="flex-1 min-h-0 relative">
        <div className="absolute left-2 top-4 bottom-8 w-px bg-border" />

        <div className="space-y-7 pb-4">
          {agentResult.prompt && agentResult.prompt.length > 0 && (
            <PromptBlock prompt={agentResult.prompt} />
          )}

          {parts.map((part, index) => {
            switch (part.type) {
              case 'text':
                return <MarkdownBlock key={index} part={part} index={index} />;
              case 'tool-call':
                return (
                  <AgentToolBlock key={index} block={part} index={index} />
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
