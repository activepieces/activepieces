"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._updateTrigger = _updateTrigger;
const compiler_1 = require("@sinclair/typebox/compiler");
const common_1 = require("../../common");
const trigger_1 = require("../triggers/trigger");
const flow_structure_util_1 = require("../util/flow-structure-util");
const triggerSchemaValidation = compiler_1.TypeCompiler.Compile(trigger_1.FlowTrigger);
function createTrigger(name, request, nextAction) {
    const baseProperties = {
        displayName: request.displayName,
        name,
        valid: false,
        nextAction,
    };
    let trigger;
    switch (request.type) {
        case trigger_1.FlowTriggerType.EMPTY:
            trigger = Object.assign(Object.assign({}, baseProperties), { type: trigger_1.FlowTriggerType.EMPTY, settings: request.settings });
            break;
        case trigger_1.FlowTriggerType.PIECE:
            trigger = Object.assign(Object.assign({}, baseProperties), { type: trigger_1.FlowTriggerType.PIECE, settings: request.settings });
            break;
    }
    const valid = ((0, common_1.isNil)(request.valid) ? true : request.valid) && triggerSchemaValidation.Check(trigger);
    return Object.assign(Object.assign({}, trigger), { valid });
}
function _updateTrigger(flowVersion, request) {
    const trigger = flow_structure_util_1.flowStructureUtil.getStepOrThrow(request.name, flowVersion.trigger);
    const updatedTrigger = createTrigger(request.name, request, trigger.nextAction);
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name === request.name) {
            return updatedTrigger;
        }
        return parentStep;
    });
}
//# sourceMappingURL=update-trigger.js.map