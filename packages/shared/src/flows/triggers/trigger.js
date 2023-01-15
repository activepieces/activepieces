"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerSchema = exports.PieceTriggerSchema = exports.ScheduleTriggerSchema = exports.WebhookTriggerSchema = exports.TriggerType = void 0;
const typebox_1 = require("@sinclair/typebox");
const format_1 = require("@sinclair/typebox/format");
const cron_validator_1 = require("cron-validator");
var TriggerType;
(function (TriggerType) {
    TriggerType["SCHEDULE"] = "SCHEDULE";
    TriggerType["EMPTY"] = "EMPTY";
    TriggerType["WEBHOOK"] = "WEBHOOK";
    TriggerType["PIECE"] = "PIECE_TRIGGER";
})(TriggerType = exports.TriggerType || (exports.TriggerType = {}));
exports.WebhookTriggerSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    type: typebox_1.Type.Literal(TriggerType.WEBHOOK),
    settings: typebox_1.Type.Object({}),
});
format_1.Format.Set('cronexpression', (value) => (0, cron_validator_1.isValidCron)(value, { seconds: true }));
exports.ScheduleTriggerSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    type: typebox_1.Type.Literal(TriggerType.SCHEDULE),
    settings: typebox_1.Type.Object({
        cronExpression: typebox_1.Type.String({
            format: 'cronexpression',
        }),
    }),
});
exports.PieceTriggerSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    type: typebox_1.Type.Literal(TriggerType.PIECE),
    settings: typebox_1.Type.Object({
        pieceName: typebox_1.Type.String({}),
        triggerName: typebox_1.Type.String({}),
        input: typebox_1.Type.Object({}),
    }),
});
exports.TriggerSchema = typebox_1.Type.Union([
    exports.WebhookTriggerSchema,
    exports.ScheduleTriggerSchema,
    exports.PieceTriggerSchema,
]);
