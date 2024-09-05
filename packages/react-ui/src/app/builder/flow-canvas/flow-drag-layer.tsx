import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { t } from 'i18next';

import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { FlowOperationType, flowHelper } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { ApEdge } from './flow-canvas-utils';
import StepDragOverlay from './step-drag-overlay';

type FlowDragLayerProps = {
  children: React.ReactNode;
};

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

const FlowDragLayer = ({ children }: FlowDragLayerProps) => {
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
    ? flowHelper.getStep(flowVersion, activeDraggingStep)
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
      const edgeData: ApEdge['data'] = e.over.data.current as ApEdge['data'];
      if (edgeData && edgeData.parentStep && draggedStep) {
        const isPartOfInnerFlow = flowHelper.isPartOfInnerFlow({
          parentStep: draggedStep,
          childName: edgeData.parentStep,
        });
        if (isPartOfInnerFlow) {
          toast({
            title: t('Invalid Move'),
            description: t('The destination location is inside the same step'),
            duration: 3000,
          });
          return;
        }
        applyOperation(
          {
            type: FlowOperationType.MOVE_ACTION,
            request: {
              name: draggedStep.name,
              newParentStep: edgeData.parentStep,
              stepLocationRelativeToNewParent:
                edgeData.stepLocationRelativeToParent,
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
    useSensor(KeyboardSensor),
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
      {draggedStep && <StepDragOverlay step={draggedStep}></StepDragOverlay>}
    </>
  );
};

export { FlowDragLayer };
