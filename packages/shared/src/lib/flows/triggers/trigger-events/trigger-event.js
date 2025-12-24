"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerEventWithPayload = exports.TriggerEvent = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.TriggerEvent = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
    flowId: typebox_1.Type.String(),
    sourceName: typebox_1.Type.String(),
    fileId: typebox_1.Type.String(),
});
exports.TriggerEventWithPayload = typebox_1.Type.Composite([
    exports.TriggerEvent,
    typebox_1.Type.Object({
        payload: typebox_1.Type.Unknown(),
    }),
]);
//# sourceMappingURL=trigger-event.js.map