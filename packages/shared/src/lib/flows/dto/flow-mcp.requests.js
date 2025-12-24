"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMCPServerFromStepParams = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.CreateMCPServerFromStepParams = typebox_1.Type.Object({
    flowId: typebox_1.Type.String(),
    flowVersionId: typebox_1.Type.String(),
    stepName: typebox_1.Type.String(),
});
//# sourceMappingURL=flow-mcp.requests.js.map