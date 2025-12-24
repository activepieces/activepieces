"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTablesRequest = exports.UpdateTableRequest = exports.CreateTableWebhookRequest = exports.ExportTableResponse = exports.CreateTableRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const table_1 = require("../table");
const table_webhook_1 = require("../table-webhook");
exports.CreateTableRequest = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ExportTableResponse = typebox_1.Type.Object({
    fields: typebox_1.Type.Array(typebox_1.Type.Object({ id: typebox_1.Type.String(), name: typebox_1.Type.String() })),
    rows: typebox_1.Type.Array(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())),
    name: typebox_1.Type.String(),
});
exports.CreateTableWebhookRequest = typebox_1.Type.Object({
    events: typebox_1.Type.Array(typebox_1.Type.Enum(table_webhook_1.TableWebhookEventType)),
    webhookUrl: typebox_1.Type.String(),
    flowId: typebox_1.Type.String(),
});
exports.UpdateTableRequest = typebox_1.Type.Object({
    name: typebox_1.Type.Optional(typebox_1.Type.String()),
    trigger: typebox_1.Type.Optional(typebox_1.Type.Enum(table_1.TableAutomationTrigger)),
    status: typebox_1.Type.Optional(typebox_1.Type.Enum(table_1.TableAutomationStatus)),
});
exports.ListTablesRequest = typebox_1.Type.Object({
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({})),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String({})),
    name: typebox_1.Type.Optional(typebox_1.Type.String({})),
    externalIds: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
});
//# sourceMappingURL=tables.dto.js.map