import { t } from 'i18next';

import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import { BUILDER_NAVIGATION_SIDEBAR_ID, flowUtilConsts } from './utils/consts';
import { useCursorPosition } from './cursor-position-context';
import { useEffect, useState } from 'react';

const StepDragOverlay = ({
  step,
}: {
  step: FlowAction | FlowTrigger;
}) => {
  const { open } = useSidebar();
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] = useState<{ x: number; y: number }>(cursorPosition);
  const builderNavigationBar = document.getElementById(
    BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;
  const left = `${
    overlayPosition.x -
    flowUtilConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    builderNavigationBarWidth
  }px`;
  const top = `${
    overlayPosition.y - flowUtilConsts.STEP_DRAG_OVERLAY_HEIGHT - 20
  }px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setOverlayPosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('pointermove', handleMouseMove);
    return () => {
      window.removeEventListener('pointermove', handleMouseMove);
    };
  },[])
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
