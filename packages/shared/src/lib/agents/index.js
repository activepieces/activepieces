"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStepBlock = exports.ToolCallContentBlock = exports.MarkdownContentBlock = exports.AgentPieceProps = exports.AgentOutputField = exports.ToolCallType = exports.ExecutionToolStatus = exports.ToolCallStatus = exports.ContentBlockType = exports.AgentTaskStatus = exports.AgentOutputFieldType = void 0;
const tslib_1 = require("tslib");
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
tslib_1.__exportStar(require("./tools"), exports);
var AgentOutputFieldType;
(function (AgentOutputFieldType) {
    AgentOutputFieldType["TEXT"] = "text";
    AgentOutputFieldType["NUMBER"] = "number";
    AgentOutputFieldType["BOOLEAN"] = "boolean";
})(AgentOutputFieldType || (exports.AgentOutputFieldType = AgentOutputFieldType = {}));
var AgentTaskStatus;
(function (AgentTaskStatus) {
    AgentTaskStatus["COMPLETED"] = "COMPLETED";
    AgentTaskStatus["FAILED"] = "FAILED";
    AgentTaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
})(AgentTaskStatus || (exports.AgentTaskStatus = AgentTaskStatus = {}));
var ContentBlockType;
(function (ContentBlockType) {
    ContentBlockType["MARKDOWN"] = "MARKDOWN";
    ContentBlockType["TOOL_CALL"] = "TOOL_CALL";
})(ContentBlockType || (exports.ContentBlockType = ContentBlockType = {}));
var ToolCallStatus;
(function (ToolCallStatus) {
    ToolCallStatus["IN_PROGRESS"] = "in-progress";
    ToolCallStatus["COMPLETED"] = "completed";
})(ToolCallStatus || (exports.ToolCallStatus = ToolCallStatus = {}));
var ExecutionToolStatus;
(function (ExecutionToolStatus) {
    ExecutionToolStatus["SUCCESS"] = "SUCCESS";
    ExecutionToolStatus["FAILED"] = "FAILED";
})(ExecutionToolStatus || (exports.ExecutionToolStatus = ExecutionToolStatus = {}));
var ToolCallType;
(function (ToolCallType) {
    ToolCallType["PIECE"] = "PIECE";
    ToolCallType["FLOW"] = "FLOW";
})(ToolCallType || (exports.ToolCallType = ToolCallType = {}));
exports.AgentOutputField = typebox_1.Type.Object({
    displayName: typebox_1.Type.String(),
    description: typebox_1.Type.Optional(typebox_1.Type.String()),
    type: typebox_1.Type.Enum(AgentOutputFieldType),
});
var AgentPieceProps;
(function (AgentPieceProps) {
    AgentPieceProps["AGENT_TOOLS"] = "agentTools";
    AgentPieceProps["STRUCTURED_OUTPUT"] = "structuredOutput";
    AgentPieceProps["PROMPT"] = "prompt";
    AgentPieceProps["MAX_STEPS"] = "maxSteps";
    AgentPieceProps["AI_PROVIDER"] = "provider";
    AgentPieceProps["AI_MODEL"] = "model";
})(AgentPieceProps || (exports.AgentPieceProps = AgentPieceProps = {}));
exports.MarkdownContentBlock = typebox_1.Type.Object({
    type: typebox_1.Type.Literal(ContentBlockType.MARKDOWN),
    markdown: typebox_1.Type.String(),
});
const ToolCallBaseSchema = typebox_1.Type.Object({
    type: typebox_1.Type.Literal(ContentBlockType.TOOL_CALL),
    input: (0, common_1.Nullable)(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown())),
    output: typebox_1.Type.Optional(typebox_1.Type.Unknown()),
    toolName: typebox_1.Type.String(),
    status: typebox_1.Type.Enum(ToolCallStatus),
    toolCallId: typebox_1.Type.String(),
    startTime: typebox_1.Type.String(),
    endTime: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ToolCallContentBlock = (0, common_1.DiscriminatedUnion)('toolCallType', [
    typebox_1.Type.Object(Object.assign(Object.assign({}, ToolCallBaseSchema.properties), { toolCallType: typebox_1.Type.Literal(ToolCallType.PIECE), pieceName: typebox_1.Type.String(), pieceVersion: typebox_1.Type.String(), actionName: typebox_1.Type.String() })),
    typebox_1.Type.Object(Object.assign(Object.assign({}, ToolCallBaseSchema.properties), { toolCallType: typebox_1.Type.Literal(ToolCallType.FLOW), displayName: typebox_1.Type.String(), flowId: typebox_1.Type.String() })),
]);
exports.AgentStepBlock = typebox_1.Type.Union([exports.MarkdownContentBlock, exports.ToolCallContentBlock]);
//# sourceMappingURL=index.js.map