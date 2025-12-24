"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerStatusReport = exports.TriggerRunStatus = void 0;
const typebox_1 = require("@sinclair/typebox");
var TriggerRunStatus;
(function (TriggerRunStatus) {
    TriggerRunStatus["COMPLETED"] = "COMPLETED";
    TriggerRunStatus["FAILED"] = "FAILED";
    TriggerRunStatus["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    TriggerRunStatus["TIMED_OUT"] = "TIMED_OUT";
})(TriggerRunStatus || (exports.TriggerRunStatus = TriggerRunStatus = {}));
exports.TriggerStatusReport = typebox_1.Type.Object({
    pieces: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Object({
        dailyStats: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Object({
            success: typebox_1.Type.Number(),
            failure: typebox_1.Type.Number(),
        })),
        totalRuns: typebox_1.Type.Number(),
    })),
});
//# sourceMappingURL=trigger-run.js.map