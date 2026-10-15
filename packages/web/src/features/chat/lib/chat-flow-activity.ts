import { isObject, parseToJsonIfPossible } from '@activepieces/core-utils';
import {
  agentToolSkills,
  FlowToolTarget,
  flowToolTargets,
} from '@activepieces/shared';

import { ChatUIMessage, chatPartUtils } from './chat-types';

function extract({
  message,
  flowId,
}: {
  message: ChatUIMessage | null;
  flowId: string;
}): ChatFlowToolActivity {
  const calls = (message?.parts ?? [])
    .filter(chatPartUtils.isAnyToolPart)
    .map((part) => ({
      part,
      ...agentToolSkills.effectiveToolCall({
        toolName: chatPartUtils.getToolPartName(part),
        input: part.input,
      }),
    }))
    .filter(({ input }) => isObject(input) && input.flowId === flowId);
  const isDone = (state: string) =>
    state === 'output-available' || state === 'output-error';
  return {
    targets: calls
      .filter(({ part }) => !isDone(part.state))
      .flatMap(({ toolName, input }) => {
        const target = flowToolTargets.targetOf({ toolName, input });
        return target === null ? [] : [target];
      }),
    testRunIds: calls
      .filter(
        ({ part, toolName }) =>
          isDone(part.state) && flowToolTargets.reportsTestRun(toolName),
      )
      .flatMap(({ part }) => {
        const output = parseToJsonIfPossible(part.output);
        const structured = isObject(output) ? output.structuredContent : null;
        const runId = isObject(structured) ? structured.runId : null;
        return typeof runId === 'string' ? [runId] : [];
      }),
  };
}

export const chatFlowActivity = {
  extract,
};

export type ChatFlowToolActivity = {
  targets: FlowToolTarget[];
  testRunIds: string[];
};

export type ChatFlowActivity = ChatFlowToolActivity & {
  isWorking: boolean;
  wasStopped: boolean;
  stop: () => void;
};
