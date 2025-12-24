"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._importFlow = _importFlow;
exports._getImportOperations = _getImportOperations;
const common_1 = require("../../common");
const action_1 = require("../actions/action");
const trigger_1 = require("../triggers/trigger");
const flow_structure_util_1 = require("../util/flow-structure-util");
const index_1 = require("./index");
function createDeleteActionOperation(actionName) {
    return {
        type: index_1.FlowOperationType.DELETE_ACTION,
        request: { names: [actionName] },
    };
}
function createUpdateTriggerOperation(trigger) {
    return {
        type: index_1.FlowOperationType.UPDATE_TRIGGER,
        request: trigger,
    };
}
function createChangeNameOperation(displayName) {
    return {
        type: index_1.FlowOperationType.CHANGE_NAME,
        request: { displayName },
    };
}
function _getImportOperations(step) {
    var _a;
    const steps = [];
    while (step) {
        if (step.nextAction) {
            steps.push({
                type: index_1.FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: (_a = step === null || step === void 0 ? void 0 : step.name) !== null && _a !== void 0 ? _a : '',
                    stepLocationRelativeToParent: index_1.StepLocationRelativeToParent.AFTER,
                    action: removeAnySubsequentAction(step.nextAction),
                },
            });
        }
        switch (step.type) {
            case action_1.FlowActionType.LOOP_ON_ITEMS: {
                if (step.firstLoopAction) {
                    steps.push({
                        type: index_1.FlowOperationType.ADD_ACTION,
                        request: {
                            parentStep: step.name,
                            stepLocationRelativeToParent: index_1.StepLocationRelativeToParent.INSIDE_LOOP,
                            action: removeAnySubsequentAction(step.firstLoopAction),
                        },
                    });
                    steps.push(..._getImportOperations(step.firstLoopAction));
                }
                break;
            }
            case action_1.FlowActionType.ROUTER: {
                if (step.children) {
                    for (const [index, child] of step.children.entries()) {
                        if (!(0, common_1.isNil)(child)) {
                            steps.push({
                                type: index_1.FlowOperationType.ADD_ACTION,
                                request: {
                                    parentStep: step.name,
                                    stepLocationRelativeToParent: index_1.StepLocationRelativeToParent.INSIDE_BRANCH,
                                    branchIndex: index,
                                    action: removeAnySubsequentAction(child),
                                },
                            });
                            steps.push(..._getImportOperations(child));
                        }
                    }
                }
                break;
            }
            case action_1.FlowActionType.CODE:
            case action_1.FlowActionType.PIECE:
            case trigger_1.FlowTriggerType.PIECE:
            case trigger_1.FlowTriggerType.EMPTY: {
                break;
            }
        }
        step = step.nextAction;
    }
    return steps;
}
function removeAnySubsequentAction(action) {
    const clonedAction = JSON.parse(JSON.stringify(action));
    switch (clonedAction.type) {
        case action_1.FlowActionType.ROUTER: {
            clonedAction.children = clonedAction.children.map((child) => {
                if ((0, common_1.isNil)(child)) {
                    return null;
                }
                return removeAnySubsequentAction(child);
            });
            break;
        }
        case action_1.FlowActionType.LOOP_ON_ITEMS: {
            delete clonedAction.firstLoopAction;
            break;
        }
        case action_1.FlowActionType.PIECE:
        case action_1.FlowActionType.CODE:
            break;
    }
    delete clonedAction.nextAction;
    return clonedAction;
}
function _importFlow(flowVersion, request) {
    const existingActions = flow_structure_util_1.flowStructureUtil.getAllNextActionsWithoutChildren(flowVersion.trigger);
    const deleteOperations = existingActions.map(action => createDeleteActionOperation(action.name));
    const importOperations = _getImportOperations(request.trigger);
    return [
        createChangeNameOperation(request.displayName),
        ...deleteOperations,
        createUpdateTriggerOperation(request.trigger),
        ...importOperations,
    ];
}
//# sourceMappingURL=import-flow.js.map