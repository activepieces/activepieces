import {
  ReactFlow,
  Background,
  SelectionMode,
  OnSelectionChangeParams,
  useStoreApi,
  PanOnScrollMode,
  useKeyPress,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  ActionType,
  flowStructureUtil,
  FlowVersion,
  isNil,
  Step,
} from '@activepieces/shared';

import {
  doesSelectionRectangleExist,
  NODE_SELECTION_RECT_CLASS_NAME,
  useBuilderStateContext,
  useFocusedFailedStep,
  useHandleKeyPressOnCanvas,
  useResizeCanvas,
} from '../builder-hooks';

import {
  CanvasContextMenu,
  ContextMenuType,
} from './context-menu/canvas-context-menu';
import { FlowDragLayer } from './flow-drag-layer';
import {
  flowUtilConsts,
  SELECTION_RECT_CHEVRON_ATTRIBUTE,
  STEP_CONTEXT_MENU_ATTRIBUTE,
} from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { AboveFlowWidgets } from './widgets';
import { useShowChevronNextToSelection } from './widgets/selection-chevron-button';

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
      const branchesNames =
        step.type === ActionType.ROUTER
          ? step.settings.branches.map((branch) => branch.branchName).join('-')
          : '0';
      const childrenKey = getChildrenKey(step);
      return `${acc}-${step.displayName}-${step.type}-${
        step.nextAction ? step.nextAction.name : ''
      }-${
        step.type === ActionType.PIECE ? step.settings.pieceName : ''
      }-${branchesNames}-${childrenKey}`;
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
      flowVersion,
      readonly,
      setSelectedNodes,
      selectedNodes,
      applyOperation,
      selectedStep,
      exitStepSettings,
      panningMode,
      setPieceSelectorStep,
      selectStepByName,
    ] = useBuilderStateContext((state) => {
      return [
        state.flowVersion,
        state.readonly,
        state.setSelectedNodes,
        state.selectedNodes,
        state.applyOperation,
        state.selectedStep,
        state.exitStepSettings,
        state.panningMode,
        state.setPieceSelectorStep,
        state.selectStepByName,
      ];
    });
    const containerRef = useRef<HTMLDivElement>(null);

    useShowChevronNextToSelection();
    useFocusedFailedStep();
    useHandleKeyPressOnCanvas();
    useResizeCanvas(containerRef, setHasCanvasBeenInitialised);
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
            `[data-${STEP_CONTEXT_MENU_ATTRIBUTE}]`,
          );
          const stepName = stepElement?.getAttribute(
            `data-${STEP_CONTEXT_MENU_ATTRIBUTE}`,
          );

          if (stepElement && stepName) {
            selectStepByName(stepName);
            storeApi.getState().addSelectedNodes([stepName]);
          }
          const targetIsSelectionChevron = ev.target.closest(
            `[data-${SELECTION_RECT_CHEVRON_ATTRIBUTE}]`,
          );
          const targetIsSelectionRect = ev.target.classList.contains(
            NODE_SELECTION_RECT_CLASS_NAME,
          );
          if (
            stepElement ||
            targetIsSelectionRect ||
            targetIsSelectionChevron
          ) {
            setContextMenuType(ContextMenuType.STEP);
          } else {
            setContextMenuType(ContextMenuType.CANVAS);
          }
          if (
            doesSelectionRectangleExist() &&
            !targetIsSelectionRect &&
            !targetIsSelectionChevron
          ) {
            document
              .querySelector(`.${NODE_SELECTION_RECT_CLASS_NAME}`)
              ?.remove();
          }
        }
      },
      [setSelectedNodes, selectedNodes, doesSelectionRectangleExist],
    );

    const onSelectionEnd = useCallback(() => {
      if (
        !storeApi.getState().userSelectionActive ||
        doesSelectionRectangleExist()
      ) {
        return;
      }
      const selectedSteps = selectedNodes.map((node) =>
        flowStructureUtil.getStepOrThrow(node, flowVersion.trigger),
      );
      selectedSteps.forEach((step) => {
        if (
          step.type === ActionType.LOOP_ON_ITEMS ||
          step.type === ActionType.ROUTER
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
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    return (
      <div
        ref={containerRef}
        className="size-full relative overflow-hidden z-50"
      >
        <FlowDragLayer
          cursorPosition={cursorPosition}
          lefSideBarContainerWidth={lefSideBarContainerWidth}
        >
          <CanvasContextMenu
            selectedNodes={selectedNodes}
            applyOperation={applyOperation}
            selectedStep={selectedStep}
            exitStepSettings={exitStepSettings}
            flowVersion={flowVersion}
            readonly={readonly}
            setPieceSelectorStep={setPieceSelectorStep}
            contextMenuType={contextMenuType}
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
              panOnDrag={inGrabPanningMode ? [0, 1] : [1]}
              zoomOnDoubleClick={false}
              panOnScroll={true}
              panOnScrollMode={PanOnScrollMode.Free}
              fitView={false}
              nodesConnectable={false}
              elementsSelectable={true}
              nodesDraggable={false}
              nodesFocusable={false}
              onNodeDrag={(event) => {
                setCursorPosition({ x: event.clientX, y: event.clientY });
              }}
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
