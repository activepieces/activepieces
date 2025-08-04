import { t } from 'i18next';

import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { cn } from '@/lib/utils';
import { Action, Trigger } from '@activepieces/shared';

import { flowUtilConsts } from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';

const StepDragOverlay = ({
  step,
  lefSideBarContainerWidth,
  cursorPosition,
}: {
  step: Action | Trigger;
  lefSideBarContainerWidth: number;
  cursorPosition: { x: number; y: number };
}) => {
  const left = `${
    cursorPosition.x -
    flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    lefSideBarContainerWidth
  }px`;
  const top = `${
    cursorPosition.y - flowUtilConsts.STEP_DRAG_OVERLAY_HEIGHT - 15
  }px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });
  const isRouneded = flowCanvasUtils.isRoundedNode(step.type);

  return (
    <div
      className={cn(
        'p-1 absolute left-0 top-0  opacity-75  flex items-center justify-center rounded-lg border border-solid border bg-white',
        {
          'rounded-full': isRouneded,
        },
      )}
      style={{
        left,
        top,
        height: `${flowUtilConsts.STEP_DRAG_OVERLAY_HEIGHT}px`,
        width: `${flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH}px`,
      }}
    >
      <img
        id={t('logo')}
        className={cn('object-contain left-0 right-0 static size-[48px]', {
          'rounded-full': isRouneded,
        })}
        src={
          step.settings?.inputUiInfo?.customizedInputs?.logoUrl ??
          stepMetadata?.logoUrl
        }
        alt={t('Step Icon')}
      />
    </div>
  );
};

export default StepDragOverlay;
