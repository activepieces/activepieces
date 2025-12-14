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

import { flowCanvasUtils } from '../utils/flow-canvas-utils';

type IncompleteSettingsButtonProps = {
  flowVersion: FlowVersion;
  selectStepByName: BuilderState['selectStepByName'];
};

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
        className="h-[28px] hover:bg-amber-50 dark:hover:bg-amber-950 dark:bg-amber-950 bg-amber-50 border border-solid border-yellow-500 hover:border-yellow-700 dark:hover:border-yellow-600  dark:border-yellow-900 dark:text-yellow-600 text-yellow-700 hover:text-yellow-700 dark:hover:text-yellow-600   animate-fade"
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
export default IncompleteSettingsButton;
function filterValidOrSkippedSteps(step: Step) {
  if ((step as FlowAction).skip) return false;
  return !step.valid;
}
