import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { FlowOperationType, flowStructureUtil } from '@activepieces/shared';

import { BuilderState } from '../../builder-hooks';
import { ApNode, ApNodeType } from '../utils/types';

export const deleteSelectedNodes = (
  selectedNodes: ApNode[],
  applyOperation: BuilderState['applyOperation'],
  selectedStep: BuilderState['selectedStep'],
  exitStepSettings: BuilderState['exitStepSettings'],
) => {
  selectedNodes.forEach((node) => {
    if (
      node.type === ApNodeType.STEP &&
      !flowStructureUtil.isTriggerType(node.data.step.type)
    ) {
      applyOperation(
        {
          type: FlowOperationType.DELETE_ACTION,
          request: {
            name: node.data.step.name,
          },
        },
        () => {
          toast(INTERNAL_ERROR_TOAST);
        },
      );
      if (selectedStep === node.data.step.name) {
        exitStepSettings();
      }
    }
  });
};
