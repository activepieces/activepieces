"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._addBranch = _addBranch;
const common_1 = require("../../common");
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
function _addBranch(flowVersion, request) {
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || parentStep.type !== action_1.FlowActionType.ROUTER) {
            return parentStep;
        }
        const routerAction = parentStep;
        return Object.assign(Object.assign({}, routerAction), { settings: Object.assign(Object.assign({}, routerAction.settings), { branches: (0, common_1.insertAt)(routerAction.settings.branches, request.branchIndex, flow_structure_util_1.flowStructureUtil.createBranch(request.branchName, request.conditions)) }), children: (0, common_1.insertAt)(routerAction.children, request.branchIndex, null) });
    });
}
//# sourceMappingURL=add-branch.js.map