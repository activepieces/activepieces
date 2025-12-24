"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailedStep = exports.FlowRun = exports.FlowRetryStrategy = exports.RunEnvironment = exports.FAIL_PARENT_ON_FAILURE_HEADER = exports.PARENT_RUN_ID_HEADER = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
const flow_execution_1 = require("./execution/flow-execution");
exports.PARENT_RUN_ID_HEADER = 'ap-parent-run-id';
exports.FAIL_PARENT_ON_FAILURE_HEADER = 'ap-fail-parent-on-failure';
var RunEnvironment;
(function (RunEnvironment) {
    RunEnvironment["PRODUCTION"] = "PRODUCTION";
    RunEnvironment["TESTING"] = "TESTING";
})(RunEnvironment || (exports.RunEnvironment = RunEnvironment = {}));
var FlowRetryStrategy;
(function (FlowRetryStrategy) {
    FlowRetryStrategy["ON_LATEST_VERSION"] = "ON_LATEST_VERSION";
    FlowRetryStrategy["FROM_FAILED_STEP"] = "FROM_FAILED_STEP";
})(FlowRetryStrategy || (exports.FlowRetryStrategy = FlowRetryStrategy = {}));
exports.FlowRun = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { projectId: typebox_1.Type.String(), flowId: typebox_1.Type.String(), parentRunId: typebox_1.Type.Optional(typebox_1.Type.String()), failParentOnFailure: typebox_1.Type.Boolean(), tags: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())), flowVersionId: typebox_1.Type.String(), flowVersion: typebox_1.Type.Optional(typebox_1.Type.Object({
        displayName: typebox_1.Type.Optional(typebox_1.Type.String()),
    })), logsFileId: (0, base_model_1.Nullable)(typebox_1.Type.String()), status: typebox_1.Type.Enum(flow_execution_1.FlowRunStatus), startTime: typebox_1.Type.Optional(typebox_1.Type.String()), finishTime: typebox_1.Type.Optional(typebox_1.Type.String()), environment: typebox_1.Type.Enum(RunEnvironment), pauseMetadata: typebox_1.Type.Optional(flow_execution_1.PauseMetadata), 
    // The steps data may be missing if the flow has not started yet,
    // or if the run is older than AP_EXECUTION_DATA_RETENTION_DAYS and its execution data has been purged.
    steps: (0, base_model_1.Nullable)(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown())), failedStep: typebox_1.Type.Optional(typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        displayName: typebox_1.Type.String(),
    })), stepNameToTest: typebox_1.Type.Optional(typebox_1.Type.String()), archivedAt: (0, base_model_1.Nullable)(typebox_1.Type.String({ default: null })), stepsCount: typebox_1.Type.Optional(typebox_1.Type.Number()) }));
exports.FailedStep = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
    message: typebox_1.Type.String(),
});
//# sourceMappingURL=flow-run.js.map