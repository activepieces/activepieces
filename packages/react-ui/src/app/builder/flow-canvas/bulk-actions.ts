import {
  toast,
  INTERNAL_ERROR_TOAST,
  UNSAVED_CHANGES_TOAST,
} from '@/components/ui/use-toast';
import {
  Action,
  AddActionRequest,
  fixAddOperationsFromClipboard,
  FlowOperationType,
  flowStructureUtil,
  getAddActionsToCopy,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

export const copySelectedNodes = ({
  selectedNodes,
  flowVersion,
}: Pick<BuilderState, 'selectedNodes' | 'flowVersion'>) => {
  const operationsToCopy = getAddActionsToCopy({
    selectedSteps: selectedNodes,
    flowVersion,
  });
  navigator.clipboard.writeText(JSON.stringify(operationsToCopy));
};

export const deleteSelectedNodes = ({
  selectedNodes,
  applyOperation,
  selectedStep,
  exitStepSettings,
}: Pick<
  BuilderState,
  'selectedNodes' | 'applyOperation' | 'selectedStep' | 'exitStepSettings'
>) => {
  const steps = selectedNodes.map((name) => {
    return {
      name,
    };
  });
  applyOperation(
    {
      type: FlowOperationType.DELETE_ACTION,
      request: steps,
    },
    () => toast(INTERNAL_ERROR_TOAST),
  );
  if (selectedStep && selectedNodes.includes(selectedStep)) {
    exitStepSettings();
  }
};

export const getOperationsInClipboard = async () => {
  try {
    return JSON.parse(
      await navigator.clipboard.readText(),
    ) as AddActionRequest[];
  } catch (error) {
    return [];
  }
};

export const pasteNodes = (
  operations: AddActionRequest[],
  flowVersion: BuilderState['flowVersion'],
  pastingDetails:
    | {
        parentStepName: string;
        stepLocationRelativeToParent:
          | StepLocationRelativeToParent.AFTER
          | StepLocationRelativeToParent.INSIDE_LOOP;
      }
    | {
        branchIndex: number;
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
        parentStepName: string;
      },
  applyOperation: BuilderState['applyOperation'],
) => {
  const addOperations = fixAddOperationsFromClipboard(
    operations,
    flowVersion,
    pastingDetails,
  );
  addOperations.forEach((request) => {
    applyOperation(
      {
        type: FlowOperationType.ADD_ACTION,
        request,
      },
      () => {
        toast(UNSAVED_CHANGES_TOAST);
      },
    );
  });
};

export const toggleSkipSelectedNodes = ({
  selectedNodes,
  flowVersion,
  applyOperation,
}: Pick<BuilderState, 'selectedNodes' | 'flowVersion' | 'applyOperation'>) => {
  const steps = selectedNodes.map((node) =>
    flowStructureUtil.getStepOrThrow(node, flowVersion.trigger),
  ) as Action[];
  const areAllStepsSkipped = steps.every((step) => !!step.skip);
  const operations = steps.map((step) => {
    return {
      name: step.name,
      skip: !areAllStepsSkipped,
    };
  });
  applyOperation(
    {
      type: FlowOperationType.SET_SKIP_ACTION,
      request: operations,
    },
    () => toast(UNSAVED_CHANGES_TOAST),
  );
};
