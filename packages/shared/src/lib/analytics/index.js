"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAnalyticsReport = exports.AnalyticsFlowReport = exports.AnalyticsFlowReportItem = exports.AnalyticsRunsUsage = exports.AnalyticsRunsUsageItem = exports.AnalyticsProjectReport = exports.AnalyticsProjectReportItem = exports.AnalyticsPieceReport = exports.AnalyticsPieceReportItem = exports.UpdatePlatformReportRequest = exports.UpdateTimeSavedPerRunRequest = exports.DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
exports.DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP = 2;
exports.UpdateTimeSavedPerRunRequest = typebox_1.Type.Object({
    flowId: typebox_1.Type.String(),
    timeSavedPerRun: (0, base_model_1.Nullable)(typebox_1.Type.Number()),
});
exports.UpdatePlatformReportRequest = typebox_1.Type.Object({
    estimatedTimeSavedPerStep: (0, base_model_1.Nullable)(typebox_1.Type.Number()),
    outdated: typebox_1.Type.Boolean(),
});
exports.AnalyticsPieceReportItem = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
    logoUrl: typebox_1.Type.String(),
    usageCount: typebox_1.Type.Number(),
});
exports.AnalyticsPieceReport = typebox_1.Type.Array(exports.AnalyticsPieceReportItem);
exports.AnalyticsProjectReportItem = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    displayName: typebox_1.Type.String(),
    activeFlows: typebox_1.Type.Number(),
    totalFlows: typebox_1.Type.Number(),
});
exports.AnalyticsProjectReport = typebox_1.Type.Array(exports.AnalyticsProjectReportItem);
exports.AnalyticsRunsUsageItem = typebox_1.Type.Object({
    day: typebox_1.Type.String(),
    totalRuns: typebox_1.Type.Number(),
    minutesSaved: typebox_1.Type.Number(),
});
exports.AnalyticsRunsUsage = typebox_1.Type.Array(exports.AnalyticsRunsUsageItem);
exports.AnalyticsFlowReportItem = typebox_1.Type.Object({
    flowId: typebox_1.Type.String(),
    flowName: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
    projectName: typebox_1.Type.String(),
    runs: typebox_1.Type.Number(),
    timeSavedPerRun: typebox_1.Type.Object({
        value: (0, base_model_1.Nullable)(typebox_1.Type.Number()),
        isEstimated: typebox_1.Type.Boolean(),
    }),
    minutesSaved: typebox_1.Type.Number(),
});
exports.AnalyticsFlowReport = typebox_1.Type.Array(exports.AnalyticsFlowReportItem);
exports.PlatformAnalyticsReport = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { estimatedTimeSavedPerStep: (0, base_model_1.Nullable)(typebox_1.Type.Number()), totalFlows: typebox_1.Type.Number(), activeFlows: typebox_1.Type.Number(), outdated: typebox_1.Type.Boolean(), totalUsers: typebox_1.Type.Number(), activeUsers: typebox_1.Type.Number(), totalProjects: typebox_1.Type.Number(), activeFlowsWithAI: typebox_1.Type.Number(), totalFlowRuns: typebox_1.Type.Number(), topPieces: exports.AnalyticsPieceReport, topProjects: exports.AnalyticsProjectReport, runsUsage: exports.AnalyticsRunsUsage, flowsDetails: exports.AnalyticsFlowReport, platformId: typebox_1.Type.String() }));
//# sourceMappingURL=index.js.map