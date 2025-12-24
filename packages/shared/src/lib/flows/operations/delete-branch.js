"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._deleteBranch = _deleteBranch;
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
function _deleteBranch(flowVersion, request) {
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || parentStep.type !== action_1.FlowActionType.ROUTER) {
            return parentStep;
        }
        const routerAction = parentStep;
        return Object.assign(Object.assign({}, routerAction), { settings: Object.assign(Object.assign({}, routerAction.settings), { branches: routerAction.settings.branches.filter((_, index) => index !== request.branchIndex) }), children: routerAction.children.filter((_, index) => index !== request.branchIndex) });
    });
}
//# sourceMappingURL=delete-branch.js.map