"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFlowVersionForWorkerRequest = exports.SendFlowResponseRequest = exports.UploadLogsToken = exports.UploadLogsBehavior = exports.UploadLogsQueryParams = exports.UpdateStepProgressRequest = exports.UpdateRunProgressRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const flow_execution_1 = require("../flow-run/execution/flow-execution");
const flow_run_1 = require("../flow-run/flow-run");
const sample_data_1 = require("../flows/sample-data");
const engine_operation_1 = require("./engine-operation");
exports.UpdateRunProgressRequest = typebox_1.Type.Object({
    runId: typebox_1.Type.String(),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    status: typebox_1.Type.Enum(flow_execution_1.FlowRunStatus),
    projectId: typebox_1.Type.String(),
    progressUpdateType: typebox_1.Type.Optional(typebox_1.Type.Enum(engine_operation_1.ProgressUpdateType)),
    workerHandlerId: (0, common_1.Nullable)(typebox_1.Type.String()),
    httpRequestId: (0, common_1.Nullable)(typebox_1.Type.String()),
    logsFileId: typebox_1.Type.Optional(typebox_1.Type.String()),
    stepNameToTest: typebox_1.Type.Optional(typebox_1.Type.String()),
    failedStep: typebox_1.Type.Optional(flow_run_1.FailedStep),
    startTime: typebox_1.Type.Optional(typebox_1.Type.String()),
    finishTime: typebox_1.Type.Optional(typebox_1.Type.String()),
    stepResponse: typebox_1.Type.Optional(sample_data_1.StepRunResponse),
    pauseMetadata: typebox_1.Type.Optional(flow_execution_1.PauseMetadata),
    stepsCount: typebox_1.Type.Optional(typebox_1.Type.Number()),
});
exports.UpdateStepProgressRequest = typebox_1.Type.Object({
    projectId: typebox_1.Type.String(),
    stepResponse: sample_data_1.StepRunResponse,
});
exports.UploadLogsQueryParams = typebox_1.Type.Object({
    token: typebox_1.Type.String(),
});
var UploadLogsBehavior;
(function (UploadLogsBehavior) {
    UploadLogsBehavior["UPLOAD_DIRECTLY"] = "UPLOAD_DIRECTLY";
    UploadLogsBehavior["REDIRECT_TO_S3"] = "REDIRECT_TO_S3";
})(UploadLogsBehavior || (exports.UploadLogsBehavior = UploadLogsBehavior = {}));
exports.UploadLogsToken = typebox_1.Type.Object({
    logsFileId: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
    flowRunId: typebox_1.Type.String(),
    behavior: typebox_1.Type.Enum(UploadLogsBehavior),
});
exports.SendFlowResponseRequest = typebox_1.Type.Object({
    workerHandlerId: typebox_1.Type.String(),
    httpRequestId: typebox_1.Type.String(),
    runResponse: typebox_1.Type.Object({
        status: typebox_1.Type.Number(),
        body: typebox_1.Type.Any(),
        headers: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String()),
    }),
});
exports.GetFlowVersionForWorkerRequest = typebox_1.Type.Object({
    versionId: typebox_1.Type.String(),
});
//# sourceMappingURL=requests.js.map