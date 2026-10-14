import { agentToolSkills } from '@activepieces/shared';

import { ChatUIMessage, chatPartUtils } from './chat-types';

const STEP_TARGETS: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  ap_update_step: (input) => input.stepName,
  ap_delete_step: (input) => input.stepName,
  ap_update_trigger: () => 'trigger',
  ap_add_branch: (input) => input.routerStepName,
  ap_update_branch: (input) => input.routerStepName,
  ap_delete_branch: (input) => input.routerStepName,
};

function editingStepNames({
  message,
  flowId,
}: {
  message: ChatUIMessage | null;
  flowId: string;
}): string[] {
  if (!message) {
    return [];
  }
  return message.parts
    .filter(chatPartUtils.isAnyToolPart)
    .filter(
      (part) =>
        part.state !== 'output-available' && part.state !== 'output-error',
    )
    .map((part) =>
      agentToolSkills.effectiveToolCall({
        toolName: chatPartUtils.getToolPartName(part),
        input: part.input,
      }),
    )
    .flatMap(({ toolName, input }) => {
      const target = STEP_TARGETS[toolName];
      if (!target || !isRecord(input) || input.flowId !== flowId) {
        return [];
      }
      const stepName = target(input);
      return typeof stepName === 'string' ? [stepName] : [];
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const chatFlowActivity = {
  editingStepNames,
};

export type ChatFlowActivity = {
  isWorking: boolean;
  editingStepNames: string[];
  stop: () => void;
};
