"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._addAction = _addAction;
const compiler_1 = require("@sinclair/typebox/compiler");
const common_1 = require("../../common");
const activepieces_error_1 = require("../../common/activepieces-error");
const action_1 = require("../actions/action");
const flow_structure_util_1 = require("../util/flow-structure-util");
const index_1 = require("./index");
const actionSchemaValidator = compiler_1.TypeCompiler.Compile(action_1.SingleActionSchema);
function createAction(request, { nextAction, }) {
    const baseProperties = {
        displayName: request.displayName,
        name: request.name,
        valid: false,
        skip: request.skip,
        settings: Object.assign(Object.assign({}, request.settings), { customLogoUrl: request.settings.customLogoUrl }),
        nextAction,
    };
    let action;
    switch (request.type) {
        case action_1.FlowActionType.ROUTER:
            action = Object.assign(Object.assign({}, baseProperties), { type: action_1.FlowActionType.ROUTER, settings: request.settings, children: request.settings.branches.map(() => null) });
            break;
        case action_1.FlowActionType.LOOP_ON_ITEMS:
            action = Object.assign(Object.assign({}, baseProperties), { type: action_1.FlowActionType.LOOP_ON_ITEMS, settings: request.settings });
            break;
        case action_1.FlowActionType.PIECE:
            action = Object.assign(Object.assign({}, baseProperties), { type: action_1.FlowActionType.PIECE, settings: request.settings });
            break;
        case action_1.FlowActionType.CODE:
            action = Object.assign(Object.assign({}, baseProperties), { type: action_1.FlowActionType.CODE, settings: request.settings });
            break;
    }
    const valid = ((0, common_1.isNil)(request.valid) ? true : request.valid) && actionSchemaValidator.Check(action);
    return Object.assign(Object.assign({}, action), { valid });
}
function handleLoopOnItems(parentStep, request) {
    if (request.stepLocationRelativeToParent === index_1.StepLocationRelativeToParent.INSIDE_LOOP) {
        parentStep.firstLoopAction = createAction(request.action, {
            nextAction: parentStep.firstLoopAction,
        });
    }
    else if (request.stepLocationRelativeToParent === index_1.StepLocationRelativeToParent.AFTER) {
        parentStep.nextAction = createAction(request.action, {
            nextAction: parentStep.nextAction,
        });
    }
    else {
        throw new activepieces_error_1.ActivepiecesError({
            code: activepieces_error_1.ErrorCode.FLOW_OPERATION_INVALID,
            params: {
                message: `Loop step parent ${request.stepLocationRelativeToParent} not found`,
            },
        });
    }
    return parentStep;
}
function handleRouter(parentStep, request) {
    var _a;
    if (request.stepLocationRelativeToParent === index_1.StepLocationRelativeToParent.INSIDE_BRANCH && !(0, common_1.isNil)(request.branchIndex)) {
        parentStep.children[request.branchIndex] = createAction(request.action, {
            nextAction: (_a = parentStep.children[request.branchIndex]) !== null && _a !== void 0 ? _a : undefined,
        });
    }
    else if (request.stepLocationRelativeToParent === index_1.StepLocationRelativeToParent.AFTER) {
        parentStep.nextAction = createAction(request.action, {
            nextAction: parentStep.nextAction,
        });
    }
    else {
        throw new activepieces_error_1.ActivepiecesError({
            code: activepieces_error_1.ErrorCode.FLOW_OPERATION_INVALID,
            params: {
                message: `Router step parent ${request.stepLocationRelativeToParent} not found`,
            },
        });
    }
    return parentStep;
}
function _addAction(flowVersion, request) {
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.parentStep) {
            return parentStep;
        }
        switch (parentStep.type) {
            case action_1.FlowActionType.LOOP_ON_ITEMS:
                return handleLoopOnItems(parentStep, request);
            case action_1.FlowActionType.ROUTER:
                return handleRouter(parentStep, request);
            default: {
                parentStep.nextAction = createAction(request.action, {
                    nextAction: parentStep.nextAction,
                });
                return parentStep;
            }
        }
    });
}
//# sourceMappingURL=add-action.js.map