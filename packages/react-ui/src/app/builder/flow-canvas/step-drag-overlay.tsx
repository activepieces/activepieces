import { t } from 'i18next';

import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import { BUILDER_NAVIGATION_SIDEBAR_ID, flowUtilConsts } from './utils/consts';

const StepDragOverlay = ({
  step,
  cursorPosition,
}: {
  step: FlowAction | FlowTrigger;
  cursorPosition: { x: number; y: number };
}) => {
  const { open } = useSidebar();
  const builderNavigationBar = document.getElementById(
    BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;
  const left = `${
    cursorPosition.x -
    flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    builderNavigationBarWidth
  }px`;
  const top = `${
    cursorPosition.y - flowUtilConsts.STEP_DRAG_OVERLAY_HEIGHT - 20
  }px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });

  return (
    <div
      className={
        'p-4 absolute left-0 top-0  opacity-75  flex items-center justify-center rounded-2xl border border-solid border bg-background'
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
