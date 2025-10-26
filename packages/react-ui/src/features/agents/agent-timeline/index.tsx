import { useEffect, useState } from 'react';

import { useSocket } from '@/components/socket-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type AgentResult,
  AgentTaskStatus,
  ContentBlockType,
  isNil,
  StepRunResponse,
  WebsocketClientEvent,
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
  agentResult?: AgentResult;
};

const defaultResult: AgentResult = {
  message: null,
  prompt: '',
  status: AgentTaskStatus.IN_PROGRESS,
  steps: [],
};

export const AgentTimeline = ({
  agentResult,
  className = '',
}: AgentTimelineProps) => {
  const socket = useSocket();
  const [liveResult, setLiveResult] = useState<AgentResult>(
    agentResult ?? defaultResult,
  );

  useEffect(() => setLiveResult(agentResult ?? defaultResult), [agentResult]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: StepRunResponse) => {
      if (isNil(data.output)) return;
      setLiveResult(data.output as AgentResult);
    };

    socket.on(WebsocketClientEvent.TEST_STEP_PROGRESS, handleUpdate);
    socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, handleUpdate);

    return () => {
      socket.off(WebsocketClientEvent.TEST_STEP_PROGRESS, handleUpdate);
      socket.off(WebsocketClientEvent.TEST_STEP_FINISHED, handleUpdate);
    };
  }, [socket]);

  const result = liveResult || agentResult;
  const { steps = [], status } = result;

  return (
    <div className={`h-full flex w-full flex-col ${className}`}>
      <ScrollArea className="flex-1 min-h-0 relative">
        <div className="absolute left-2 top-4 bottom-8 w-[1px] bg-border" />

        <div className="space-y-7 pb-4">
          {result.prompt && <PromptBlock prompt={result.prompt} />}

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
