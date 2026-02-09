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
  PointerSensorOptions,
} from '@dnd-kit/core';
import { ReactFlowInstance, useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import type { PointerEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  FlowOperationType,
  StepLocationRelativeToParent,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { BuilderState, useBuilderStateContext } from '../builder-hooks';
import { NoteDragOverlayMode } from '../state/notes-state';

import NoteDragOverlay from './nodes/note-node/note-drag-overlay';
import StepDragOverlay from './nodes/step-node/step-drag-overlay';
import { flowCanvasConsts } from './utils/consts';
import { ApButtonData } from './utils/types';

const FlowDragLayer = ({ children }: { children: React.ReactNode }) => {
  const reactFlow = useReactFlow();
  const previousViewPortRef = useRef({ x: 0, y: 0, zoom: 1 });
  const [cursorPositionOnActivation, setCursorPositionOnActivation] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [
    setActiveDraggingStep,
    applyOperation,
    flowVersion,
    activeDraggingStep,
    setDraggedNote,
    getNoteById,
    moveNote,
  ] = useBuilderStateContext((state) => [
    state.setActiveDraggingStep,
    state.applyOperation,
    state.flowVersion,
    state.activeDraggingStep,
    state.setDraggedNote,
    state.getNoteById,
    state.moveNote,
  ]);

  const fixCursorSnapOffset = useCallback(
    (args: Parameters<typeof rectIntersection>[0]) => {
      // Bail out if keyboard activated
      if (!args.pointerCoordinates) {
        return rectIntersection(args);
      }
      const { x, y } = args.pointerCoordinates;
      const { width, height } = args.collisionRect;
      const currentViewport = reactFlow.getViewport();
      const previousViewPort = previousViewPortRef.current;
      const deltaViewport = {
        x: previousViewPort.x - currentViewport.x,
        y: previousViewPort.y - currentViewport.y,
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
    [reactFlow],
  );
  const draggedStep = activeDraggingStep
    ? flowStructureUtil.getStep(activeDraggingStep, flowVersion.trigger)
    : undefined;
  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.type === flowCanvasConsts.DRAGGED_STEP_TAG) {
      setActiveDraggingStep(e.active.id.toString());
    }
    if (e.active.data.current?.type === flowCanvasConsts.DRAGGED_NOTE_TAG) {
      const draggedNote = getNoteById(e.active.id.toString());
      if (draggedNote) {
        const noteElement = document.getElementById(e.active.id.toString());
        let offset: { x: number; y: number } | undefined;
        if (noteElement) {
          const rect = noteElement.getBoundingClientRect();
          offset = {
            x: cursorPositionOnActivation.x - rect.left,
            y: cursorPositionOnActivation.y - rect.top,
          };
        }
        setDraggedNote(draggedNote, NoteDragOverlayMode.MOVE, offset);
      }
    }
    previousViewPortRef.current = reactFlow.getViewport();
  };

  const handleDragCancel = useCallback(() => {
    setActiveDraggingStep(null);
    setDraggedNote(null, null);
  }, [setActiveDraggingStep, setDraggedNote]);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDraggingStep(null);
    setDraggedNote(null, null);
    handleStepDragEnd({ e, applyOperation, activeDraggingStep, flowVersion });
    handleNoteDragEnd({ e, getNoteById, moveNote, reactFlow });
  };

  const sensors = useSensors(
    useSensor(PointerSensorIgnoringInteractiveItems, {
      activationConstraint: {
        distance: 10,
      },
      onActivation: ({ event }) => {
        if (event instanceof PointerEvent) {
          setCursorPositionOnActivation({ x: event.clientX, y: event.clientY });
        }
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

      {draggedStep && <StepDragOverlay step={draggedStep}></StepDragOverlay>}
      <NoteDragOverlay />
    </>
  );
};

export { FlowDragLayer };

function handleStepDragEnd({
  e,
  applyOperation,
  activeDraggingStep,
  flowVersion,
}: { e: DragEndEvent } & Pick<
  BuilderState,
  'applyOperation' | 'activeDraggingStep' | 'flowVersion'
>) {
  const draggedStep = activeDraggingStep
    ? flowStructureUtil.getStep(activeDraggingStep, flowVersion.trigger)
    : undefined;
  const isOverSomething =
    !isNil(e.over?.data?.current) &&
    e.over.data.current.accepts === e.active.data?.current?.type;
  if (isOverSomething) {
    const droppedAtNodeData: ApButtonData | undefined = e.over?.data
      .current as unknown as ApButtonData | undefined;
    if (
      droppedAtNodeData?.parentStepName &&
      draggedStep &&
      draggedStep.name !== droppedAtNodeData.parentStepName
    ) {
      const isPartOfInnerFlow = flowStructureUtil.isChildOf(
        draggedStep,
        droppedAtNodeData.parentStepName,
      );
      if (isPartOfInnerFlow) {
        toast(t('Invalid Move'), {
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
}

function handleNoteDragEnd({
  e,
  getNoteById,
  moveNote,
  reactFlow,
}: { e: DragEndEvent } & Pick<BuilderState, 'getNoteById' | 'moveNote'> & {
    reactFlow: ReactFlowInstance;
  }) {
  if (e.active.data.current?.type === flowCanvasConsts.DRAGGED_NOTE_TAG) {
    const draggedNote = getNoteById(e.active.id.toString());
    if (draggedNote) {
      const element = document.getElementById(e.active.id.toString());
      if (element) {
        const positionOnCanvas = reactFlow.screenToFlowPosition({
          x: element.getBoundingClientRect().left,
          y: element.getBoundingClientRect().top,
        });
        moveNote(draggedNote.id, positionOnCanvas);
      }
    }
  }
}

class PointerSensorIgnoringInteractiveItems extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (
        { nativeEvent: event }: PointerEvent,
        { onActivation }: PointerSensorOptions,
      ) => {
        const target = event.target as HTMLElement;
        if (target?.closest('[contenteditable="true"]')) {
          return false;
        }

        if (
          !event.isPrimary ||
          event.button !== 0 ||
          isInteractiveElement(event.target as Element)
        ) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

function isInteractiveElement(element: Element | null): boolean {
  const interactiveElements = [
    'button',
    'input',
    'textarea',
    'select',
    'option',
  ];

  if (
    element?.tagName &&
    interactiveElements.includes(element.tagName.toLowerCase())
  ) {
    return true;
  }

  return false;
}
