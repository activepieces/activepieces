"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobData = exports.UserInteractionJobDataWithoutWatchingInformation = exports.UserInteractionJobData = exports.ExecuteExtractPieceMetadataJobData = exports.ExecutePropertyJobData = exports.ExecuteTriggerHookJobData = exports.ExecuteValidateAuthJobData = exports.WebhookJobData = exports.ExecuteFlowJobData = exports.PollingJobData = exports.RenewWebhookJobData = exports.NON_SCHEDULED_JOB_TYPES = exports.WorkerJobType = exports.RATE_LIMIT_PRIORITY = exports.JOB_PRIORITY = exports.LATEST_JOB_DATA_SCHEMA_VERSION = void 0;
exports.getDefaultJobPriority = getDefaultJobPriority;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const engine_1 = require("../engine");
const execution_output_1 = require("../flow-run/execution/execution-output");
const flow_run_1 = require("../flow-run/flow-run");
const flow_version_1 = require("../flows/flow-version");
const trigger_1 = require("../flows/triggers/trigger");
const piece_1 = require("../pieces/piece");
exports.LATEST_JOB_DATA_SCHEMA_VERSION = 4;
exports.JOB_PRIORITY = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    veryLow: 5,
    lowest: 6,
};
const TESTING_EXECUTE_FLOW_PRIORITY = 'high';
const ASYNC_EXECUTE_FLOW_PRIORITY = 'medium';
const SYNC_EXECUTE_FLOW_PRIORITY = 'high';
exports.RATE_LIMIT_PRIORITY = 'lowest';
function getExecuteFlowPriority(environment, synchronousHandlerId) {
    switch (environment) {
        case flow_run_1.RunEnvironment.TESTING:
            return TESTING_EXECUTE_FLOW_PRIORITY;
        case flow_run_1.RunEnvironment.PRODUCTION:
            return (0, common_1.isNil)(synchronousHandlerId) ? ASYNC_EXECUTE_FLOW_PRIORITY : SYNC_EXECUTE_FLOW_PRIORITY;
    }
}
function getDefaultJobPriority(job) {
    switch (job.jobType) {
        case WorkerJobType.EXECUTE_POLLING:
        case WorkerJobType.RENEW_WEBHOOK:
            return 'veryLow';
        case WorkerJobType.EXECUTE_WEBHOOK:
            return 'medium';
        case WorkerJobType.EXECUTE_FLOW:
            return getExecuteFlowPriority(job.environment, job.synchronousHandlerId);
        case WorkerJobType.EXECUTE_PROPERTY:
        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
        case WorkerJobType.EXECUTE_VALIDATION:
        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
            return 'critical';
    }
}
var WorkerJobType;
(function (WorkerJobType) {
    WorkerJobType["RENEW_WEBHOOK"] = "RENEW_WEBHOOK";
    WorkerJobType["EXECUTE_POLLING"] = "EXECUTE_POLLING";
    WorkerJobType["EXECUTE_WEBHOOK"] = "EXECUTE_WEBHOOK";
    WorkerJobType["EXECUTE_FLOW"] = "EXECUTE_FLOW";
    WorkerJobType["EXECUTE_VALIDATION"] = "EXECUTE_VALIDATION";
    WorkerJobType["EXECUTE_TRIGGER_HOOK"] = "EXECUTE_TRIGGER_HOOK";
    WorkerJobType["EXECUTE_PROPERTY"] = "EXECUTE_PROPERTY";
    WorkerJobType["EXECUTE_EXTRACT_PIECE_INFORMATION"] = "EXECUTE_EXTRACT_PIECE_INFORMATION";
})(WorkerJobType || (exports.WorkerJobType = WorkerJobType = {}));
exports.NON_SCHEDULED_JOB_TYPES = [
    WorkerJobType.EXECUTE_WEBHOOK,
    WorkerJobType.EXECUTE_FLOW,
    WorkerJobType.EXECUTE_VALIDATION,
    WorkerJobType.EXECUTE_TRIGGER_HOOK,
    WorkerJobType.EXECUTE_PROPERTY,
    WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
];
// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
exports.RenewWebhookJobData = typebox_1.Type.Object({
    schemaVersion: typebox_1.Type.Number(),
    projectId: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
    flowVersionId: typebox_1.Type.String(),
    flowId: typebox_1.Type.String(),
    jobType: typebox_1.Type.Literal(WorkerJobType.RENEW_WEBHOOK),
});
// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
exports.PollingJobData = typebox_1.Type.Object({
    projectId: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
    schemaVersion: typebox_1.Type.Number(),
    flowVersionId: typebox_1.Type.String(),
    flowId: typebox_1.Type.String(),
    triggerType: typebox_1.Type.Enum(trigger_1.FlowTriggerType),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_POLLING),
});
exports.ExecuteFlowJobData = typebox_1.Type.Object({
    projectId: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_FLOW),
    environment: typebox_1.Type.Enum(flow_run_1.RunEnvironment),
    schemaVersion: typebox_1.Type.Number(),
    flowId: typebox_1.Type.String(),
    flowVersionId: typebox_1.Type.String(),
    runId: typebox_1.Type.String(),
    synchronousHandlerId: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.String(), typebox_1.Type.Null()])),
    httpRequestId: typebox_1.Type.Optional(typebox_1.Type.String()),
    payload: typebox_1.Type.Any(),
    executeTrigger: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    executionType: typebox_1.Type.Enum(execution_output_1.ExecutionType),
    progressUpdateType: typebox_1.Type.Enum(engine_1.ProgressUpdateType),
    stepNameToTest: typebox_1.Type.Optional(typebox_1.Type.String()),
    sampleData: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown())),
    logsUploadUrl: typebox_1.Type.String(),
    logsFileId: typebox_1.Type.String(),
    traceContext: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())),
});
exports.WebhookJobData = typebox_1.Type.Object({
    projectId: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
    schemaVersion: typebox_1.Type.Number(),
    requestId: typebox_1.Type.String(),
    payload: typebox_1.Type.Any(),
    runEnvironment: typebox_1.Type.Enum(flow_run_1.RunEnvironment),
    flowId: typebox_1.Type.String(),
    saveSampleData: typebox_1.Type.Boolean(),
    flowVersionIdToRun: typebox_1.Type.String(),
    execute: typebox_1.Type.Boolean(),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_WEBHOOK),
    parentRunId: typebox_1.Type.Optional(typebox_1.Type.String()),
    failParentOnFailure: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    traceContext: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())),
});
exports.ExecuteValidateAuthJobData = typebox_1.Type.Object({
    requestId: typebox_1.Type.String(),
    webserverId: typebox_1.Type.String(),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_VALIDATION),
    projectId: typebox_1.Type.Optional(typebox_1.Type.String()),
    platformId: typebox_1.Type.String(),
    piece: piece_1.PiecePackage,
    schemaVersion: typebox_1.Type.Number(),
    connectionValue: typebox_1.Type.Unknown(),
});
exports.ExecuteTriggerHookJobData = typebox_1.Type.Object({
    requestId: typebox_1.Type.String(),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_TRIGGER_HOOK),
    platformId: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
    schemaVersion: typebox_1.Type.Number(),
    flowId: typebox_1.Type.String(),
    flowVersionId: typebox_1.Type.String(),
    test: typebox_1.Type.Boolean(),
    webserverId: typebox_1.Type.String(),
    hookType: typebox_1.Type.Enum(engine_1.TriggerHookType),
    triggerPayload: typebox_1.Type.Optional(engine_1.TriggerPayload),
});
exports.ExecutePropertyJobData = typebox_1.Type.Object({
    requestId: typebox_1.Type.String(),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_PROPERTY),
    projectId: typebox_1.Type.String(),
    platformId: typebox_1.Type.String(),
    schemaVersion: typebox_1.Type.Number(),
    flowVersion: typebox_1.Type.Optional(flow_version_1.FlowVersion),
    propertyName: typebox_1.Type.String(),
    piece: piece_1.PiecePackage,
    actionOrTriggerName: typebox_1.Type.String(),
    input: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown()),
    webserverId: typebox_1.Type.String(),
    sampleData: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown()),
    searchValue: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ExecuteExtractPieceMetadataJobData = typebox_1.Type.Object({
    requestId: typebox_1.Type.String(),
    webserverId: typebox_1.Type.String(),
    schemaVersion: typebox_1.Type.Number(),
    jobType: typebox_1.Type.Literal(WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION),
    projectId: typebox_1.Type.Optional(typebox_1.Type.String()),
    platformId: typebox_1.Type.String(),
    piece: piece_1.PiecePackage,
});
exports.UserInteractionJobData = typebox_1.Type.Union([
    exports.ExecuteValidateAuthJobData,
    exports.ExecuteTriggerHookJobData,
    exports.ExecutePropertyJobData,
    exports.ExecuteExtractPieceMetadataJobData,
]);
exports.UserInteractionJobDataWithoutWatchingInformation = typebox_1.Type.Union([
    typebox_1.Type.Omit(exports.ExecuteValidateAuthJobData, ['webserverId', 'requestId', 'schemaVersion']),
    typebox_1.Type.Omit(exports.ExecuteTriggerHookJobData, ['webserverId', 'requestId', 'schemaVersion']),
    typebox_1.Type.Omit(exports.ExecutePropertyJobData, ['webserverId', 'requestId', 'schemaVersion']),
    typebox_1.Type.Omit(exports.ExecuteExtractPieceMetadataJobData, ['webserverId', 'requestId', 'schemaVersion']),
]);
exports.JobData = typebox_1.Type.Union([
    exports.PollingJobData,
    exports.RenewWebhookJobData,
    exports.ExecuteFlowJobData,
    exports.WebhookJobData,
    exports.UserInteractionJobData,
]);
//# sourceMappingURL=job-data.js.map