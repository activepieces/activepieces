import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { Viewport, useReactFlow } from '@xyflow/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePrevious } from 'react-use';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { DataSelector } from '@/app/builder/data-selector';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import {
  computeFitViewport,
  fitZoomFloorForTier,
  tweenViewport,
} from '@/app/builder/flow-canvas/canvas-controls/use-fit-to-view';
import { ApNode } from '@/app/builder/flow-canvas/utils/types';
import { StepSettingsProvider } from '@/app/builder/step-settings/step-settings-context';
import { RightSideBarType } from '@/app/builder/types';
import { useChatDockOptional } from '@/app/components/workspace-shell/chat-dock-context';
import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { ChatDrawer } from '@/app/routes/chat/chat-drawer';
import { ShowPoweredBy } from '@/components/custom/show-powered-by';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { useElementSize } from '@/hooks/use-element-size';
import {
  STAGE_TRANSITION_EASING,
  STAGE_TRANSITION_MS,
  easeStageTransition,
} from '@/lib/ui-transitions';
import { cn } from '@/lib/utils';

import { BuilderHeader } from './builder-header/builder-header';
import { FlowCanvas } from './flow-canvas';
import { flowCanvasHooks } from './flow-canvas/hooks';
import { BuilderBanner } from './flow-canvas/widgets/builder-banner';
import { FlowVersionsList } from './flow-versions';
import { RunsList } from './run-list';
import { CursorPositionProvider } from './state/cursor-position-context';
import { StepSettingsContainer } from './step-settings';
import { useReportFlowFocus } from './use-report-flow-focus';

const SIDEBAR_OPEN_FRACTION = 0.25;
const SIDEBAR_MAX_FRACTION = 0.6;
const SIDEBAR_MIN_PX = 400;
const SIDEBAR_OPEN_WIDTH = `clamp(${SIDEBAR_MIN_PX}px, ${
  SIDEBAR_OPEN_FRACTION * 100
}%, ${SIDEBAR_MAX_FRACTION * 100}%)`;
// Ignore sub-pixel/reflow jitter; only a real resize earns a re-centre.
const STAGE_RESIZE_REFIT_EPSILON_PX = 8;

const BuilderPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [
    flowVersion,
    rightSidebar,
    setRightSidebar,
    selectedStepName,
    removeAllStepTestsListeners,
    selectedStep,
    canvasOrientation,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.rightSidebar,
    state.setRightSidebar,
    state.selectedStep,
    state.removeAllStepTestsListeners,
    flowStructureUtil.getStep(
      state.selectedStep ?? '',
      state.flowVersion.trigger,
    ),
    state.canvasOrientation,
  ]);
  const { getNodes, getViewport, setViewport } = useReactFlow<ApNode>();
  const stageTier = useStageOptional()?.stageTier ?? 'comfortable';
  useReportFlowFocus();
  useEffect(() => {
    return () => {
      removeAllStepTestsListeners();
    };
  }, [removeAllStepTestsListeners]);
  flowCanvasHooks.useShowBuilderIsSavingWarningBeforeLeaving();
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const middlePanelSize = useElementSize(middlePanelRef);

  // Step editor is a floating card while the chat is docked, and the classic
  // right sidebar once the chat pops out (or when there's no chat at all).
  const chatDock = useChatDockOptional();
  const chatDockedVisible =
    !!chatDock && !chatDock.chatPopped && !chatDock.chatCollapsed;
  const isStepEditorOpen =
    rightSidebar === RightSideBarType.PIECE_SETTINGS && !!selectedStep;
  const showCardEditor = isStepEditorOpen && chatDockedVisible;
  const showSidebarEditor = isStepEditorOpen && !chatDockedVisible;
  const isAuxSidebar =
    rightSidebar === RightSideBarType.RUNS ||
    rightSidebar === RightSideBarType.VERSIONS;
  const isRightPanelOpen = showSidebarEditor || isAuxSidebar;

  // Aux sidebars (runs, versions) can't coexist with the docked chat; resolve by
  // direction. autoPoppedRef tracks OUR pop-out so a manual one is never re-docked.
  const autoPoppedRef = useRef(false);
  const wasAuxSidebar = usePrevious(isAuxSidebar);
  const wasChatDockedVisible = usePrevious(chatDockedVisible);
  useEffect(() => {
    if (!chatDock) {
      return;
    }
    // Aux sidebar opened while docked → pop the chat out, remember it.
    if (isAuxSidebar && !wasAuxSidebar && chatDockedVisible) {
      chatDock.popOutChat({ teachDock: true });
      autoPoppedRef.current = true;
      return;
    }
    // Chat docked while an aux sidebar is open → close the sidebar.
    if (chatDockedVisible && !wasChatDockedVisible && isAuxSidebar) {
      setRightSidebar(RightSideBarType.NONE);
      autoPoppedRef.current = false;
      return;
    }
    // Aux sidebar closed after we auto-popped → re-dock.
    if (!isAuxSidebar && wasAuxSidebar && autoPoppedRef.current) {
      autoPoppedRef.current = false;
      chatDock.dockChat();
    }
  }, [
    isAuxSidebar,
    wasAuxSidebar,
    chatDockedVisible,
    wasChatDockedVisible,
    chatDock,
    setRightSidebar,
  ]);

  // Delay the card only on a dock-back (sidebar → card), where the full layout
  // morph runs; a plain step-click while docked shows it at once.
  const wasRightPanelOpen = usePrevious(isRightPanelOpen);
  const [cardEntered, setCardEntered] = useState(showCardEditor);
  useEffect(() => {
    if (!showCardEditor) {
      setCardEntered(false);
      return;
    }
    if (wasRightPanelOpen) {
      const id = window.setTimeout(
        () => setCardEntered(true),
        STAGE_TRANSITION_MS,
      );
      return () => window.clearTimeout(id);
    }
    setCardEntered(true);
  }, [showCardEditor, wasRightPanelOpen]);

  const builderSplitRef = useRef<HTMLDivElement>(null);
  const sidebarDrawerRef = useRef<HTMLDivElement>(null);

  // User-chosen sidebar width (px), persisted; null = use the default clamp width.
  const [userSidebarWidth, setUserSidebarWidth] = useState<number | null>(
    readStoredSidebarWidth,
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{
    pointerX: number;
    startWidth: number;
  } | null>(null);

  const startSidebarResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const drawer = sidebarDrawerRef.current;
    if (!drawer) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStartRef.current = {
      pointerX: e.clientX,
      startWidth: drawer.getBoundingClientRect().width,
    };
    setIsResizing(true);
  };

  const moveSidebarResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = resizeStartRef.current;
    const drawer = sidebarDrawerRef.current;
    const container = builderSplitRef.current;
    if (!start || !drawer || !container) return;
    const groupWidth = container.getBoundingClientRect().width;
    const width = clampSidebarWidth({
      widthPx: start.startWidth + (start.pointerX - e.clientX),
      groupWidth,
    });
    drawer.style.width = `${width}px`;
  };

  const endSidebarResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = resizeStartRef.current;
    const drawer = sidebarDrawerRef.current;
    if (!start || !drawer) return;
    resizeStartRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsResizing(false);
    const width = drawer.getBoundingClientRect().width;
    setUserSidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
  };

  const {
    pieceModel,
    isNotFound: pieceModelNotFound,
    refetch: refetchPiece,
  } = piecesHooks.usePieceModelForStepSettings({
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

  // Read orientation/tier fresh at fire time via this ref, so the settle stays
  // scoped to the editor toggle and never re-fires on a bare tier/orientation change.
  const settleParamsRef = useRef({
    canvasOrientation,
    stageTier,
    userSidebarWidth,
  });
  settleParamsRef.current = { canvasOrientation, stageTier, userSidebarWidth };

  // Keep content mounted through the closing transition so it slides out.
  const [panelRendered, setPanelRendered] = useState(isRightPanelOpen);
  useEffect(() => {
    if (isRightPanelOpen) {
      setPanelRendered(true);
      return;
    }
    const id = window.setTimeout(
      () => setPanelRendered(false),
      STAGE_TRANSITION_MS + 50,
    );
    return () => window.clearTimeout(id);
  }, [isRightPanelOpen]);

  // Glide the flow viewport to its new fitted centre on the same curve as the CSS
  // width transition. Read the start viewport on the SECOND frame: the anchor's
  // ResizeObserver hold runs after rAF, so frame two starts from the held position
  // instead of teleporting. Keyed on the stage's usable width changing.
  useLayoutEffect(() => {
    if (!hasCanvasBeenInitialised) return;
    const container = builderSplitRef.current;
    const el = middlePanelRef.current;
    if (!container || !el) return;

    const groupWidth = container.getBoundingClientRect().width;
    const sidebarPx = isRightPanelOpen
      ? clampSidebarWidth({
          widthPx:
            settleParamsRef.current.userSidebarWidth ??
            groupWidth * SIDEBAR_OPEN_FRACTION,
          groupWidth,
        })
      : 0;
    const targetViewport = computeFitViewport({
      nodes: getNodes(),
      canvasWidth: groupWidth - sidebarPx,
      canvasHeight: el.getBoundingClientRect().height,
      orientation: settleParamsRef.current.canvasOrientation,
      zoomFloor: fitZoomFloorForTier(settleParamsRef.current.stageTier),
    });
    if (!targetViewport) return;

    let raf = 0;
    let startTime: number | null = null;
    let frames = 0;
    let startViewport: Viewport | null = null;
    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
      }
      const progress = Math.min((now - startTime) / STAGE_TRANSITION_MS, 1);
      const eased = easeStageTransition(progress);
      frames += 1;
      if (startViewport === null && frames >= 2) {
        startViewport = getViewport();
      }
      if (startViewport) {
        setViewport({
          x: startViewport.x + (targetViewport.x - startViewport.x) * eased,
          y: startViewport.y + (targetViewport.y - startViewport.y) * eased,
          zoom:
            startViewport.zoom +
            (targetViewport.zoom - startViewport.zoom) * eased,
        });
      }
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [
    isRightPanelOpen,
    chatDockedVisible,
    hasCanvasBeenInitialised,
    getNodes,
    getViewport,
    setViewport,
  ]);

  // The Stage can be resized outside the builder (flow opens, or divider drag),
  // changing canvas width without touching the deps above. `middlePanelSize` is a
  // debounced ResizeObserver (fires once width settles); re-fit on a real change,
  // skipping the first measurement so the initial-mount fit stays in charge.
  const prevMiddleWidthRef = useRef(0);
  useEffect(() => {
    if (!hasCanvasBeenInitialised) return;
    const width = middlePanelSize.width;
    const height = middlePanelSize.height;
    if (width <= 0 || height <= 0) return;
    const prev = prevMiddleWidthRef.current;
    prevMiddleWidthRef.current = width;
    if (prev === 0) return;
    if (Math.abs(width - prev) < STAGE_RESIZE_REFIT_EPSILON_PX) return;
    const target = computeFitViewport({
      nodes: getNodes(),
      canvasWidth: width,
      canvasHeight: height,
      orientation: settleParamsRef.current.canvasOrientation,
      zoomFloor: fitZoomFloorForTier(settleParamsRef.current.stageTier),
    });
    if (!target) return;
    return tweenViewport({
      getViewport,
      setViewport,
      target,
      durationMs: STAGE_TRANSITION_MS,
    });
  }, [
    middlePanelSize.width,
    middlePanelSize.height,
    hasCanvasBeenInitialised,
    getNodes,
    getViewport,
    setViewport,
  ]);

  const settingsEditor =
    isStepEditorOpen && selectedStep ? (
      <StepSettingsProvider
        pieceModel={pieceModel}
        pieceModelNotFound={pieceModelNotFound}
        selectedStep={selectedStep}
        key={constructContainerKey({
          flowVersionId: flowVersion.id,
          step: selectedStep,
          hasPieceModelLoaded: !!pieceModel,
        })}
      >
        <StepSettingsContainer />
      </StepSettingsProvider>
    ) : null;

  return (
    <div className="flex h-full w-full flex-col relative max-h-[100vh]">
      <div className="z-40">
        <BuilderHeader />
      </div>
      <div ref={builderSplitRef} className="flex h-full w-full min-h-0">
        <div ref={middlePanelRef} className="relative h-full min-w-0 flex-1">
          <CursorPositionProvider>
            <FlowCanvas
              setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
              showStepCard={cardEntered}
            ></FlowCanvas>
          </CursorPositionProvider>

          <BuilderBanner />
          {middlePanelRef.current && middlePanelRef.current.clientWidth > 0 && (
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

        {/* The sidebar opens as a drawer: the browser animates its WIDTH with a
            native CSS transition (smooth, sub-pixel — not stepped per frame), and
            the flow flex-shrinks to match. overflow-hidden clips the content,
            which holds a fixed min width so it slides into view from the right
            edge rather than reflowing as the drawer widens. */}
        <div
          ref={sidebarDrawerRef}
          className="relative z-30 h-full shrink-0 overflow-hidden"
          style={{
            width: isRightPanelOpen
              ? userSidebarWidth !== null
                ? `${userSidebarWidth}px`
                : SIDEBAR_OPEN_WIDTH
              : '0px',
            maxWidth: `${SIDEBAR_MAX_FRACTION * 100}%`,
            transition: isResizing
              ? 'none'
              : `width ${STAGE_TRANSITION_MS}ms ${STAGE_TRANSITION_EASING}`,
          }}
        >
          {panelRendered && (
            <div
              key={rightSidebar}
              className="absolute inset-y-0 left-0 flex h-full w-full min-w-[400px] flex-col border-l bg-background"
            >
              {/* Drag the left edge to resize the sidebar. The handle straddles
                  the canvas↔sidebar border; pointer capture keeps the drag alive
                  past the strip, and the width is committed on release. */}
              {isRightPanelOpen && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  onPointerDown={startSidebarResize}
                  onPointerMove={moveSidebarResize}
                  onPointerUp={endSidebarResize}
                  onPointerCancel={endSidebarResize}
                  className={cn(
                    'absolute inset-y-0 left-0 z-40 w-1.5 touch-none cursor-ew-resize',
                    'after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-transparent hover:after:bg-primary/50',
                    isResizing && 'after:bg-primary/50',
                  )}
                />
              )}
              {rightSidebar === RightSideBarType.PIECE_SETTINGS &&
                settingsEditor}
              {rightSidebar === RightSideBarType.RUNS && <RunsList />}
              {rightSidebar === RightSideBarType.VERSIONS && (
                <FlowVersionsList />
              )}
            </div>
          )}
        </div>
      </div>

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
  // Re-render the settings form on skip so later edits reach the update request.
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

function readStoredSidebarWidth(): number | null {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clampSidebarWidth({
  widthPx,
  groupWidth,
}: {
  widthPx: number;
  groupWidth: number;
}): number {
  return Math.min(
    Math.max(widthPx, SIDEBAR_MIN_PX),
    groupWidth * SIDEBAR_MAX_FRACTION,
  );
}

const SIDEBAR_WIDTH_STORAGE_KEY = 'builder-right-sidebar-width';
