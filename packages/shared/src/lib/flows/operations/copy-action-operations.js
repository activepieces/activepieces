"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getActionsForCopy = _getActionsForCopy;
const flow_structure_util_1 = require("../util/flow-structure-util");
function _getActionsForCopy(selectedSteps, flowVersion) {
    const allSteps = flow_structure_util_1.flowStructureUtil.getAllSteps(flowVersion.trigger);
    const actionsToCopy = selectedSteps
        .map((stepName) => flow_structure_util_1.flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger))
        .filter((step) => flow_structure_util_1.flowStructureUtil.isAction(step.type));
    return actionsToCopy
        .filter(step => !actionsToCopy.filter(parent => parent.name !== step.name).some(parent => flow_structure_util_1.flowStructureUtil.isChildOf(parent, step.name)))
        .map(step => {
        const clonedAction = JSON.parse(JSON.stringify(step));
        clonedAction.nextAction = undefined;
        return clonedAction;
    })
        .sort((a, b) => allSteps.indexOf(a) - allSteps.indexOf(b));
}
//# sourceMappingURL=copy-action-operations.js.map