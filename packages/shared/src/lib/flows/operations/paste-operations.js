"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getOperationsForPaste = void 0;
const flow_structure_util_1 = require("../util/flow-structure-util");
const add_action_util_1 = require("./add-action-util");
const import_flow_1 = require("./import-flow");
const index_1 = require("./index");
const _getOperationsForPaste = (actions, flowVersion, pastingDetails) => {
    const newNamesMap = add_action_util_1.addActionUtils.mapToNewNames(flowVersion, actions);
    const clonedActions = actions.map(action => flow_structure_util_1.flowStructureUtil.transferStep(action, (step) => {
        return add_action_util_1.addActionUtils.clone(step, newNamesMap);
    }));
    const operations = [];
    for (let i = 0; i < clonedActions.length; i++) {
        if (i === 0) {
            operations.push({
                type: index_1.FlowOperationType.ADD_ACTION,
                request: {
                    action: clonedActions[i],
                    parentStep: pastingDetails.parentStepName,
                    stepLocationRelativeToParent: pastingDetails.stepLocationRelativeToParent,
                    branchIndex: pastingDetails.stepLocationRelativeToParent === index_1.StepLocationRelativeToParent.INSIDE_BRANCH ? pastingDetails.branchIndex : undefined,
                },
            });
        }
        else {
            operations.push({
                type: index_1.FlowOperationType.ADD_ACTION,
                request: {
                    action: clonedActions[i],
                    parentStep: clonedActions[i - 1].name,
                    stepLocationRelativeToParent: index_1.StepLocationRelativeToParent.AFTER,
                },
            });
        }
        const importOperations = (0, import_flow_1._getImportOperations)(clonedActions[i]);
        operations.push(...importOperations);
    }
    return operations;
};
exports._getOperationsForPaste = _getOperationsForPaste;
//# sourceMappingURL=paste-operations.js.map