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
} from '@/app/builder/flow-canvas/canvas-controls/use-fit-to-view';
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
// The resting open width, animated by the browser's own width transition (smooth,
// sub-pixel) — clamp keeps it readable on a narrow stage and bounded on a wide one.
const SIDEBAR_OPEN_WIDTH = `clamp(${SIDEBAR_MIN_PX}px, ${
  SIDEBAR_OPEN_FRACTION * 100
}%, ${SIDEBAR_MAX_FRACTION * 100}%)`;

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
  const { getNodes, getViewport, setViewport } = useReactFlow();
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

  // The step-editing surface follows the chat panel's dock state: while the chat
  // is docked in the split, a step opens as a floating card on the canvas; once
  // the chat pops out (double-click a step or "Edit settings"), the stage gets
  // full width and the classic right-side settings sidebar opens. Re-docking the
  // chat flips it back to the card — derived, no explicit close. Outside the
  // workspace shell (embedded builder) there's no chat, so the sidebar is used.
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

  // Aux sidebars (runs, versions) have no docked-card form — they're always the
  // full sidebar, so they can't coexist with the docked chat. We resolve the
  // conflict by direction (which event just happened), tracking whether WE popped
  // the chat so a manual pop-out is never re-docked behind the user's back.
  const autoPoppedRef = useRef(false);
  const wasAuxSidebar = usePrevious(isAuxSidebar);
  const wasChatDockedVisible = usePrevious(chatDockedVisible);
  useEffect(() => {
    if (!chatDock) {
      return;
    }
    // Aux sidebar just opened while the chat was docked → pop the chat out
    // (sidebar wins) and remember we did it so we can re-dock on close.
    if (isAuxSidebar && !wasAuxSidebar && chatDockedVisible) {
      chatDock.popOutChat({ teachDock: true });
      autoPoppedRef.current = true;
      return;
    }
    // User docked the chat while an aux sidebar is open → don't resist; close the
    // sidebar so the dock isn't immediately re-popped by the branch above.
    if (chatDockedVisible && !wasChatDockedVisible && isAuxSidebar) {
      setRightSidebar(RightSideBarType.NONE);
      autoPoppedRef.current = false;
      return;
    }
    // Aux sidebar closed and we had auto-popped the chat for it → re-dock. Manual
    // pop-outs never set autoPoppedRef, so they stay floating.
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

  // Card presence is staged so it never appears mid-motion. On a fresh
  // step-click while docked there's no layout morph, so the card shows at once.
  // But docking the chat back (sidebar → card) runs the full morph — chat flies
  // home, sidebar collapses, flow re-centers — and the card must wait for that
  // to finish, otherwise it pops in out of sync. We detect the dock-back by the
  // right panel having just been open.
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

  // User-chosen sidebar width (px). null = "never dragged; use the default clamp
  // width". Stored in localStorage so the choice survives reloads. The drawer's
  // open/close is still animated by CSS width (below); a user width just overrides
  // the resting open width.
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

  // The settle reads orientation/tier fresh at fire time (via this ref) so it
  // stays scoped to the editor toggle — it must NOT re-fire when the tier or
  // orientation changes on their own (that's a window/divider resize, where the
  // anchor already holds the flow put and the user prefers no auto-recenter).
  const settleParamsRef = useRef({
    canvasOrientation,
    stageTier,
    userSidebarWidth,
  });
  settleParamsRef.current = { canvasOrientation, stageTier, userSidebarWidth };

  // Keep the sidebar content mounted through its closing width transition so it
  // slides out instead of vanishing; open shows it at once.
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

  // The sidebar's WIDTH is animated by the browser (a native CSS width transition
  // — smooth and sub-pixel), and the flow flex-shrinks to match. In lockstep we
  // glide the flow viewport to its new fitted centre on the same curve/duration,
  // so the whole thing reads as one motion. The start viewport is read on the
  // SECOND frame, not the first: when the chat docks/undocks the canvas's left
  // edge shifts and the anchor (useResizeCanvas) compensates via a ResizeObserver,
  // which the spec runs AFTER rAF callbacks — reading on frame two lets that hold
  // land so the glide starts from the held position instead of teleporting. Keyed
  // on the stage's usable width changing: the sidebar opening/closing, or the chat
  // leaving/entering the dock (which also covers aux sidebars popping it out).
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

  const settingsEditor =
    isStepEditorOpen && selectedStep ? (
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
