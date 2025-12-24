"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._moveAction = _moveAction;
const flow_structure_util_1 = require("../util/flow-structure-util");
const import_flow_1 = require("./import-flow");
const index_1 = require("./index");
function _moveAction(flowVersion, request) {
    const sourceStep = flow_structure_util_1.flowStructureUtil.getActionOrThrow(request.name, flowVersion.trigger);
    flow_structure_util_1.flowStructureUtil.getStepOrThrow(request.newParentStep, flowVersion.trigger);
    const sourceStepWithoutNextAction = Object.assign(Object.assign({}, sourceStep), { nextAction: undefined });
    const deleteOperations = [
        {
            type: index_1.FlowOperationType.DELETE_ACTION,
            request: {
                names: [request.name],
            },
        },
    ];
    const addOperations = [
        {
            type: index_1.FlowOperationType.ADD_ACTION,
            request: {
                action: sourceStepWithoutNextAction,
                parentStep: request.newParentStep,
                stepLocationRelativeToParent: request.stepLocationRelativeToNewParent,
                branchIndex: request.branchIndex,
            },
        },
        ...(0, import_flow_1._getImportOperations)(sourceStepWithoutNextAction),
    ];
    return [
        ...deleteOperations,
        ...addOperations,
    ];
}
//# sourceMappingURL=move-action.js.map