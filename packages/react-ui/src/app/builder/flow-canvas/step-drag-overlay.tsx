import { t } from 'i18next';

import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import {
  BUILDER_NAVIGATION_SIDEBAR_ID,
  flowUtilConsts,
  LEFT_SIDEBAR_ID,
} from './utils/consts';

const StepDragOverlay = ({
  step,
  cursorPosition,
}: {
  step: FlowAction | FlowTrigger;
  cursorPosition: { x: number; y: number };
}) => {
  //the overlay position is relatiive to the whole screen so when items that squeeze the canvas from the left are rendered, we need to adjust the position
  //so we need to get the width of the left sidebar and the navigation bar and subtract them from the cursor position
  const { open } = useSidebar();
  const builderLeftSidebar = document.getElementById(LEFT_SIDEBAR_ID);
  const builderLeftSidebarWidth = builderLeftSidebar?.clientWidth ?? 0;
  const builderNavigationBar = document.getElementById(
    BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;
  const left = `${
    cursorPosition.x -
    flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    builderLeftSidebarWidth -
    builderNavigationBarWidth
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
