import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PanelImperativeHandle } from 'react-resizable-panels';
import { usePrevious } from 'react-use';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { DataSelector } from '@/app/builder/data-selector';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { StepSettingsProvider } from '@/app/builder/step-settings/step-settings-context';
import { RightSideBarType } from '@/app/builder/types';
import { ChatDrawer } from '@/app/routes/chat/chat-drawer';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { useElementSize } from '@/hooks/use-element-size';
import { cn } from '@/lib/utils';

import { BuilderHeader } from './builder-header/builder-header';
import { FlowCanvas } from './flow-canvas';
import { flowCanvasHooks } from './flow-canvas/hooks';
import { flowCanvasConsts } from './flow-canvas/utils/consts';
import { BuilderBanner } from './flow-canvas/widgets/builder-banner';
import { FlowVersionsList } from './flow-versions';
import { RunsList } from './run-list';
import { CursorPositionProvider } from './state/cursor-position-context';
import { StepSettingsContainer } from './step-settings';
const animateResizeClassName = `transition-all `;

const SPLIT_MODE_INITIAL_OPEN_SIZE_PX = 1000;
const SPLIT_MODE_SIDEBAR_SIZE_PX = 850;
const DEFAULT_SIDEBAR_SIZE = '25%';
const DEFAULT_MIN_SIZE = '400px';
const SPLIT_MODE_COLLAPSE_THRESHOLD_PX = 700;

const BuilderPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [
    flowVersion,
    rightSidebar,
    selectedStepName,
    removeAllStepTestsListeners,
    selectedStep,
    testPanelView,
    isTestPanelOpen,
    setTestPanelView,
    setTestPanelOpen,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.rightSidebar,
    state.selectedStep,
    state.removeAllStepTestsListeners,
    flowStructureUtil.getStep(
      state.selectedStep ?? '',
      state.flowVersion.trigger,
    ),
    state.testPanelView,
    state.isTestPanelOpen,
    state.setTestPanelView,
    state.setTestPanelOpen,
  ]);
  useEffect(() => {
    return () => {
      removeAllStepTestsListeners();
    };
  }, [removeAllStepTestsListeners]);
  flowCanvasHooks.useShowBuilderIsSavingWarningBeforeLeaving();
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const middlePanelSize = useElementSize(middlePanelRef);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  useEffect(() => {
    const handlePointerUp = () => setIsDraggingHandle(false);
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);
  const isSplitForPiece =
    rightSidebar === RightSideBarType.PIECE_SETTINGS &&
    testPanelView === 'split' &&
    isTestPanelOpen;
  const prefersSplitLayout =
    rightSidebar === RightSideBarType.PIECE_SETTINGS &&
    testPanelView === 'split';

  const rightHandleRef = useRef<PanelImperativeHandle>(null);
  const rightSidePanelRef = useRef<HTMLDivElement>(null);
  const previousRightSidebar = usePrevious(rightSidebar);

  useLayoutEffect(() => {
    const handle = rightHandleRef.current;
    if (!handle) return;
    if (rightSidebar === RightSideBarType.NONE) {
      handle.resize('0%');
      return;
    }
    const isInitialOpen = previousRightSidebar === RightSideBarType.NONE;
    const targetSize = prefersSplitLayout
      ? isInitialOpen
        ? SPLIT_MODE_INITIAL_OPEN_SIZE_PX
        : SPLIT_MODE_SIDEBAR_SIZE_PX
      : DEFAULT_SIDEBAR_SIZE;
    handle.resize(targetSize);
    const rafId = window.requestAnimationFrame(() => handle.resize(targetSize));
    return () => window.cancelAnimationFrame(rafId);
  }, [prefersSplitLayout, previousRightSidebar, rightSidebar]);

  useEffect(() => {
    if (!isSplitForPiece || !isDraggingHandle) return;
    const el = rightSidePanelRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0 && width < SPLIT_MODE_COLLAPSE_THRESHOLD_PX) {
        setTestPanelView('drawer');
        setTestPanelOpen(false);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSplitForPiece, isDraggingHandle, setTestPanelView, setTestPanelOpen]);
  const { pieceModel, refetch: refetchPiece } =
    piecesHooks.usePieceModelForStepSettings({
      name: selectedStep?.settings.pieceName,
      version: selectedStep?.settings.pieceVersion,
      enabled:
        selectedStep?.type === FlowActionType.PIECE ||
        selectedStep?.type === FlowTriggerType.PIECE,
    });
  flowCanvasHooks.useSetSocketListener(refetchPiece);
  flowCanvasHooks.useListenToExistingRun();

  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    useState(false);

  return (
    <div className="flex h-full w-full flex-col relative max-h-[100vh]">
      <div className="z-40">
        <BuilderHeader />
      </div>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="100%" id="flow-canvas">
          <div ref={middlePanelRef} className="relative h-full w-full">
            <CursorPositionProvider>
              <FlowCanvas
                setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
              ></FlowCanvas>
            </CursorPositionProvider>

            <BuilderBanner />
            {middlePanelRef.current &&
              middlePanelRef.current.clientWidth > 0 && (
                <CanvasControls
                  canvasHeight={middlePanelRef.current?.clientHeight ?? 0}
                  canvasWidth={middlePanelRef.current?.clientWidth ?? 0}
                  hasCanvasBeenInitialised={hasCanvasBeenInitialised}
                  selectedStep={selectedStepName}
                ></CanvasControls>
              )}

            <ShowPoweredBy
              position="absolute"
              show={platform?.plan.showPoweredBy}
            />
            <DataSelector
              parentHeight={middlePanelSize.height}
              parentWidth={middlePanelSize.width}
            ></DataSelector>
          </div>
        </ResizablePanel>

        <ResizableHandle
          disabled={rightSidebar === RightSideBarType.NONE}
          withHandle={rightSidebar !== RightSideBarType.NONE}
          onPointerDown={() => setIsDraggingHandle(true)}
          className={
            rightSidebar === RightSideBarType.NONE ? 'bg-transparent' : ''
          }
        />

        <ResizablePanel
          panelRef={rightHandleRef}
          id="right-sidebar"
          collapsedSize="0%"
          defaultSize="0%"
          minSize={
            rightSidebar === RightSideBarType.NONE ? '0%' : DEFAULT_MIN_SIZE
          }
          maxSize={
            rightSidebar === RightSideBarType.NONE
              ? '0%'
              : prefersSplitLayout
              ? '95%'
              : '60%'
          }
          className={cn('min-w-0 bg-background z-30', {
            [animateResizeClassName]: !isDraggingHandle,
          })}
          style={{
            transitionDuration: `${
              isDraggingHandle ? 0 : flowCanvasConsts.SIDEBAR_ANIMATION_DURATION
            }ms`,
          }}
        >
          <div ref={rightSidePanelRef} className="h-full w-full">
            {rightSidebar === RightSideBarType.PIECE_SETTINGS &&
              selectedStep && (
                <StepSettingsProvider
                  pieceModel={pieceModel}
                  selectedStep={selectedStep}
                  key={constructContainerKey({
                    flowVersionId: flowVersion.id,
                    step: selectedStep,
                    hasPieceModelLoaded: !!pieceModel,
                  })}
                >
                  <StepSettingsContainer />
                </StepSettingsProvider>
              )}
            {rightSidebar === RightSideBarType.RUNS && <RunsList />}
            {rightSidebar === RightSideBarType.VERSIONS && <FlowVersionsList />}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <ChatDrawer />
    </div>
  );
};

BuilderPage.displayName = 'BuilderPage';
export { BuilderPage };

function constructContainerKey({
  flowVersionId,
  step,
  hasPieceModelLoaded,
}: {
  flowVersionId: string;
  step?: FlowAction | FlowTrigger;
  hasPieceModelLoaded: boolean;
}) {
  const stepName = step?.name;
  const triggerOrActionName =
    step?.type === FlowTriggerType.PIECE
      ? step?.settings.triggerName
      : step?.settings.actionName;
  const pieceName =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step?.settings.pieceName
      : undefined;
  const pieceVersion =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step?.settings.pieceVersion
      : undefined;
  //we need to re-render the step settings form when the step is skipped, so when the user edits the settings after setting it to skipped the changes are reflected in the update request
  const isSkipped =
    step?.type != FlowTriggerType.EMPTY &&
    step?.type != FlowTriggerType.PIECE &&
    step?.skip;
  return `${flowVersionId}-${stepName ?? ''}-${triggerOrActionName ?? ''}-${
    pieceName ?? ''
  }-${pieceVersion ?? ''}-${'skipped-' + !!isSkipped}-${
    hasPieceModelLoaded ? 'loaded' : 'not-loaded'
  }`;
}
