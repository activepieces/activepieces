import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { useBuilderStateContext } from "../builder-hooks";
import { UNSAVED_CHANGES_TOAST, useToast } from "@/components/ui/use-toast";
import StepDragOverlay from "./step-drag-overlay";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { FlowOperationType, flowHelper } from "../../../../../shared/src";
import { ApEdge } from "./flow-canvas-utils";


type FlowDragLayerProps = {
    children: React.ReactNode
};
const FlowDragLayer = ({ children }: FlowDragLayerProps) => {

    const { toast } = useToast();
    const [setActiveDraggingStep, applyOperation, flowVersion, activeDraggingStep] = useBuilderStateContext((state) => [state.setActiveDraggingStep, state.applyOperation, state.flowVersion, state.activeDraggingStep]);

    const draggedStep = activeDraggingStep ? flowHelper.getStep(flowVersion, activeDraggingStep) : undefined;

    const handleDragStart = (e: DragStartEvent) => {
        setActiveDraggingStep(e.active.id.toString())
    };

    const handleDragStartEnd = (e: DragEndEvent) => {
        const collision = e?.collisions?.[0]?.data?.['droppableContainer'].data.current as ApEdge['data'];
        setActiveDraggingStep(null)
        if (collision && collision.parentStep && draggedStep) {
            const isPartOfInnerFlow = flowHelper.isPartOfInnerFlow({
                parentStep: draggedStep,
                childName: collision.parentStep,
            });
            if (isPartOfInnerFlow) {
                toast({
                    title: 'Invalid Move',
                    description: 'The destination location is inside the same step',
                    duration: 3000,
                })
                return;
            }
            applyOperation({
                type: FlowOperationType.MOVE_ACTION,
                request: {
                    name: draggedStep.name,
                    newParentStep: collision.parentStep,
                    stepLocationRelativeToNewParent: collision.stepLocationRelativeToParent,
                },
            }, () => toast(UNSAVED_CHANGES_TOAST));
        }
    }


    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 70,
                tolerance: 100,
            },
        }),
        useSensor(KeyboardSensor),
        useSensor(TouchSensor),
    );

    return <DndContext
        onDragStart={handleDragStart} onDragEnd={handleDragStartEnd} sensors={sensors}>
        {children}
        <DragOverlay dropAnimation={{ duration: 0 }} modifiers={[snapCenterToCursor]}>
            {draggedStep && <StepDragOverlay step={draggedStep} />}
        </DragOverlay>
    </DndContext>
}

export { FlowDragLayer }