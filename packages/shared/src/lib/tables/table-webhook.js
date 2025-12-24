"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableWebhook = exports.TableWebhookEventType = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
var TableWebhookEventType;
(function (TableWebhookEventType) {
    TableWebhookEventType["RECORD_CREATED"] = "RECORD_CREATED";
    TableWebhookEventType["RECORD_UPDATED"] = "RECORD_UPDATED";
    TableWebhookEventType["RECORD_DELETED"] = "RECORD_DELETED";
})(TableWebhookEventType || (exports.TableWebhookEventType = TableWebhookEventType = {}));
exports.TableWebhook = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { projectId: typebox_1.Type.String(), tableId: typebox_1.Type.String(), events: typebox_1.Type.Array(typebox_1.Type.Enum(TableWebhookEventType)), flowId: typebox_1.Type.String() }));
//# sourceMappingURL=table-webhook.js.map