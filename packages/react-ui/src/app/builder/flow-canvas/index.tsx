import {
  ReactFlow,
  Background,
  useReactFlow,
  SelectionMode,
  OnSelectionChangeParams,
  useStoreApi,
  PanOnScrollMode,
  useKeyPress,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePrevious } from 'react-use';

import {
  Action,
  ActionType,
  flowStructureUtil,
  FlowVersion,
  isFlowStateTerminal,
  isNil,
  Step,
} from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import {
  isNodeSelectionActive,
  NODE_SELECTION_RECT_CLASS_NAME,
  useBuilderStateContext,
  useHandleKeyPressOnCanvas,
} from '../builder-hooks';

import { CanvasContextMenu } from './context-menu/canvas-context-menu';
import { FlowDragLayer } from './flow-drag-layer';
import { flowUtilConsts, STEP_CONTEXT_MENU_ATTRIBUTE } from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { AboveFlowWidgets } from './widgets';

const getChildrenKey = (step: Step) => {
  switch (step.type) {
    case ActionType.LOOP_ON_ITEMS:
      return step.firstLoopAction ? step.firstLoopAction.name : '';
    case ActionType.ROUTER:
      return step.children.reduce((routerKey, child) => {
        const childrenKey = child
          ? flowStructureUtil
              .getAllSteps(child)
              .reduce(
                (childKey, grandChild) => `${childKey}-${grandChild.name}`,
                '',
              )
          : 'null';
        return `${routerKey}-${childrenKey}`;
      }, '');
    case ActionType.CODE:
    case ActionType.PIECE:
      return '';
  }
};

const createGraphKey = (flowVersion: FlowVersion) => {
  return flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .reduce((acc, step) => {
      const branchesLength =
        step.type === ActionType.ROUTER ? step.settings.branches.length : 0;
      const childrenKey = getChildrenKey(step);
      return `${acc}-${step.displayName}-${step.type}-${
        step.nextAction ? step.nextAction.name : ''
      }-${
        step.type === ActionType.PIECE ? step.settings.pieceName : ''
      }-${branchesLength}-${childrenKey}`;
    }, '');
};

export const FlowCanvas = React.memo(
  ({
    setHasCanvasBeenInitialised,
    lefSideBarContainerWidth,
  }: {
    setHasCanvasBeenInitialised: (value: boolean) => void;
    lefSideBarContainerWidth: number;
  }) => {
    const [
      allowCanvasPanning,
      flowVersion,
      run,
      readonly,
      setSelectedNodes,
      selectedNodes,
      applyOperation,
      selectedStep,
      exitStepSettings,
      panningMode,
      setPieceSelectorStep,
    ] = useBuilderStateContext((state) => {
      return [
        state.allowCanvasPanning,
        state.flowVersion,
        state.run,
        state.readonly,
        state.setSelectedNodes,
        state.selectedNodes,
        state.applyOperation,
        state.selectedStep,
        state.exitStepSettings,
        state.panningMode,
        state.setPieceSelectorStep,
      ];
    });

    const previousRun = usePrevious(run);
    const { fitView, getViewport, setViewport } = useReactFlow();
    if (
      (run && previousRun?.id !== run.id && isFlowStateTerminal(run.status)) ||
      (run &&
        previousRun &&
        !isFlowStateTerminal(previousRun.status) &&
        isFlowStateTerminal(run.status))
    ) {
      const failedStep = run.steps
        ? flowRunUtils.findFailedStepInOutput(run.steps)
        : null;
      if (failedStep) {
        setTimeout(() => {
          fitView(flowCanvasUtils.createFocusStepInGraphParams(failedStep));
        });
      }
    }
    const containerRef = useRef<HTMLDivElement>(null);
    const containerSizeRef = useRef({
      width: 0,
      height: 0,
    });
    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;

        setHasCanvasBeenInitialised(true);
        const { x, y, zoom } = getViewport();

        if (containerRef.current && width !== containerSizeRef.current.width) {
          const newX = x + (width - containerSizeRef.current.width) / 2;
          // Update the viewport to keep content centered without affecting zoom
          setViewport({ x: newX, y, zoom });
        }
        // Adjust x/y values based on the new size and keep the same zoom level

        containerSizeRef.current = {
          width,
          height,
        };
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [setViewport, getViewport]);

    const onSelectionChange = useCallback(
      (ev: OnSelectionChangeParams) => {
        setSelectedNodes(ev.nodes.map((n) => n.id));
      },
      [setSelectedNodes],
    );
    const graphKey = createGraphKey(flowVersion);
    const graph = useMemo(() => {
      return flowCanvasUtils.convertFlowVersionToGraph(flowVersion);
    }, [graphKey]);
    const onContextMenu = useCallback(
      (ev: React.MouseEvent<HTMLDivElement>) => {
        if (
          ev.target instanceof HTMLElement ||
          ev.target instanceof SVGElement
        ) {
          const stepElement = ev.target.closest(
            `[data-${STEP_CONTEXT_MENU_ATTRIBUTE}]`,
          );
          const stepName = stepElement?.getAttribute(
            `data-${STEP_CONTEXT_MENU_ATTRIBUTE}`,
          );
          setSelectedNodes(
            isNodeSelectionActive() && !stepElement
              ? selectedNodes
              : stepName
              ? [stepName]
              : [],
          );
          if (isNodeSelectionActive() && stepElement) {
            document
              .querySelector(`.${NODE_SELECTION_RECT_CLASS_NAME}`)
              ?.remove();
          }
        }
      },
      [setSelectedNodes, selectedNodes],
    );

    const handleKeyDown = useHandleKeyPressOnCanvas();
    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    const storeApi = useStoreApi();
    const isShiftKeyPressed = useKeyPress('Shift');
    const inGrabPanningMode = !isShiftKeyPressed && panningMode === 'grab';

    const onSelectionEnd = useCallback(() => {
      const selectedSteps = selectedNodes.map((node) =>
        flowStructureUtil.getStepOrThrow(node, flowVersion.trigger),
      ) as Action[];
      selectedSteps.forEach((step) => {
        if (
          step.type === ActionType.LOOP_ON_ITEMS ||
          step.type === ActionType.ROUTER
        ) {
          const childrenNotSelected = flowStructureUtil
            .getAllChildSteps(step)
            .filter((c) =>
              isNil(selectedNodes.find((n) => n === c.name)),
            ) as Action[];
          selectedSteps.push(...childrenNotSelected);
        }
      });
      storeApi
        .getState()
        .addSelectedNodes(selectedSteps.map((step) => step.name));
      setSelectedNodes(selectedSteps.map((step) => step.name));
    }, [selectedNodes, storeApi, setSelectedNodes]);

    return (
      <div
        ref={containerRef}
        className="size-full relative overflow-hidden z-50"
      >
        <FlowDragLayer lefSideBarContainerWidth={lefSideBarContainerWidth}>
          <CanvasContextMenu
            selectedNodes={selectedNodes}
            applyOperation={applyOperation}
            selectedStep={selectedStep}
            exitStepSettings={exitStepSettings}
            flowVersion={flowVersion}
            readonly={readonly}
            setPieceSelectorStep={setPieceSelectorStep}
          >
            <ReactFlow
              onContextMenu={onContextMenu}
              onPaneClick={() => {
                storeApi.getState().unselectNodesAndEdges();
              }}
              nodeTypes={flowUtilConsts.nodeTypes}
              nodes={graph.nodes}
              edgeTypes={flowUtilConsts.edgeTypes}
              edges={graph.edges}
              draggable={false}
              edgesFocusable={false}
              elevateEdgesOnSelect={false}
              maxZoom={1.5}
              minZoom={0.5}
              panOnDrag={
                allowCanvasPanning ? (inGrabPanningMode ? [0, 1] : [1]) : false
              }
              zoomOnDoubleClick={false}
              panOnScroll={true}
              panOnScrollMode={PanOnScrollMode.Free}
              fitView={false}
              nodesConnectable={false}
              elementsSelectable={true}
              nodesDraggable={false}
              nodesFocusable={false}
              selectionKeyCode={inGrabPanningMode ? 'Shift' : null}
              multiSelectionKeyCode={inGrabPanningMode ? 'Shift' : null}
              selectionOnDrag={inGrabPanningMode ? false : true}
              selectNodesOnDrag={true}
              selectionMode={SelectionMode.Partial}
              onSelectionChange={onSelectionChange}
              onSelectionEnd={onSelectionEnd}
            >
              <AboveFlowWidgets></AboveFlowWidgets>
              <Background />
            </ReactFlow>
          </CanvasContextMenu>
        </FlowDragLayer>
      </div>
    );
  },
);

FlowCanvas.displayName = 'FlowCanvas';
