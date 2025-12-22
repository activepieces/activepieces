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
  isValid: boolean;
  invalidStepsCount: number;
  firstInvalidStepName?: string;
  selectStepByName: BuilderState['selectStepByName'];
};

const IncompleteSettingsButton: React.FC<IncompleteSettingsButtonProps> = ({
  isValid,
  invalidStepsCount,
  firstInvalidStepName,
  selectStepByName,
}) => {
  const { fitView } = useReactFlow();
  function onClick() {
    if (firstInvalidStepName) {
      selectStepByName(firstInvalidStepName);
      fitView(flowCanvasUtils.createFocusStepInGraphParams(firstInvalidStepName));
    }
  }
  return (
    !isValid && (
      <Button
        variant="ghost"
        className="h-[28px] hover:bg-amber-50 p-2 dark:hover:bg-amber-950 dark:bg-amber-950 bg-amber-50 border border-solid border-amber-500 hover:border-amber-700 dark:hover:border-amber-600  dark:border-amber-900 dark:text-amber-600 text-amber-700 hover:text-amber-700 dark:hover:text-amber-600   animate-fade"
        key={'complete-flow-button'}
        onClick={(e) => {
          onClick();
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {t('incompleteSteps', { invalidSteps: invalidStepsCount })}
      </Button>
    )
  );
};

IncompleteSettingsButton.displayName = 'IncompleteSettingsButton';
export default IncompleteSettingsButton;
export function filterValidOrSkippedSteps(step: Step) {
  if ((step as FlowAction).skip) return false;
  return !step.valid;
}
