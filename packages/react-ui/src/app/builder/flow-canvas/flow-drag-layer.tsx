import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useViewport } from '@xyflow/react';
import { t } from 'i18next';
import { useCallback, useState } from 'react';

import { toast } from '@/components/ui/use-toast';
import {
  FlowOperationType,
  StepLocationRelativeToParent,
  flowStructureUtil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import StepDragOverlay from './step-drag-overlay';
import { ApButtonData } from './utils/types';

const FlowDragLayer = ({
  children,
  lefSideBarContainerWidth,
  cursorPosition,
}: {
  children: React.ReactNode;
  lefSideBarContainerWidth: number;
  cursorPosition: { x: number; y: number };
}) => {
  const viewport = useViewport();
  const [previousViewPort, setPreviousViewPort] = useState(viewport);
  const [
    setActiveDraggingStep,
    applyOperation,
    flowVersion,
    activeDraggingStep,
  ] = useBuilderStateContext((state) => [
    state.setActiveDraggingStep,
    state.applyOperation,
    state.flowVersion,
    state.activeDraggingStep,
  ]);

  const fixCursorSnapOffset = useCallback(
    (args: Parameters<typeof rectIntersection>[0]) => {
      // Bail out if keyboard activated
      if (!args.pointerCoordinates) {
        return rectIntersection(args);
      }
      const { x, y } = args.pointerCoordinates;
      const { width, height } = args.collisionRect;
      const deltaViewport = {
        x: previousViewPort.x - viewport.x,
        y: previousViewPort.y - viewport.y,
      };
      const updated = {
        ...args,
        // The collision rectangle is broken when using snapCenterToCursor. Reset
        // the collision rectangle based on pointer location and overlay size.
        collisionRect: {
          width,
          height,
          bottom: y + height / 2 + deltaViewport.y,
          left: x - width / 2 + deltaViewport.x,
          right: x + width / 2 + deltaViewport.x,
          top: y - height / 2 + deltaViewport.y,
        },
      };
      return rectIntersection(updated);
    },
    [viewport.x, viewport.y, previousViewPort.x, previousViewPort.y],
  );
  const draggedStep = activeDraggingStep
    ? flowStructureUtil.getStep(activeDraggingStep, flowVersion.trigger)
    : undefined;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDraggingStep(e.active.id.toString());
    setPreviousViewPort(viewport);
  };

  const handleDragCancel = () => {
    setActiveDraggingStep(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDraggingStep(null);
    if (
      e.over &&
      e.over.data.current &&
      e.over.data.current.accepts === e.active.data?.current?.type
    ) {
      const droppedAtNodeData: ApButtonData = e.over.data
        .current as ApButtonData;
      if (
        droppedAtNodeData &&
        droppedAtNodeData.parentStepName &&
        draggedStep &&
        draggedStep.name !== droppedAtNodeData.parentStepName
      ) {
        const isPartOfInnerFlow = flowStructureUtil.isChildOf(
          draggedStep,
          droppedAtNodeData.parentStepName,
        );
        if (isPartOfInnerFlow) {
          toast({
            title: t('Invalid Move'),
            description: t(
              'The destination location is a child of the dragged step',
            ),
            duration: 3000,
          });
          return;
        }
        applyOperation({
          type: FlowOperationType.MOVE_ACTION,
          request: {
            name: draggedStep.name,
            newParentStep: droppedAtNodeData.parentStepName,
            stepLocationRelativeToNewParent:
              droppedAtNodeData.stepLocationRelativeToParent,
            branchIndex:
              droppedAtNodeData.stepLocationRelativeToParent ===
              StepLocationRelativeToParent.INSIDE_BRANCH
                ? droppedAtNodeData.branchIndex
                : undefined,
          },
        });
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor),
  );
  return (
    <>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        sensors={sensors}
        collisionDetection={fixCursorSnapOffset}
      >
        {children}
        <DragOverlay dropAnimation={{ duration: 0 }}></DragOverlay>
      </DndContext>

      {draggedStep && (
        <StepDragOverlay
          cursorPosition={cursorPosition}
          lefSideBarContainerWidth={lefSideBarContainerWidth}
          step={draggedStep}
        ></StepDragOverlay>
      )}
    </>
  );
};

export { FlowDragLayer };
