"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._duplicateStep = _duplicateStep;
exports._duplicateBranch = _duplicateBranch;
const common_1 = require("../../common");
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
const add_action_util_1 = require("./add-action-util");
const import_flow_1 = require("./import-flow");
const _1 = require(".");
function _duplicateStep(stepName, flowVersion) {
    const clonedAction = JSON.parse(JSON.stringify(flow_structure_util_1.flowStructureUtil.getActionOrThrow(stepName, flowVersion.trigger)));
    const clonedActionWithoutNextAction = Object.assign(Object.assign({}, clonedAction), { nextAction: undefined });
    const oldNameToNewName = add_action_util_1.addActionUtils.mapToNewNames(flowVersion, [clonedActionWithoutNextAction]);
    const clonedSubflow = flow_structure_util_1.flowStructureUtil.transferStep(clonedActionWithoutNextAction, (step) => {
        return add_action_util_1.addActionUtils.clone(step, oldNameToNewName);
    });
    const importOperations = (0, import_flow_1._getImportOperations)(clonedSubflow);
    return [
        {
            type: _1.FlowOperationType.ADD_ACTION,
            request: {
                action: clonedSubflow,
                parentStep: stepName,
                stepLocationRelativeToParent: _1.StepLocationRelativeToParent.AFTER,
            },
        },
        ...importOperations,
    ];
}
function _duplicateBranch(routerName, childIndex, flowVersion) {
    const router = flow_structure_util_1.flowStructureUtil.getActionOrThrow(routerName, flowVersion.trigger);
    const clonedRouter = JSON.parse(JSON.stringify(router));
    const operations = [{
            type: _1.FlowOperationType.ADD_BRANCH,
            request: {
                branchName: `${clonedRouter.settings.branches[childIndex].branchName} Copy`,
                branchIndex: childIndex + 1,
                stepName: routerName,
                conditions: clonedRouter.settings.branches[childIndex].branchType === action_1.BranchExecutionType.CONDITION ? clonedRouter.settings.branches[childIndex].conditions : undefined,
            },
        }];
    const childRouter = clonedRouter.children[childIndex];
    if (!(0, common_1.isNil)(childRouter)) {
        const oldNameToNewName = add_action_util_1.addActionUtils.mapToNewNames(flowVersion, [childRouter]);
        const clonedSubflow = flow_structure_util_1.flowStructureUtil.transferStep(childRouter, (step) => {
            return add_action_util_1.addActionUtils.clone(step, oldNameToNewName);
        });
        const importOperations = (0, import_flow_1._getImportOperations)(clonedSubflow);
        operations.push({
            type: _1.FlowOperationType.ADD_ACTION,
            request: {
                stepLocationRelativeToParent: _1.StepLocationRelativeToParent.INSIDE_BRANCH,
                action: clonedSubflow,
                parentStep: routerName,
                branchIndex: childIndex + 1,
            },
        });
        operations.push(...importOperations);
    }
    return operations;
}
//# sourceMappingURL=duplicate-step.js.map