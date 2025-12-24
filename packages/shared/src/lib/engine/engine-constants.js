"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES_TO_REDACT = exports.DEFAULT_MCP_DATA = void 0;
const flow_version_1 = require("../flows/flow-version");
exports.DEFAULT_MCP_DATA = {
    flowId: 'mcp-flow-id',
    flowVersionId: 'mcp-flow-version-id',
    flowVersionState: flow_version_1.FlowVersionState.LOCKED,
    flowRunId: 'mcp-flow-run-id',
    triggerPieceName: 'mcp-trigger-piece-name',
};
exports.ERROR_MESSAGES_TO_REDACT = [
    'HttpClient#sendRequest',
];
//# sourceMappingURL=engine-constants.js.map