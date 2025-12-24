"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._updateAction = _updateAction;
const compiler_1 = require("@sinclair/typebox/compiler");
const common_1 = require("../../common");
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
const actionSchemaValidator = compiler_1.TypeCompiler.Compile(action_1.SingleActionSchema);
function _updateAction(flowVersion, request) {
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.name) {
            return stepToUpdate;
        }
        const baseProps = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            skip: request.skip,
            settings: Object.assign(Object.assign({}, stepToUpdate.settings), { customLogoUrl: request.settings.customLogoUrl }),
        };
        let updatedAction;
        switch (request.type) {
            case action_1.FlowActionType.CODE: {
                updatedAction = Object.assign(Object.assign({}, baseProps), { settings: request.settings, type: action_1.FlowActionType.CODE, nextAction: stepToUpdate.nextAction });
                break;
            }
            case action_1.FlowActionType.PIECE: {
                updatedAction = Object.assign(Object.assign({}, baseProps), { settings: request.settings, type: action_1.FlowActionType.PIECE, nextAction: stepToUpdate.nextAction });
                break;
            }
            case action_1.FlowActionType.LOOP_ON_ITEMS: {
                updatedAction = Object.assign(Object.assign({}, baseProps), { settings: request.settings, type: action_1.FlowActionType.LOOP_ON_ITEMS, firstLoopAction: 'firstLoopAction' in stepToUpdate ? stepToUpdate.firstLoopAction : undefined, nextAction: stepToUpdate.nextAction });
                break;
            }
            case action_1.FlowActionType.ROUTER: {
                updatedAction = Object.assign(Object.assign({}, baseProps), { settings: request.settings, type: action_1.FlowActionType.ROUTER, nextAction: stepToUpdate.nextAction, children: 'children' in stepToUpdate ? stepToUpdate.children : [null, null] });
                break;
            }
        }
        const valid = ((0, common_1.isNil)(request.valid) ? true : request.valid) && actionSchemaValidator.Check(updatedAction);
        return Object.assign(Object.assign({}, updatedAction), { valid });
    });
}
//# sourceMappingURL=update-action.js.map