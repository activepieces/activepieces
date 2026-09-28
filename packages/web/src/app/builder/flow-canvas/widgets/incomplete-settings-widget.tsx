import {
  FlowTriggerType,
  FlowVersion,
  flowStructureUtil,
} from '@activepieces/shared';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import React, { useMemo } from 'react';

import { BuilderState } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';

import { flowCanvasUtils } from '../utils/flow-canvas-utils';

type IncompleteSettingsButtonProps = {
  flowVersion: FlowVersion;
  selectStepByName: BuilderState['selectStepByName'];
  setOpenedPieceSelectorStepNameOrAddButtonId: BuilderState['setOpenedPieceSelectorStepNameOrAddButtonId'];
};

const IncompleteSettingsButton: React.FC<IncompleteSettingsButtonProps> = ({
  flowVersion,
  selectStepByName,
  setOpenedPieceSelectorStepNameOrAddButtonId,
}) => {
  const invalidSteps = useMemo(
    () => getInvalidSteps(flowVersion).length,
    [flowVersion],
  );
  const { fitView } = useReactFlow();
  function onClick() {
    const invalidSteps = getInvalidSteps(flowVersion);
    if (invalidSteps.length > 0) {
      const stepToFocus = invalidSteps[0];
      selectStepByName(stepToFocus.name);
      if (stepToFocus.type === FlowTriggerType.EMPTY) {
        setOpenedPieceSelectorStepNameOrAddButtonId(stepToFocus.name);
      }
      fitView(flowCanvasUtils.createFocusStepInGraphParams(stepToFocus.name));
    }
  }
  return (
    !flowVersion.valid && (
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
        {t('incompleteSteps', { invalidSteps: invalidSteps })}
      </Button>
    )
  );
};

IncompleteSettingsButton.displayName = 'IncompleteSettingsButton';
export default IncompleteSettingsButton;
function getInvalidSteps(flowVersion: FlowVersion) {
  const skippedStepNames = flowStructureUtil.getSkippedStepNames({
    trigger: flowVersion.trigger,
  });
  return flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .filter((step) => !step.valid && !skippedStepNames.has(step.name));
}
