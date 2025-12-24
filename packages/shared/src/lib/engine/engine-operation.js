"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineResponseStatus = exports.EngineHttpResponse = exports.TriggerPayload = exports.ProgressUpdateType = exports.EngineStderr = exports.EngineStdout = exports.TriggerHookType = exports.EngineOperationType = void 0;
const typebox_1 = require("@sinclair/typebox");
var EngineOperationType;
(function (EngineOperationType) {
    EngineOperationType["EXTRACT_PIECE_METADATA"] = "EXTRACT_PIECE_METADATA";
    EngineOperationType["EXECUTE_FLOW"] = "EXECUTE_FLOW";
    EngineOperationType["EXECUTE_PROPERTY"] = "EXECUTE_PROPERTY";
    EngineOperationType["EXECUTE_TRIGGER_HOOK"] = "EXECUTE_TRIGGER_HOOK";
    EngineOperationType["EXECUTE_VALIDATE_AUTH"] = "EXECUTE_VALIDATE_AUTH";
})(EngineOperationType || (exports.EngineOperationType = EngineOperationType = {}));
var TriggerHookType;
(function (TriggerHookType) {
    TriggerHookType["ON_ENABLE"] = "ON_ENABLE";
    TriggerHookType["ON_DISABLE"] = "ON_DISABLE";
    TriggerHookType["HANDSHAKE"] = "HANDSHAKE";
    TriggerHookType["RENEW"] = "RENEW";
    TriggerHookType["RUN"] = "RUN";
    TriggerHookType["TEST"] = "TEST";
})(TriggerHookType || (exports.TriggerHookType = TriggerHookType = {}));
exports.EngineStdout = typebox_1.Type.Object({
    message: typebox_1.Type.String(),
});
exports.EngineStderr = typebox_1.Type.Object({
    message: typebox_1.Type.String(),
});
var ProgressUpdateType;
(function (ProgressUpdateType) {
    ProgressUpdateType["WEBHOOK_RESPONSE"] = "WEBHOOK_RESPONSE";
    ProgressUpdateType["TEST_FLOW"] = "TEST_FLOW";
    ProgressUpdateType["NONE"] = "NONE";
})(ProgressUpdateType || (exports.ProgressUpdateType = ProgressUpdateType = {}));
exports.TriggerPayload = typebox_1.Type.Object({
    body: typebox_1.Type.Unknown(),
    rawBody: typebox_1.Type.Optional(typebox_1.Type.Unknown()),
    headers: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String()),
    queryParams: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String()),
});
exports.EngineHttpResponse = typebox_1.Type.Object({
    status: typebox_1.Type.Number(),
    body: typebox_1.Type.Unknown(),
    headers: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String()),
});
var EngineResponseStatus;
(function (EngineResponseStatus) {
    EngineResponseStatus["OK"] = "OK";
    EngineResponseStatus["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    EngineResponseStatus["TIMEOUT"] = "TIMEOUT";
    EngineResponseStatus["MEMORY_ISSUE"] = "MEMORY_ISSUE";
})(EngineResponseStatus || (exports.EngineResponseStatus = EngineResponseStatus = {}));
//# sourceMappingURL=engine-operation.js.map