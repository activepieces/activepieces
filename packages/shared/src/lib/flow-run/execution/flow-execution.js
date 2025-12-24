"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFailedState = exports.FAILED_STATES = exports.isFlowRunStateTerminal = exports.PauseMetadata = exports.WebhookPauseMetadata = exports.StopResponse = exports.RespondResponse = exports.DelayPauseMetadata = exports.PauseType = exports.FlowRunStatus = void 0;
const typebox_1 = require("@sinclair/typebox");
const engine_1 = require("../../engine");
var FlowRunStatus;
(function (FlowRunStatus) {
    FlowRunStatus["FAILED"] = "FAILED";
    FlowRunStatus["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    FlowRunStatus["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    FlowRunStatus["PAUSED"] = "PAUSED";
    FlowRunStatus["QUEUED"] = "QUEUED";
    FlowRunStatus["RUNNING"] = "RUNNING";
    FlowRunStatus["SUCCEEDED"] = "SUCCEEDED";
    FlowRunStatus["MEMORY_LIMIT_EXCEEDED"] = "MEMORY_LIMIT_EXCEEDED";
    FlowRunStatus["TIMEOUT"] = "TIMEOUT";
    FlowRunStatus["CANCELED"] = "CANCELED";
})(FlowRunStatus || (exports.FlowRunStatus = FlowRunStatus = {}));
var PauseType;
(function (PauseType) {
    PauseType["DELAY"] = "DELAY";
    PauseType["WEBHOOK"] = "WEBHOOK";
})(PauseType || (exports.PauseType = PauseType = {}));
exports.DelayPauseMetadata = typebox_1.Type.Object({
    type: typebox_1.Type.Literal(PauseType.DELAY),
    resumeDateTime: typebox_1.Type.String(),
    requestIdToReply: typebox_1.Type.Optional(typebox_1.Type.String()),
    handlerId: typebox_1.Type.Optional(typebox_1.Type.String({})),
    progressUpdateType: typebox_1.Type.Optional(typebox_1.Type.Enum(engine_1.ProgressUpdateType)),
});
exports.RespondResponse = typebox_1.Type.Object({
    status: typebox_1.Type.Optional(typebox_1.Type.Number()),
    body: typebox_1.Type.Optional(typebox_1.Type.Unknown()),
    headers: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())),
});
exports.StopResponse = typebox_1.Type.Object({
    status: typebox_1.Type.Optional(typebox_1.Type.Number()),
    body: typebox_1.Type.Optional(typebox_1.Type.Unknown()),
    headers: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())),
});
exports.WebhookPauseMetadata = typebox_1.Type.Object({
    type: typebox_1.Type.Literal(PauseType.WEBHOOK),
    requestId: typebox_1.Type.String(),
    requestIdToReply: typebox_1.Type.Optional(typebox_1.Type.String()),
    response: exports.RespondResponse,
    handlerId: typebox_1.Type.Optional(typebox_1.Type.String({})),
    progressUpdateType: typebox_1.Type.Optional(typebox_1.Type.Enum(engine_1.ProgressUpdateType)),
});
exports.PauseMetadata = typebox_1.Type.Union([exports.DelayPauseMetadata, exports.WebhookPauseMetadata]);
const isFlowRunStateTerminal = ({ status, ignoreInternalError }) => {
    switch (status) {
        case FlowRunStatus.SUCCEEDED:
        case FlowRunStatus.TIMEOUT:
        case FlowRunStatus.FAILED:
        case FlowRunStatus.QUOTA_EXCEEDED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
        case FlowRunStatus.CANCELED:
            return true;
        case FlowRunStatus.INTERNAL_ERROR:
            return !ignoreInternalError;
        case FlowRunStatus.QUEUED:
        case FlowRunStatus.RUNNING:
            return false;
        case FlowRunStatus.PAUSED:
            return false;
    }
};
exports.isFlowRunStateTerminal = isFlowRunStateTerminal;
exports.FAILED_STATES = [
    FlowRunStatus.FAILED,
    FlowRunStatus.INTERNAL_ERROR,
    FlowRunStatus.QUOTA_EXCEEDED,
    FlowRunStatus.TIMEOUT,
    FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
];
const isFailedState = (status) => {
    return exports.FAILED_STATES.includes(status);
};
exports.isFailedState = isFailedState;
//# sourceMappingURL=flow-execution.js.map