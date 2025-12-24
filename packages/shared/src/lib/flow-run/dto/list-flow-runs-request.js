"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFlowRunsRequestQuery = void 0;
const typebox_1 = require("@sinclair/typebox");
const id_generator_1 = require("../../common/id-generator");
const flow_execution_1 = require("../execution/flow-execution");
exports.ListFlowRunsRequestQuery = typebox_1.Type.Object({
    flowId: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String({}))),
    status: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(flow_execution_1.FlowRunStatus))),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({})),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String({})),
    createdAfter: typebox_1.Type.Optional(typebox_1.Type.String({})),
    createdBefore: typebox_1.Type.Optional(typebox_1.Type.String({})),
    projectId: id_generator_1.ApId,
    failedStepName: typebox_1.Type.Optional(typebox_1.Type.String({})),
    flowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    archived: typebox_1.Type.Optional(typebox_1.Type.Boolean({})),
});
//# sourceMappingURL=list-flow-runs-request.js.map