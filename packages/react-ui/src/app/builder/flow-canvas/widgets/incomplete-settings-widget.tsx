import { t } from 'i18next';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  FlowVersion,
  StepLocationRelativeToParent,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { BuilderState } from '@/app/builder/builder-hooks';

type IncompleteSettingsButtonProps = {
  flowVersion: FlowVersion;
  selectStepByName: BuilderState['selectStepByName'];
  clickOnNewNodeButton: BuilderState['clickOnNewNodeButton'];
};

const IncompleteSettingsButton: React.FC<IncompleteSettingsButtonProps> = ({
  flowVersion,
  selectStepByName,
  clickOnNewNodeButton,
}) => {
  function onClick() {
    const invalidSteps = flowHelper
      .getAllSteps(flowVersion.trigger)
      .filter((step) => !step.valid);
    if (invalidSteps.length > 0) {
      if (invalidSteps[0].type === TriggerType.EMPTY) {
        clickOnNewNodeButton(
          'trigger',
          invalidSteps[0].name,
          StepLocationRelativeToParent.AFTER,
        );
      } else {
        selectStepByName(invalidSteps[0].name);
      }
      return;
    }
  }

  return (
    !flowVersion.valid && (
      <Button
        variant="ghost"
        className="h-8 bg-warning-100 text-warning-300 hover:bg-warning-100 hover:border-warning hover:text-warning-300 border border-solid border border-warning/50 rounded-full animate-fade"
        key={'complete-flow-button'}
        onClick={onClick}
      >
        {t('Incomplete Settings')}
      </Button>
    )
  );
};

IncompleteSettingsButton.displayName = 'IncompleteSettingsButton';
export default IncompleteSettingsButton;
