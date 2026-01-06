import {
  ReactFlow,
  Background,
  SelectionMode,
  OnSelectionChangeParams,
  useStoreApi,
  PanOnScrollMode,
  useKeyPress,
  BackgroundVariant,
  getNodesBounds,
  CoordinateExtent,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { RightSideBarType } from '@/lib/types';
import {
  FlowActionType,
  flowStructureUtil,
  FlowVersion,
  isNil,
  Step,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { useHandleKeyPressOnCanvas } from '../shortcuts';
import { useCursorPosition } from '../state/cursor-position-context';

import {
  CanvasContextMenu,
  ContextMenuType,
} from './context-menu/canvas-context-menu';
import { FlowDragLayer } from './flow-drag-layer';
import { flowCanvasHooks } from './hooks';
import { flowCanvasConsts } from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { AboveFlowWidgets } from './widgets';
import Minimap from './widgets/minimap';
import { useShowChevronNextToSelection } from './widgets/selection-chevron-button';

export const FlowCanvas = React.memo(
  ({
    setHasCanvasBeenInitialised,
  }: {
    setHasCanvasBeenInitialised: (value: boolean) => void;
  }) => {
    const [
      flowVersion,
      setSelectedNodes,
      selectedNodes,
      selectedStep,
      panningMode,
      selectStepByName,
      rightSidebar,
    ] = useBuilderStateContext((state) => {
      return [
        state.flowVersion,
        state.setSelectedNodes,
        state.selectedNodes,
        state.selectedStep,
        state.panningMode,
        state.selectStepByName,
        state.rightSidebar,
      ];
    });
    const containerRef = useRef<HTMLDivElement>(null);
    useShowChevronNextToSelection();
    flowCanvasHooks.useFocusOnStep();
    useHandleKeyPressOnCanvas();
    flowCanvasHooks.useResizeCanvas(containerRef, setHasCanvasBeenInitialised);
    const storeApi = useStoreApi();
    const isShiftKeyPressed = useKeyPress('Shift');
    const inGrabPanningMode = !isShiftKeyPressed && panningMode === 'grab';
    const onSelectionChange = useCallback(
      (ev: OnSelectionChangeParams) => {
        const selectedNodes = ev.nodes.map((n) => n.id);
        if (selectedNodes.length === 0 && selectedStep) {
          selectedNodes.push(selectedStep);
        }
        setSelectedNodes(selectedNodes);
      },
      [setSelectedNodes, selectedStep],
    );
    const graphKey = createGraphKey(flowVersion);
    const graph = useMemo(() => {
      return flowCanvasUtils.convertFlowVersionToGraph(flowVersion);
    }, [graphKey]);
    const [contextMenuType, setContextMenuType] = useState<ContextMenuType>(
      ContextMenuType.CANVAS,
    );
    const onContextMenu = useCallback(
      (ev: React.MouseEvent<HTMLDivElement>) => {
        if (
          ev.target instanceof HTMLElement ||
          ev.target instanceof SVGElement
        ) {
          const stepElement = ev.target.closest(
            `[data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}]`,
          );
          const stepName = stepElement?.getAttribute(
            `data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}`,
          );

          if (stepElement && stepName) {
            selectStepByName(stepName);
            storeApi.getState().addSelectedNodes([stepName]);
          }
          const targetIsSelectionChevron = ev.target.closest(
            `[data-${flowCanvasConsts.SELECTION_RECT_CHEVRON_ATTRIBUTE}]`,
          );
          const targetIsSelectionRect = ev.target.classList.contains(
            flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME,
          );
          const showStepContextMenu =
            stepElement || targetIsSelectionRect || targetIsSelectionChevron;
          if (showStepContextMenu) {
            if (rightSidebar === RightSideBarType.NONE) {
              setTimeout(() => setContextMenuType(ContextMenuType.STEP), 10000);
            } else {
              setContextMenuType(ContextMenuType.STEP);
            }
          } else {
            setContextMenuType(ContextMenuType.CANVAS);
          }
          const shouldRemoveSelectionRect =
            !targetIsSelectionRect && !targetIsSelectionChevron;
          if (shouldRemoveSelectionRect) {
            document
              .querySelector(
                `.${flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME}`,
              )
              ?.remove();
          }
        }
      },
      [setSelectedNodes, selectedNodes, rightSidebar],
    );

    const onSelectionEnd = useCallback(() => {
      const selectedSteps = selectedNodes.map((node) =>
        flowStructureUtil.getStepOrThrow(node, flowVersion.trigger),
      );
      selectedSteps.forEach((step) => {
        if (
          step.type === FlowActionType.LOOP_ON_ITEMS ||
          step.type === FlowActionType.ROUTER
        ) {
          const childrenNotSelected = flowStructureUtil
            .getAllChildSteps(step)
            .filter((c) => isNil(selectedNodes.find((n) => n === c.name)));
          selectedSteps.push(...childrenNotSelected);
        }
      });
      const step = selectedStep
        ? flowStructureUtil.getStep(selectedStep, flowVersion.trigger)
        : null;
      if (selectedNodes.length === 0 && step) {
        selectedSteps.push(step);
      }
      storeApi
        .getState()
        .addSelectedNodes(selectedSteps.map((step) => step.name));
    }, [selectedNodes, storeApi, selectedStep]);

    const { setCursorPosition } = useCursorPosition();
    const translateExtent = useMemo(() => {
      const nodes = graph.nodes;
      const graphRectangle = getNodesBounds(nodes);
      const stepWidth = flowCanvasConsts.AP_NODE_SIZE.STEP.width;
      const start = {
        x: -graphRectangle.width - 5 * stepWidth,
        y: -graphRectangle.height,
      };
      const end = {
        x: 2.5 * graphRectangle.width + 5 * stepWidth,
        y: 2 * graphRectangle.height,
      };
      const extent: CoordinateExtent = [
        [start.x, start.y],
        [end.x, end.y],
      ];
      return extent;
    }, [graphKey]);
    return (
      <div
        ref={containerRef}
        className="size-full relative overflow-hidden z-30 bg-builder-background"
        onMouseMove={(event) => {
          const cursorPosition = { x: event.clientX, y: event.clientY };
          setCursorPosition(cursorPosition);
        }}
      >
        <FlowDragLayer>
          <CanvasContextMenu contextMenuType={contextMenuType}>
            <ReactFlow
              className="bg-builder-background"
              onContextMenu={onContextMenu}
              onPaneClick={() => {
                storeApi.getState().unselectNodesAndEdges();
              }}
              translateExtent={translateExtent}
              nodeTypes={flowCanvasConsts.nodeTypes}
              nodes={graph.nodes}
              edgeTypes={flowCanvasConsts.edgeTypes}
              edges={graph.edges}
              draggable={false}
              edgesFocusable={false}
              elevateEdgesOnSelect={false}
              maxZoom={1.5}
              minZoom={0.5}
              panOnDrag={inGrabPanningMode ? [0, 1] : [1]}
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
              <Background
                gap={10}
                size={1}
                variant={BackgroundVariant.Dots}
                bgColor={`var(--builder-background)`}
                color={`var(--builder-background-pattern)`}
              />
              <Minimap key={graphKey} />
            </ReactFlow>
          </CanvasContextMenu>
        </FlowDragLayer>
      </div>
    );
  },
);

FlowCanvas.displayName = 'FlowCanvas';
const getChildrenKey = (step: Step) => {
  switch (step.type) {
    case FlowActionType.LOOP_ON_ITEMS:
      return step.firstLoopAction ? step.firstLoopAction.name : '';
    case FlowActionType.ROUTER:
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
    case FlowActionType.CODE:
    case FlowActionType.PIECE:
      return '';
  }
};
const createGraphKey = (flowVersion: FlowVersion) => {
  return flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .reduce((acc, step) => {
      const branchesNames =
        step.type === FlowActionType.ROUTER
          ? step.settings.branches.map((branch) => branch.branchName).join('-')
          : '0';
      const childrenKey = getChildrenKey(step);
      return `${acc}-${step.displayName}-${step.type}-${
        step.nextAction ? step.nextAction.name : ''
      }-${
        step.type === FlowActionType.PIECE ? step.settings.pieceName : ''
      }-${branchesNames}-${childrenKey}}`;
    }, '');
};
