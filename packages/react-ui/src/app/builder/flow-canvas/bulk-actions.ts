import {
  toast,
  INTERNAL_ERROR_TOAST,
  UNSAVED_CHANGES_TOAST,
} from '@/components/ui/use-toast';
import {
  Action,
  flowOperations,
  FlowOperationType,
  flowStructureUtil,
  FlowVersion,
  StepLocationRelativeToParent,
  PasteLocation,
} from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

type CopyActionsRequest = {
  type: 'COPY_ACTIONS';
  actions: Action[];
};

export function copySelectedNodes({
  selectedNodes,
  flowVersion,
}: Pick<BuilderState, 'selectedNodes' | 'flowVersion'>) {
  const actionsToCopy = flowOperations.getActionsForCopy(
    selectedNodes,
    flowVersion,
  );
  const request: CopyActionsRequest = {
    type: 'COPY_ACTIONS',
    actions: actionsToCopy,
  };
  navigator.clipboard.writeText(JSON.stringify(request));
}

export function deleteSelectedNodes({
  selectedNodes,
  applyOperation,
  selectedStep,
  exitStepSettings,
}: Pick<
  BuilderState,
  'selectedNodes' | 'applyOperation' | 'selectedStep' | 'exitStepSettings'
>) {
  applyOperation(
    {
      type: FlowOperationType.DELETE_ACTION,
      request: {
        names: selectedNodes,
      },
    },
    () => toast(INTERNAL_ERROR_TOAST),
  );
  if (selectedStep && selectedNodes.includes(selectedStep)) {
    exitStepSettings();
  }
}

export async function getActionsInClipboard(): Promise<Action[]> {
  try {
    const clipboardText = await navigator.clipboard.readText();
    const request: CopyActionsRequest = JSON.parse(clipboardText);

    if (request && request.type === 'COPY_ACTIONS') {
      return request.actions;
    }
  } catch (error) {
    return [];
  }

  return [];
}

export function pasteNodes(
  actions: Action[],
  flowVersion: BuilderState['flowVersion'],
  pastingDetails: PasteLocation,
  applyOperation: BuilderState['applyOperation'],
) {
  const addOperations = flowOperations.getOperationsForPaste(
    actions,
    flowVersion,
    pastingDetails,
  );
  addOperations.forEach((request) => {
    applyOperation(request, () => {
      toast(UNSAVED_CHANGES_TOAST);
    });
  });
}

export function getLastLocationAsPasteLocation(
  flowVersion: FlowVersion,
): PasteLocation {
  const nextActions = flowStructureUtil.getAllNextActionsWithoutChildren(
    flowVersion.trigger,
  );
  const lastAction = nextActions[nextActions.length - 1];
  return {
    parentStepName: lastAction.name,
    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
  };
}

export function toggleSkipSelectedNodes({
  selectedNodes,
  flowVersion,
  applyOperation,
}: Pick<BuilderState, 'selectedNodes' | 'flowVersion' | 'applyOperation'>) {
  const steps = selectedNodes.map((node) =>
    flowStructureUtil.getStepOrThrow(node, flowVersion.trigger),
  ) as Action[];
  const areAllStepsSkipped = steps.every((step) => !!step.skip);
  applyOperation(
    {
      type: FlowOperationType.SET_SKIP_ACTION,
      request: {
        names: steps.map((step) => step.name),
        skip: !areAllStepsSkipped,
      },
    },
    () => toast(UNSAVED_CHANGES_TOAST),
  );
}
