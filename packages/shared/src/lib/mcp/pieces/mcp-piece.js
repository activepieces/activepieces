"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpTrigger = exports.McpProperty = exports.McpPropertyType = void 0;
const typebox_1 = require("@sinclair/typebox");
var McpPropertyType;
(function (McpPropertyType) {
    McpPropertyType["TEXT"] = "Text";
    McpPropertyType["BOOLEAN"] = "Boolean";
    McpPropertyType["DATE"] = "Date";
    McpPropertyType["NUMBER"] = "Number";
    McpPropertyType["ARRAY"] = "Array";
    McpPropertyType["OBJECT"] = "Object";
})(McpPropertyType || (exports.McpPropertyType = McpPropertyType = {}));
exports.McpProperty = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    description: typebox_1.Type.Optional(typebox_1.Type.String()),
    type: typebox_1.Type.String(),
    required: typebox_1.Type.Boolean(),
});
exports.McpTrigger = typebox_1.Type.Object({
    pieceName: typebox_1.Type.String(),
    triggerName: typebox_1.Type.String(),
    input: typebox_1.Type.Object({
        toolName: typebox_1.Type.String(),
        toolDescription: typebox_1.Type.String(),
        inputSchema: typebox_1.Type.Array(exports.McpProperty),
        returnsResponse: typebox_1.Type.Boolean(),
    }),
});
//# sourceMappingURL=mcp-piece.js.map