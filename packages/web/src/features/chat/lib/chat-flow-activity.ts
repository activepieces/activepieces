import { parseToJsonIfPossible } from '@activepieces/core-utils';
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
  return stepTargets({ message, flowId, targets: STEP_TARGETS });
}

function addingAfterStepNames({
  message,
  flowId,
}: {
  message: ChatUIMessage | null;
  flowId: string;
}): string[] {
  return stepTargets({ message, flowId, targets: ADD_STEP_TARGETS });
}

function testingStepNames({
  message,
  flowId,
}: {
  message: ChatUIMessage | null;
  flowId: string;
}): string[] {
  return stepTargets({ message, flowId, targets: TEST_TARGETS });
}

function testRunIds({
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
    .filter((part) => part.state === 'output-available')
    .filter((part) => {
      const { toolName, input } = agentToolSkills.effectiveToolCall({
        toolName: chatPartUtils.getToolPartName(part),
        input: part.input,
      });
      return (
        toolName in TEST_TARGETS && isRecord(input) && input.flowId === flowId
      );
    })
    .flatMap((part) => {
      const output = parseToJsonIfPossible(part.output);
      const structured = isRecord(output) ? output.structuredContent : null;
      const runId = isRecord(structured) ? structured.runId : null;
      return typeof runId === 'string' ? [runId] : [];
    });
}

function stepTargets({
  message,
  flowId,
  targets,
}: {
  message: ChatUIMessage | null;
  flowId: string;
  targets: Record<string, (input: Record<string, unknown>) => unknown>;
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
      const target = targets[toolName];
      if (!target || !isRecord(input) || input.flowId !== flowId) {
        return [];
      }
      const stepName = target(input);
      return typeof stepName === 'string' ? [stepName] : [];
    });
}

const ADD_STEP_TARGETS: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  ap_add_step: (input) => input.parentStepName,
};

const TEST_TARGETS: Record<
  string,
  (input: Record<string, unknown>) => unknown
> = {
  ap_test_step: (input) => input.stepName,
  ap_test_flow: () => 'trigger',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const chatFlowActivity = {
  editingStepNames,
  addingAfterStepNames,
  testingStepNames,
  testRunIds,
};

export type ChatFlowActivity = {
  isWorking: boolean;
  editingStepNames: string[];
  addingAfterStepNames: string[];
  testingStepNames: string[];
  testRunIds: string[];
  wasStopped: boolean;
  stop: () => void;
};
