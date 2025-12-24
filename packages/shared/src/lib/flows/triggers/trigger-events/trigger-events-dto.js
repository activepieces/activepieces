"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveTriggerEventRequest = exports.ListTriggerEventsRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.ListTriggerEventsRequest = typebox_1.Type.Object({
    flowId: typebox_1.Type.String({}),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({})),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String({})),
});
exports.SaveTriggerEventRequest = typebox_1.Type.Object({
    flowId: typebox_1.Type.String({}),
    mockData: typebox_1.Type.Unknown(),
});
//# sourceMappingURL=trigger-events-dto.js.map