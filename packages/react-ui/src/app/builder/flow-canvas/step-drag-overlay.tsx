import { t } from 'i18next';
import { useState } from 'react';

import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import {
  useCursorPosition,
  useCursorPositionEffect,
} from '../state/cursor-position-context';

import { flowCanvasConsts } from './utils/consts';

const StepDragOverlay = ({ step }: { step: FlowAction | FlowTrigger }) => {
  const { open } = useSidebar();
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    useState<typeof cursorPosition>(cursorPosition);
  const builderNavigationBar = document.getElementById(
    flowCanvasConsts.BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;
  const left = `${
    overlayPosition.x -
    flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    builderNavigationBarWidth
  }px`;
  const top = `${
    overlayPosition.y - flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT - 20
  }px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  return (
    <div
      className={
        'p-4 absolute left-0 top-0  opacity-75  flex items-center justify-center rounded-2xl border border-solid border bg-background'
      }
      style={{
        left,
        top,
        height: `${flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT}px`,
        width: `${flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH}px`,
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
