import {
  CollisionDetection,
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
import { t } from 'i18next';

import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import {
  FlowOperationType,
  StepLocationRelativeToParent,
  flowStructureUtil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import StepDragOverlay from './step-drag-overlay';
import { ApButtonData } from './types';

// https://github.com/clauderic/dnd-kit/pull/334#issuecomment-1965708784
const fixCursorSnapOffset: CollisionDetection = (args) => {
  // Bail out if keyboard activated
  if (!args.pointerCoordinates) {
    return rectIntersection(args);
  }
  const { x, y } = args.pointerCoordinates;
  const { width, height } = args.collisionRect;
  const updated = {
    ...args,
    // The collision rectangle is broken when using snapCenterToCursor. Reset
    // the collision rectangle based on pointer location and overlay size.
    collisionRect: {
      width,
      height,
      bottom: y + height / 2,
      left: x - width / 2,
      right: x + width / 2,
      top: y - height / 2,
    },
  };
  return rectIntersection(updated);
};

const FlowDragLayer = ({
  children,
  lefSideBarContainerWidth,
}: {
  children: React.ReactNode;
  lefSideBarContainerWidth: number;
}) => {
  const { toast } = useToast();
  const [
    setActiveDraggingStep,
    applyOperation,
    flowVersion,
    activeDraggingStep,
    setAllowCanvasPanning,
  ] = useBuilderStateContext((state) => [
    state.setActiveDraggingStep,
    state.applyOperation,
    state.flowVersion,
    state.activeDraggingStep,
    state.setAllowCanvasPanning,
  ]);

  const draggedStep = activeDraggingStep
    ? flowStructureUtil.getStep(activeDraggingStep, flowVersion.trigger)
    : undefined;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDraggingStep(e.active.id.toString());
  };

  const handleDragCancel = () => {
    setActiveDraggingStep(null);
  };
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDraggingStep(null);
    setAllowCanvasPanning(true);
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
        applyOperation(
          {
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
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
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
          lefSideBarContainerWidth={lefSideBarContainerWidth}
          step={draggedStep}
        ></StepDragOverlay>
      )}
    </>
  );
};

export { FlowDragLayer };
