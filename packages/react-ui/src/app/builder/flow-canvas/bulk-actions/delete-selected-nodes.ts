import { FlowOperationType } from "@activepieces/shared";
import { INTERNAL_ERROR_TOAST, toast } from "@/components/ui/use-toast";
import { ApNode } from "../utils/types";
import { BuilderState } from "../../builder-hooks";

export const deleteSelectedNodes = (
    selectedNodes: ApNode[],
    applyOperation: BuilderState['applyOperation'],
    selectedStep: BuilderState['selectedStep'],
    exitStepSettings: BuilderState['exitStepSettings']
) => {
    selectedNodes.forEach(node => {
        if ('step' in node.data) {
            applyOperation({
                type: FlowOperationType.DELETE_ACTION,
                request: {
                    name: node.data.step.name
                }
            }, () => {
                toast(INTERNAL_ERROR_TOAST);
            })
            if (selectedStep === node.data.step.name) {
                exitStepSettings()
            }
        }
    })
}