import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowTriggerType,
  flowStructureUtil,
  Step,
} from '@activepieces/shared';
import { useReactFlow, useStore } from '@xyflow/react';
import { t } from 'i18next';
import { PanelRightOpen } from 'lucide-react';
import { RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';
import { useChatDockOptional } from '@/app/components/workspace-shell/chat-dock-context';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { flowCanvasConsts } from '../utils/consts';

import { StepPreviewSummary } from './step-preview-summary';

// While the chat is docked, clicking a step shows here: a floating card anchored to
// the selected step holding a compact, read-only printout of its values, so the
// canvas and chat stay in view. Positioned in screen space (constant, readable size
// at any zoom), it re-anchors as the canvas pans/zooms, shrinks to fit a narrow
// Stage, and flips to the step's left edge when there's no room on the right.
// Clicking outside or pressing Escape dismisses it; "Edit settings" pops the chat
// out and hands over to the full sidebar.
export const StepPreviewCard = ({
  isExiting,
  containerRef,
}: {
  isExiting?: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
}) => {
  const [selectedStepName, rightSidebar, flowVersion, exitStepSettings] =
    useBuilderStateContext((state) => [
      state.selectedStep,
      state.rightSidebar,
      state.flowVersion,
      state.exitStepSettings,
    ]);
  const { getNode, flowToScreenPosition } = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  // These subscriptions exist only to re-anchor the card when the canvas pans or
  // resizes; the values themselves are unused (position comes from the measured
  // rect + flowToScreenPosition below).
  const _panX = useStore((s) => s.transform[0]);
  const _panY = useStore((s) => s.transform[1]);
  const _viewportW = useStore((s) => s.width);
  const _viewportH = useStore((s) => s.height);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (isNil(target)) {
        return;
      }
      if (cardRef.current?.contains(target)) {
        return;
      }
      // Only dismiss for clicks within the canvas the card belongs to. Clicking
      // another panel — e.g. the chat beside the Stage — must NOT close it.
      const canvas = containerRef.current;
      if (isNil(canvas) || !canvas.contains(target)) {
        return;
      }
      // Clicking another step re-anchors the card — let the node handle it.
      if (
        target.closest(`[data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}]`)
      ) {
        return;
      }
      exitStepSettings();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exitStepSettings();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exitStepSettings, containerRef]);

  if (
    rightSidebar !== RightSideBarType.PIECE_SETTINGS ||
    isNil(selectedStepName)
  ) {
    return null;
  }
  const step = flowStructureUtil.getStep(selectedStepName, flowVersion.trigger);
  const node = getNode(selectedStepName);
  const container = containerRef.current;
  if (isNil(step) || isNil(node) || isNil(container)) {
    return null;
  }

  // Anchor + clamp entirely in client (viewport) coordinates so the card lives in a
  // fixed-position portal that physically cannot leave the screen. Bounds are the
  // canvas's real on-screen rectangle intersected with the viewport — never the
  // XYFlow store dims, which can drift from the visible area.
  const rect = container.getBoundingClientRect();
  const nodeWidth = node.width ?? flowCanvasConsts.AP_NODE_SIZE.STEP.width;
  const nodeTopLeft = flowToScreenPosition({
    x: node.position.x,
    y: node.position.y,
  });
  const nodeScreenRight = nodeTopLeft.x + nodeWidth * zoom;

  const boundsLeft = Math.max(rect.left, 0) + CARD_VIEWPORT_MARGIN;
  const boundsRight =
    Math.min(rect.right, window.innerWidth) - CARD_VIEWPORT_MARGIN;
  const boundsTop = Math.max(rect.top, 0) + CARD_VIEWPORT_MARGIN;
  const boundsBottom =
    Math.min(rect.bottom, window.innerHeight) - CARD_VIEWPORT_MARGIN;

  const cardWidth = Math.max(
    0,
    Math.min(PREVIEW_CARD_WIDTH, boundsRight - boundsLeft),
  );
  const maxHeight = Math.max(
    0,
    Math.min(CARD_MAX_HEIGHT, boundsBottom - boundsTop),
  );

  const fitsRight =
    nodeScreenRight + CARD_VIEWPORT_MARGIN + cardWidth <= boundsRight;
  const rawLeft = fitsRight
    ? nodeScreenRight + CARD_VIEWPORT_MARGIN
    : nodeTopLeft.x - CARD_VIEWPORT_MARGIN - cardWidth;
  const left = clamp(
    rawLeft,
    boundsLeft,
    Math.max(boundsLeft, boundsRight - cardWidth),
  );
  const top = clamp(
    nodeTopLeft.y,
    boundsTop,
    Math.max(boundsTop, boundsBottom - maxHeight),
  );

  return createPortal(
    <div
      ref={cardRef}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xl ease-[cubic-bezier(0.65,0,0.35,1)]',
        isExiting
          ? 'animate-out fade-out slide-out-to-right-8 fill-mode-forwards duration-[450ms]'
          : 'animate-in fade-in slide-in-from-left-1 duration-150',
      )}
      style={{ left, top, width: cardWidth, maxHeight }}
    >
      <StepPreviewCardBody step={step} />
    </div>,
    document.body,
  );
};

const StepPreviewCardBody = ({ step }: { step: Step }) => {
  const chatDock = useChatDockOptional();
  const isPieceStep =
    step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE;
  const { pieceModel } = piecesHooks.usePieceModelForStepSettings({
    name: step.settings.pieceName,
    version: step.settings.pieceVersion,
    enabled: isPieceStep,
  });

  return (
    <>
      <div className="min-h-0 flex-1">
        <StepPreviewSummary step={step} pieceModel={pieceModel} />
      </div>
      {chatDock && (
        <div className="shrink-0 border-t p-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full gap-2"
            onClick={() => chatDock.popOutChat({ teachDock: true })}
          >
            <PanelRightOpen className="size-3.5" />
            {t('Edit settings')}
          </Button>
        </div>
      )}
    </>
  );
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const PREVIEW_CARD_WIDTH = 360;
const CARD_VIEWPORT_MARGIN = 12;
const CARD_MAX_HEIGHT = 440;
