import { tryCatch } from '@activepieces/shared';
import { useKeyPress, useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import {
  Fullscreen,
  GalleryHorizontalEnd,
  GalleryVerticalEnd,
  Hand,
  ImageDown,
  LoaderCircle,
  Map,
  Minus,
  MousePointer,
  Plus,
  StickyNote,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Separator } from '@/components/ui/separator';
import { isMac } from '@/lib/dom-utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { NoteDragOverlayMode } from '../../state/notes-state';
import { flowCanvasConsts } from '../utils/consts';
import { flowScreenshotUtils } from '../utils/flow-screenshot-utils';

import { CanvasControlButton } from './canvas-control-button';
import { useFitToView } from './use-fit-to-view';

const CanvasControls = ({
  canvasWidth,
  canvasHeight,
  hasCanvasBeenInitialised,
  selectedStep,
}: {
  canvasWidth: number;
  canvasHeight: number;
  hasCanvasBeenInitialised: boolean;
  selectedStep: string | null;
}) => {
  const { zoomIn, zoomOut, getNodes } = useReactFlow();
  const { handleFitToView } = useFitToView({
    canvasWidth,
    canvasHeight,
    hasCanvasBeenInitialised,
    selectedStep,
  });

  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const [noteDragOverlayMode, setDraggedNote] = useBuilderStateContext(
    (state) => [state.noteDragOverlayMode, state.setDraggedNote],
  );
  const [
    setPanningMode,
    panningMode,
    showMinimap,
    setShowMinimap,
    readonly,
    setCanvasOrientation,
    flowDisplayName,
  ] = useBuilderStateContext((state) => {
    return [
      state.setPanningMode,
      state.panningMode,
      state.showMinimap,
      state.setShowMinimap,
      state.readonly,
      state.setCanvasOrientation,
      state.flowVersion.displayName,
    ];
  });

  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const handleDownloadFlowAsImage = async () => {
    setIsCapturingImage(true);
    const { error } = await tryCatch(() =>
      flowScreenshotUtils.downloadFlowAsImage({
        nodes: getNodes(),
        flowName: flowDisplayName,
      }),
    );
    if (error) {
      console.error(error);
      toast.error(t('Failed to capture the flow image'));
    }
    setIsCapturingImage(false);
  };

  const handleToggleOrientation = () => {
    const newOrientation =
      canvasOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    setCanvasOrientation(newOrientation);
    // the canvas remounts when the orientation changes, give it a frame to sync nodes before fitting
    setTimeout(
      () =>
        handleFitToView({
          isInitialRenderCall: false,
          orientation: newOrientation,
        }),
      100,
    );
  };

  const handleCreateNote = () => {
    setDraggedNote(
      {
        id: '',
        content: '',
        createdAt: '',
        updatedAt: '',
        position: { x: 0, y: 0 },
        size: {
          width: flowCanvasConsts.NOTE_CREATION_OVERLAY_WIDTH,
          height: flowCanvasConsts.NOTE_CREATION_OVERLAY_HEIGHT,
        },
        color: flowCanvasConsts.DEFAULT_NOTE_COLOR,
      },
      NoteDragOverlayMode.CREATE,
    );
  };

  const spacePressed = useKeyPress('Space');
  const shiftPressed = useKeyPress('Shift');
  const isInGrabMode =
    (spacePressed || panningMode === 'grab') && !shiftPressed;
  const isHorizontal = canvasOrientation === 'horizontal';

  return (
    <div
      id="canvas-controls"
      className="z-50 absolute bottom-2 left-0 flex items-center  w-full pointer-events-none "
    >
      <div className=" absolute flex ml-2 items-center justify-center p-1.5 pointer-events-auto rounded-lg bg-background border border-sidebar-border">
        <CanvasControlButton
          tooltip={t('Minimap' + (isMac() ? ' (⌘ + M)' : ' (Ctrl + M)'))}
          icon={Map}
          active={showMinimap}
          onClick={() => setShowMinimap(!showMinimap)}
        />
      </div>
      <div className="grow"></div>

      <div className="bg-background gap-2 flex items-center shadow-2xl justify-center border border-sidebar-border p-1.5 rounded-lg pointer-events-auto">
        <CanvasControlButton
          tooltip={t('Zoom in')}
          icon={Plus}
          onClick={() => zoomIn({ duration: 0 })}
        />
        <CanvasControlButton
          tooltip={t('Zoom out')}
          icon={Minus}
          onClick={() => zoomOut({ duration: 0 })}
        />
        <CanvasControlButton
          tooltip={t('Fit to view')}
          icon={Fullscreen}
          onClick={() => handleFitToView({ isInitialRenderCall: false })}
        />
        <CanvasControlButton
          tooltip={t('Download as image')}
          icon={isCapturingImage ? LoaderCircle : ImageDown}
          iconClassName={isCapturingImage ? 'animate-spin' : undefined}
          disabled={isCapturingImage}
          onClick={handleDownloadFlowAsImage}
        />
        <CanvasControlButton
          tooltip={isHorizontal ? t('Vertical layout') : t('Horizontal layout')}
          icon={isHorizontal ? GalleryVerticalEnd : GalleryHorizontalEnd}
          onClick={handleToggleOrientation}
        />
        <div>
          <Separator orientation="vertical" className="h-5"></Separator>
        </div>
        <CanvasControlButton
          tooltip={t('Grab mode')}
          icon={Hand}
          active={isInGrabMode}
          onClick={() => setPanningMode('grab')}
        />
        <CanvasControlButton
          tooltip={t('Select mode')}
          icon={MousePointer}
          active={!isInGrabMode}
          onClick={() => setPanningMode('pan')}
        />
        {!readonly && (
          <CanvasControlButton
            tooltip={t('Add note')}
            icon={StickyNote}
            active={noteDragOverlayMode === NoteDragOverlayMode.CREATE}
            onClick={handleCreateNote}
          />
        )}
      </div>
      <div className="grow"></div>
    </div>
  );
};

export { CanvasControls };
