import { Action, ActionType, FlowVersion, StepLocationRelativeToParent, TriggerType, flowStructureUtil, removeAnySubsequentAction } from "@activepieces/shared";
import { ApNode, ApNodeType } from "../utils/types";
import { EMPTY_STEP_PARENT_NAME } from "../utils/consts";

export const copySelectedNodes = (selectedNodes: ApNode[], flowVersion: FlowVersion) => {
    const operationsToCopy =  selectedNodes.map(node => {
        if (node.type === ApNodeType.STEP && 
            !flowStructureUtil.isTriggerType(node.data.step.type)) {
            const pathToStep = flowStructureUtil
                .findPathToStep(flowVersion.trigger, node.data.step.name);
            const firstPreviousAction = 
                pathToStep.reverse()
                    .find(s => {
                        return selectedNodes.findIndex(n => 
                            n.type === ApNodeType.STEP && 
                            n.data.step.name === s.name && 
                            !flowStructureUtil.isTriggerType(n.data.step.type)
                        ) > -1;
                    });
            const stepWithRecentChanges = flowStructureUtil.getStepOrThrow(node.data.step.name, flowVersion.trigger) as Action;
            const stepWithoutChildren = removeAnySubsequentAction(stepWithRecentChanges);

            if (firstPreviousAction) {
                const isPreviousStepTheParent = flowStructureUtil.isChildOf(
                    firstPreviousAction, 
                    node.data.step.name
                );
            
                if (isPreviousStepTheParent) {
                    const branchIndex = firstPreviousAction.type !== ActionType.ROUTER 
                        ? undefined 
                        : firstPreviousAction.children.findIndex(c => 
                            c ? flowStructureUtil.isChildOf(c, node.data.step.name) || 
                                c.name === node.data.step.name 
                              : false
                        );

                    return {
                        action: stepWithoutChildren,
                        parentStep: firstPreviousAction.name,
                        stepLocationRelativeToParent: firstPreviousAction.type === ActionType.LOOP_ON_ITEMS 
                            ? StepLocationRelativeToParent.INSIDE_LOOP 
                            : StepLocationRelativeToParent.INSIDE_BRANCH,
                        branchIndex
                    };
                }
                
                return {
                    action: stepWithoutChildren,
                    parentStep: firstPreviousAction.name,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER
                };
            }

            return {
                action: stepWithoutChildren,
                parentStep: EMPTY_STEP_PARENT_NAME,
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER
            };
        }
    }).filter((operation) => operation !== undefined);
    navigator.clipboard.writeText(JSON.stringify(operationsToCopy));
};