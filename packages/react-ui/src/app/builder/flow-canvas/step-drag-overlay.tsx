import { t } from 'i18next';

import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import { flowUtilConsts } from './utils/consts';

const StepDragOverlay = ({
  step,
  lefSideBarContainerWidth,
  cursorPosition,
}: {
  step: FlowAction | FlowTrigger;
  lefSideBarContainerWidth: number;
  cursorPosition: { x: number; y: number };
}) => {
  const left = `${
    cursorPosition.x -
    flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    lefSideBarContainerWidth
  }px`;
  const top = `${cursorPosition.y - flowUtilConsts.STEP_DRAG_OVERLAY_HEIGHT}px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });

  return (
    <div
      className={
        'p-4 absolute left-0 top-0  opacity-75  flex items-center justify-center rounded-lg border border-solid border bg-white'
      }
      style={{
        left,
        top,
        height: `${flowUtilConsts.STEP_DRAG_OVERLAY_HEIGHT}px`,
        width: `${flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH}px`,
      }}
    >
      <img
        id={t('logo')}
        className={'object-contain left-0 right-0 static'}
        src={step?.settings?.customLogoUrl ?? stepMetadata?.logoUrl}
        alt={t('Step Icon')}
      />
    </div>
  );
};

export default StepDragOverlay;
