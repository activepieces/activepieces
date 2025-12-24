"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueMetricsResponse = exports.WorkerJobStats = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.WorkerJobStats = typebox_1.Type.Object({
    active: typebox_1.Type.Number(),
    delayed: typebox_1.Type.Number(),
    prioritized: typebox_1.Type.Number(),
    waiting: typebox_1.Type.Number(),
    'waiting-children': typebox_1.Type.Number(),
    completed: typebox_1.Type.Number(),
    failed: typebox_1.Type.Number(),
    paused: typebox_1.Type.Number(),
});
exports.QueueMetricsResponse = typebox_1.Type.Object({
    stats: exports.WorkerJobStats,
});
//# sourceMappingURL=queue-metrics.js.map