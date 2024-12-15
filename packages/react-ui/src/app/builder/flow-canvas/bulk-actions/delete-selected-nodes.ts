import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  Action,
  FlowOperationType,
  flowStructureUtil,
} from '@activepieces/shared';

import { BuilderState } from '../../builder-hooks';

export const deleteSelectedNodes = ({
  selectedNodes,
  applyOperation,
  selectedStep,
  exitStepSettings,
  flowVersion,
}: Pick<
  BuilderState,
  | 'selectedNodes'
  | 'applyOperation'
  | 'selectedStep'
  | 'exitStepSettings'
  | 'flowVersion'
>) => {
  const steps = selectedNodes.map((node) =>
    flowStructureUtil.getStepOrThrow(node, flowVersion.trigger),
  ) as Action[];
  steps.forEach((step) => {
    applyOperation(
      {
        type: FlowOperationType.DELETE_ACTION,
        request: {
          name: step.name,
        },
      },
      () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    );
    if (selectedStep === step.name) {
      exitStepSettings();
    }
  });
};
