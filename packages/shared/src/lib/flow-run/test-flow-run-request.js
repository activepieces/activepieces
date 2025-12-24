"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkArchiveActionOnRunsRequestBody = exports.BulkCancelFlowRequestBody = exports.BulkActionOnRunsRequestBody = exports.RetryFlowRequestBody = exports.TestFlowRunRequestBody = void 0;
const typebox_1 = require("@sinclair/typebox");
const id_generator_1 = require("../common/id-generator");
const flow_execution_1 = require("./execution/flow-execution");
const flow_run_1 = require("./flow-run");
exports.TestFlowRunRequestBody = typebox_1.Type.Object({
    flowVersionId: id_generator_1.ApId,
});
exports.RetryFlowRequestBody = typebox_1.Type.Object({
    strategy: typebox_1.Type.Enum(flow_run_1.FlowRetryStrategy),
    projectId: id_generator_1.ApId,
});
exports.BulkActionOnRunsRequestBody = typebox_1.Type.Object({
    projectId: id_generator_1.ApId,
    flowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    excludeFlowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    strategy: typebox_1.Type.Enum(flow_run_1.FlowRetryStrategy),
    status: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(flow_execution_1.FlowRunStatus))),
    flowId: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    createdAfter: typebox_1.Type.Optional(typebox_1.Type.String()),
    createdBefore: typebox_1.Type.Optional(typebox_1.Type.String()),
    failedStepName: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.BulkCancelFlowRequestBody = typebox_1.Type.Object({
    projectId: id_generator_1.ApId,
    flowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    excludeFlowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    status: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Union([
        typebox_1.Type.Literal(flow_execution_1.FlowRunStatus.PAUSED),
        typebox_1.Type.Literal(flow_execution_1.FlowRunStatus.QUEUED),
    ]))),
    flowId: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    createdAfter: typebox_1.Type.Optional(typebox_1.Type.String()),
    createdBefore: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.BulkArchiveActionOnRunsRequestBody = typebox_1.Type.Object({
    projectId: id_generator_1.ApId,
    flowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    excludeFlowRunIds: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    status: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(flow_execution_1.FlowRunStatus))),
    flowId: typebox_1.Type.Optional(typebox_1.Type.Array(id_generator_1.ApId)),
    createdAfter: typebox_1.Type.Optional(typebox_1.Type.String()),
    createdBefore: typebox_1.Type.Optional(typebox_1.Type.String()),
    failedStepName: typebox_1.Type.Optional(typebox_1.Type.String()),
});
//# sourceMappingURL=test-flow-run-request.js.map