"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._deleteAction = _deleteAction;
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
function _deleteAction(flowVersion, request) {
    let clonedVersion = flowVersion;
    for (const name of request.names) {
        clonedVersion = flow_structure_util_1.flowStructureUtil.transferFlow(clonedVersion, (parentStep) => {
            if (parentStep.nextAction && parentStep.nextAction.name === name) {
                const stepToUpdate = parentStep.nextAction;
                parentStep.nextAction = stepToUpdate.nextAction;
            }
            switch (parentStep.type) {
                case action_1.FlowActionType.LOOP_ON_ITEMS: {
                    if (parentStep.firstLoopAction &&
                        parentStep.firstLoopAction.name === name) {
                        const stepToUpdate = parentStep.firstLoopAction;
                        parentStep.firstLoopAction = stepToUpdate.nextAction;
                    }
                    break;
                }
                case action_1.FlowActionType.ROUTER: {
                    parentStep.children = parentStep.children.map((child) => {
                        var _a;
                        if (child && child.name === name) {
                            return (_a = child.nextAction) !== null && _a !== void 0 ? _a : null;
                        }
                        return child;
                    });
                    break;
                }
                default:
                    break;
            }
            return parentStep;
        });
    }
    return clonedVersion;
}
//# sourceMappingURL=delete-action.js.map