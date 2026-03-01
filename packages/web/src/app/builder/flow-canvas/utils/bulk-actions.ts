import {
  FlowGraphNode,
  FlowNodeData,
  flowOperations,
  FlowOperationType,
  flowStructureUtil,
  FlowVersion,
  StepLocationRelativeToParent,
  PasteLocation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { toast } from 'sonner';

import { BuilderState } from '../../builder-hooks';

type CopyActionsRequest = {
  type: 'COPY_ACTIONS';
  actions: FlowGraphNode[];
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
  applyOperation({
    type: FlowOperationType.DELETE_ACTION,
    request: {
      names: selectedNodes,
    },
  });
  if (selectedStep && selectedNodes.includes(selectedStep)) {
    exitStepSettings();
  }
}

export async function getActionsInClipboard(): Promise<FlowGraphNode[]> {
  try {
    const clipboardText = await navigator.clipboard.readText();
    const request: CopyActionsRequest = JSON.parse(clipboardText);
    if (request && request.type === 'COPY_ACTIONS') {
      return request.actions;
    }
  } catch (error) {
    console.error('Error getting actions in clipboard', error);
    return [];
  }

  return [];
}

export async function pasteNodes(
  flowVersion: BuilderState['flowVersion'],
  pastingDetails: PasteLocation,
  applyOperation: BuilderState['applyOperation'],
) {
  const actions = await getActionsInClipboard();
  const addOperations = flowOperations.getOperationsForPaste(
    actions,
    flowVersion,
    pastingDetails,
  );
  addOperations.forEach((request) => {
    applyOperation(request);
  });
  if (addOperations.length === 0) {
    toast(t('No Steps Pasted'), {
      description: t(
        'Please make sure you have copied a step(s) and allowed permission to your clipboard',
      ),
    });
  }
}

export function getLastLocationAsPasteLocation(
  flowVersion: FlowVersion,
): PasteLocation {
  const triggerNode = flowStructureUtil.getTriggerNode(flowVersion.graph);
  if (!triggerNode) {
    return {
      parentStepName: 'trigger',
      stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
    };
  }
  const successorEdge = flowStructureUtil.getSuccessorEdge(
    flowVersion.graph,
    triggerNode.id,
  );
  const chainStepNames =
    successorEdge && successorEdge.target
      ? flowStructureUtil.getDefaultChain(
          flowVersion.graph,
          successorEdge.target,
        )
      : [];
  const lastStepName =
    chainStepNames.length > 0
      ? chainStepNames[chainStepNames.length - 1]
      : triggerNode.id;
  return {
    parentStepName: lastStepName,
    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
  };
}

export function toggleSkipSelectedNodes({
  selectedNodes,
  flowVersion,
  applyOperation,
}: Pick<BuilderState, 'selectedNodes' | 'flowVersion' | 'applyOperation'>) {
  const steps = selectedNodes.map((node) =>
    flowStructureUtil.getStepOrThrow(node, flowVersion),
  );
  const areAllStepsSkipped = steps.every(
    (step) => 'skip' in step.data && !!step.data.skip,
  );
  applyOperation({
    type: FlowOperationType.SET_SKIP_ACTION,
    request: {
      names: steps.map((step) => step.id),
      skip: !areAllStepsSkipped,
    },
  });
}

export const canvasBulkActions = {
  copySelectedNodes,
  deleteSelectedNodes,
  getActionsInClipboard,
  getLastLocationAsPasteLocation,
  pasteNodes,
  toggleSkipSelectedNodes,
};
