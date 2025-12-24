"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMcpServerRequest = exports.PopulatedMcpServer = exports.McpServer = exports.McpServerStatus = exports.MCP_TRIGGER_PIECE_NAME = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const id_generator_1 = require("../common/id-generator");
const flow_1 = require("../flows/flow");
exports.MCP_TRIGGER_PIECE_NAME = '@activepieces/piece-mcp';
var McpServerStatus;
(function (McpServerStatus) {
    McpServerStatus["ENABLED"] = "ENABLED";
    McpServerStatus["DISABLED"] = "DISABLED";
})(McpServerStatus || (exports.McpServerStatus = McpServerStatus = {}));
exports.McpServer = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { projectId: id_generator_1.ApId, status: typebox_1.Type.Enum(McpServerStatus), token: id_generator_1.ApId }));
exports.PopulatedMcpServer = typebox_1.Type.Composite([exports.McpServer, typebox_1.Type.Object({
        flows: typebox_1.Type.Array(flow_1.PopulatedFlow),
    })]);
exports.UpdateMcpServerRequest = typebox_1.Type.Object({
    status: typebox_1.Type.Enum(McpServerStatus),
});
//# sourceMappingURL=mcp.js.map