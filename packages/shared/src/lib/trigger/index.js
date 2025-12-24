"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerSource = exports.ScheduleOptions = exports.WebhookHandshakeConfiguration = exports.TriggerSourceScheduleType = exports.WebhookHandshakeStrategy = exports.TriggerStrategy = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
var TriggerStrategy;
(function (TriggerStrategy) {
    TriggerStrategy["POLLING"] = "POLLING";
    TriggerStrategy["WEBHOOK"] = "WEBHOOK";
    TriggerStrategy["APP_WEBHOOK"] = "APP_WEBHOOK";
})(TriggerStrategy || (exports.TriggerStrategy = TriggerStrategy = {}));
var WebhookHandshakeStrategy;
(function (WebhookHandshakeStrategy) {
    WebhookHandshakeStrategy["NONE"] = "NONE";
    WebhookHandshakeStrategy["HEADER_PRESENT"] = "HEADER_PRESENT";
    WebhookHandshakeStrategy["QUERY_PRESENT"] = "QUERY_PRESENT";
    WebhookHandshakeStrategy["BODY_PARAM_PRESENT"] = "BODY_PARAM_PRESENT";
})(WebhookHandshakeStrategy || (exports.WebhookHandshakeStrategy = WebhookHandshakeStrategy = {}));
var TriggerSourceScheduleType;
(function (TriggerSourceScheduleType) {
    TriggerSourceScheduleType["CRON_EXPRESSION"] = "CRON_EXPRESSION";
})(TriggerSourceScheduleType || (exports.TriggerSourceScheduleType = TriggerSourceScheduleType = {}));
exports.WebhookHandshakeConfiguration = typebox_1.Type.Object({
    strategy: typebox_1.Type.Enum(WebhookHandshakeStrategy),
    paramName: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ScheduleOptions = typebox_1.Type.Object({
    type: typebox_1.Type.Enum(TriggerSourceScheduleType),
    cronExpression: typebox_1.Type.String(),
    timezone: typebox_1.Type.String(),
});
exports.TriggerSource = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { type: typebox_1.Type.Enum(TriggerStrategy), projectId: typebox_1.Type.String(), flowId: typebox_1.Type.String(), triggerName: typebox_1.Type.String(), schedule: (0, common_1.Nullable)(exports.ScheduleOptions), flowVersionId: typebox_1.Type.String(), pieceName: typebox_1.Type.String(), pieceVersion: typebox_1.Type.String(), deleted: (0, common_1.Nullable)(typebox_1.Type.String()), simulate: typebox_1.Type.Boolean() }));
//# sourceMappingURL=index.js.map