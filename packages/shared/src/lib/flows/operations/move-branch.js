"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._moveBranch = _moveBranch;
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
const isIndexWithinBounds = (index, arrayLength) => index >= 0 && index < arrayLength;
function _moveBranch(flowVersion, request) {
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.stepName || stepToUpdate.type !== action_1.FlowActionType.ROUTER) {
            return stepToUpdate;
        }
        const routerStep = stepToUpdate;
        if (!isIndexWithinBounds(request.sourceBranchIndex, routerStep.settings.branches.length) || !isIndexWithinBounds(request.targetBranchIndex, routerStep.settings.branches.length) || request.sourceBranchIndex === request.targetBranchIndex) {
            return stepToUpdate;
        }
        if (routerStep.settings.branches[request.sourceBranchIndex].branchType === action_1.BranchExecutionType.FALLBACK || routerStep.settings.branches[request.targetBranchIndex].branchType === action_1.BranchExecutionType.FALLBACK) {
            return stepToUpdate;
        }
        const sourceBranch = routerStep.settings.branches[request.sourceBranchIndex];
        routerStep.settings.branches.splice(request.sourceBranchIndex, 1);
        routerStep.settings.branches.splice(request.targetBranchIndex, 0, sourceBranch);
        const sourceBranchChildren = routerStep.children[request.sourceBranchIndex];
        routerStep.children.splice(request.sourceBranchIndex, 1);
        routerStep.children.splice(request.targetBranchIndex, 0, sourceBranchChildren);
        return routerStep;
    });
}
//# sourceMappingURL=move-branch.js.map