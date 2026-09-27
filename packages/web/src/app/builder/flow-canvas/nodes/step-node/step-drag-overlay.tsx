import { FlowAction, FlowTrigger } from '@activepieces/shared';
import { useStore } from '@xyflow/react';
import { t } from 'i18next';
import { useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { stepsHooks } from '@/features/pieces';

import {
  useCursorPosition,
  useCursorPositionEffect,
} from '../../../state/cursor-position-context';
import { flowCanvasConsts } from '../../utils/consts';

const StepDragOverlay = ({ step }: { step: FlowAction | FlowTrigger }) => {
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    useState<typeof cursorPosition>(cursorPosition);
  const canvasElement = useStore((state) => state.domNode);
  const canvasRect = canvasElement?.getBoundingClientRect();
  const left = `${
    overlayPosition.x -
    flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    (canvasRect?.left ?? 0)
  }px`;
  const top = `${
    overlayPosition.y -
    flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT / 2 -
    (canvasRect?.top ?? 0)
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
        'p-4 absolute left-0 top-0 cursor-grabbing z-50  opacity-75  flex items-center justify-center rounded-2xl border border-solid border bg-gray-1 cursor-grabbing'
      }
      style={{
        left,
        top,
        height: `${flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT}px`,
        width: `${flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH}px`,
        zIndex: 99999,
      }}
      id={'dragged-step-overlay'}
    >
      <LogoPlate
        className="h-full w-full !cursor-grabbing"
        src={step?.settings?.customLogoUrl ?? stepMetadata?.logoUrl}
        alt={t('Step Icon')}
      />
    </div>
  );
};

export default StepDragOverlay;
