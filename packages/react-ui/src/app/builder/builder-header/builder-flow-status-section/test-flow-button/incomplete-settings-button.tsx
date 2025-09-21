import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import React, { useMemo } from 'react';

import { BuilderState } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  FlowAction,
  FlowVersion,
  Step,
  flowStructureUtil,
} from '@activepieces/shared';

import { flowCanvasUtils } from '../../../flow-canvas/utils/flow-canvas-utils';

type IncompleteSettingsButtonProps = {
  flowVersion: FlowVersion;
  selectStepByName: BuilderState['selectStepByName'];
};
const filterValidOrSkippedSteps = (step: Step) =>
  (flowStructureUtil.isTrigger(step.type) && !step.valid) ||
  (flowStructureUtil.isAction(step.type) &&
    !(step as FlowAction).skip &&
    !step.valid);
const IncompleteSettingsButton: React.FC<IncompleteSettingsButtonProps> = ({
  flowVersion,
  selectStepByName,
}) => {
  const invalidSteps = useMemo(
    () =>
      flowStructureUtil
        .getAllSteps(flowVersion.trigger)
        .filter(filterValidOrSkippedSteps).length,
    [flowVersion],
  );
  const { fitView } = useReactFlow();
  function onClick() {
    const invalidSteps = flowStructureUtil
      .getAllSteps(flowVersion.trigger)
      .filter(filterValidOrSkippedSteps);
    if (invalidSteps.length > 0) {
      selectStepByName(invalidSteps[0].name);
      fitView(
        flowCanvasUtils.createFocusStepInGraphParams(invalidSteps[0].name),
      );
    }
  }

  return (
    !flowVersion.valid && (
      <Button
        variant="ghost"
        className="h-8 bg-warning-100 text-warning-300 hover:!bg-warning-100 hover:!border-warning hover:!text-warning-300 border border-solid border-warning/50  animate-fade"
        key={'complete-flow-button'}
        onClick={(e) => {
          onClick();
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {t('incompleteSteps', { invalidSteps: invalidSteps })}
      </Button>
    )
  );
};

IncompleteSettingsButton.displayName = 'IncompleteSettingsButton';
export { IncompleteSettingsButton };