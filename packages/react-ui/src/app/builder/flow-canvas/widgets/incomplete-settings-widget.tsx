import { t } from 'i18next';
import React, { useMemo, useState } from 'react';

import { BuilderState } from '@/app/builder/builder-hooks';
import { PieceSelectors } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { FlowVersion, TriggerType, flowHelper } from '@activepieces/shared';

type IncompleteSettingsButtonProps = {
  flowVersion: FlowVersion;
  selectStepByName: BuilderState['selectStepByName'];
};

const IncompleteSettingsButton: React.FC<IncompleteSettingsButtonProps> = ({
  flowVersion,
  selectStepByName,
}) => {
  const [openTriggerMenu, setOpenTriggerMenu] = useState(false);
  const invalidSteps = useMemo(
    () =>
      flowHelper.getAllSteps(flowVersion.trigger).filter((step) => !step.valid)
        .length,
    [flowVersion],
  );
  function onClick() {
    const invalidSteps = flowHelper
      .getAllSteps(flowVersion.trigger)
      .filter((step) => !step.valid);
    if (invalidSteps.length > 0) {
      if (invalidSteps[0].type === TriggerType.EMPTY) {
        setOpenTriggerMenu(true);
      } else {
        selectStepByName(invalidSteps[0].name);
      }
      return;
    }
  }

  return (
    !flowVersion.valid && (
      <PieceSelectors
        type="trigger"
        open={openTriggerMenu}
        onOpenChange={setOpenTriggerMenu}
      >
        <Button
          variant="ghost"
          className="h-8 bg-warning-100 text-warning-300 hover:bg-warning-100 hover:border-warning hover:text-warning-300 border border-solid border border-warning/50 rounded-full animate-fade"
          key={'complete-flow-button'}
          onClick={(e) => {
            onClick();
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {t('incompleteSteps', { invalidSteps: invalidSteps })}
        </Button>
      </PieceSelectors>
    )
  );
};

IncompleteSettingsButton.displayName = 'IncompleteSettingsButton';
export default IncompleteSettingsButton;
