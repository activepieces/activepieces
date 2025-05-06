import { SwapBranchRequest } from ".";
import { ActionType, BranchExecutionType } from "../actions/action";
import { FlowVersion } from "../flow-version";
import { flowStructureUtil } from "../util/flow-structure-util";


const isIndexWithinBounds = (index: number, arrayLength:number) => index >= 0 && index < arrayLength;
export function _swapBranch(flowVersion: FlowVersion, request: SwapBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.stepName || stepToUpdate.type !== ActionType.ROUTER) {
            return stepToUpdate
        }
        const routerStep = stepToUpdate;
        if(!isIndexWithinBounds(request.sourceBranchIndex, routerStep.settings.branches.length) || !isIndexWithinBounds(request.targetBranchIndex, routerStep.settings.branches.length) || request.sourceBranchIndex === request.targetBranchIndex) {
            return stepToUpdate
        }
        if(routerStep.settings.branches[request.sourceBranchIndex].branchType === BranchExecutionType.FALLBACK || routerStep.settings.branches[request.targetBranchIndex].branchType === BranchExecutionType.FALLBACK) {
            return stepToUpdate
        }
        const sourceBranch = routerStep.settings.branches[request.sourceBranchIndex];
        const targetBranch = routerStep.settings.branches[request.targetBranchIndex];
        routerStep.settings.branches[request.sourceBranchIndex] = targetBranch;
        routerStep.settings.branches[request.targetBranchIndex] = sourceBranch;
        const sourceBranchChildren = routerStep.children[request.sourceBranchIndex];
        const targetBranchChildren = routerStep.children[request.targetBranchIndex];
        routerStep.children[request.sourceBranchIndex] = targetBranchChildren;
        routerStep.children[request.targetBranchIndex] = sourceBranchChildren;
        return routerStep;
    })

}