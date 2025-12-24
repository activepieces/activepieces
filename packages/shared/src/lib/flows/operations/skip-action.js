"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._skipAction = _skipAction;
const flow_structure_util_1 = require("../util/flow-structure-util");
function _skipAction(flowVersion, request) {
    return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (!request.names.includes(stepToUpdate.name)) {
            return stepToUpdate;
        }
        return Object.assign(Object.assign({}, stepToUpdate), { skip: request.skip });
    });
}
//# sourceMappingURL=skip-action.js.map