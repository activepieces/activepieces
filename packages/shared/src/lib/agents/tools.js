"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTool = exports.AgentFlowTool = exports.AgentPieceTool = exports.AgentPieceToolMetadata = exports.AgentToolType = exports.TASK_COMPLETION_TOOL_NAME = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const id_generator_1 = require("../common/id-generator");
exports.TASK_COMPLETION_TOOL_NAME = 'updateTaskStatus';
var AgentToolType;
(function (AgentToolType) {
    AgentToolType["PIECE"] = "PIECE";
    AgentToolType["FLOW"] = "FLOW";
})(AgentToolType || (exports.AgentToolType = AgentToolType = {}));
const AgentToolBase = {
    toolName: typebox_1.Type.String(),
};
exports.AgentPieceToolMetadata = typebox_1.Type.Object({
    pieceName: typebox_1.Type.String(),
    pieceVersion: typebox_1.Type.String(),
    actionName: typebox_1.Type.String(),
    predefinedInput: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown()),
});
exports.AgentPieceTool = typebox_1.Type.Object(Object.assign(Object.assign({ type: typebox_1.Type.Literal(AgentToolType.PIECE) }, AgentToolBase), { pieceMetadata: exports.AgentPieceToolMetadata }));
exports.AgentFlowTool = typebox_1.Type.Object(Object.assign(Object.assign({ type: typebox_1.Type.Literal(AgentToolType.FLOW) }, AgentToolBase), { flowId: id_generator_1.ApId }));
exports.AgentTool = (0, common_1.DiscriminatedUnion)('type', [
    exports.AgentPieceTool,
    exports.AgentFlowTool,
]);
//# sourceMappingURL=tools.js.map