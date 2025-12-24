import { Static } from '@sinclair/typebox';
export declare const DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP = 2;
export declare const UpdateTimeSavedPerRunRequest: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    timeSavedPerRun: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
}>;
export type UpdateTimeSavedPerRunRequest = Static<typeof UpdateTimeSavedPerRunRequest>;
export declare const UpdatePlatformReportRequest: import("@sinclair/typebox").TObject<{
    estimatedTimeSavedPerStep: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    outdated: import("@sinclair/typebox").TBoolean;
}>;
export type UpdatePlatformReportRequest = Static<typeof UpdatePlatformReportRequest>;
export declare const AnalyticsPieceReportItem: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    logoUrl: import("@sinclair/typebox").TString;
    usageCount: import("@sinclair/typebox").TNumber;
}>;
export type AnalyticsPieceReportItem = Static<typeof AnalyticsPieceReportItem>;
export declare const AnalyticsPieceReport: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    logoUrl: import("@sinclair/typebox").TString;
    usageCount: import("@sinclair/typebox").TNumber;
}>>;
export type AnalyticsPieceReport = Static<typeof AnalyticsPieceReport>;
export declare const AnalyticsProjectReportItem: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    activeFlows: import("@sinclair/typebox").TNumber;
    totalFlows: import("@sinclair/typebox").TNumber;
}>;
export type AnalyticsProjectReportItem = Static<typeof AnalyticsProjectReportItem>;
export declare const AnalyticsProjectReport: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    activeFlows: import("@sinclair/typebox").TNumber;
    totalFlows: import("@sinclair/typebox").TNumber;
}>>;
export type AnalyticsProjectReport = Static<typeof AnalyticsProjectReport>;
export declare const AnalyticsRunsUsageItem: import("@sinclair/typebox").TObject<{
    day: import("@sinclair/typebox").TString;
    totalRuns: import("@sinclair/typebox").TNumber;
    minutesSaved: import("@sinclair/typebox").TNumber;
}>;
export type AnalyticsRunsUsageItem = Static<typeof AnalyticsRunsUsageItem>;
export declare const AnalyticsRunsUsage: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
    day: import("@sinclair/typebox").TString;
    totalRuns: import("@sinclair/typebox").TNumber;
    minutesSaved: import("@sinclair/typebox").TNumber;
}>>;
export type AnalyticsRunsUsage = Static<typeof AnalyticsRunsUsage>;
export declare const AnalyticsFlowReportItem: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    flowName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    projectName: import("@sinclair/typebox").TString;
    runs: import("@sinclair/typebox").TNumber;
    timeSavedPerRun: import("@sinclair/typebox").TObject<{
        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        isEstimated: import("@sinclair/typebox").TBoolean;
    }>;
    minutesSaved: import("@sinclair/typebox").TNumber;
}>;
export type AnalyticsFlowReportItem = Static<typeof AnalyticsFlowReportItem>;
export declare const AnalyticsFlowReport: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    flowName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    projectName: import("@sinclair/typebox").TString;
    runs: import("@sinclair/typebox").TNumber;
    timeSavedPerRun: import("@sinclair/typebox").TObject<{
        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        isEstimated: import("@sinclair/typebox").TBoolean;
    }>;
    minutesSaved: import("@sinclair/typebox").TNumber;
}>>;
export type AnalyticsFlowReport = Static<typeof AnalyticsFlowReport>;
export declare const PlatformAnalyticsReport: import("@sinclair/typebox").TObject<{
    estimatedTimeSavedPerStep: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    totalFlows: import("@sinclair/typebox").TNumber;
    activeFlows: import("@sinclair/typebox").TNumber;
    outdated: import("@sinclair/typebox").TBoolean;
    totalUsers: import("@sinclair/typebox").TNumber;
    activeUsers: import("@sinclair/typebox").TNumber;
    totalProjects: import("@sinclair/typebox").TNumber;
    activeFlowsWithAI: import("@sinclair/typebox").TNumber;
    totalFlowRuns: import("@sinclair/typebox").TNumber;
    topPieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        logoUrl: import("@sinclair/typebox").TString;
        usageCount: import("@sinclair/typebox").TNumber;
    }>>;
    topProjects: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        activeFlows: import("@sinclair/typebox").TNumber;
        totalFlows: import("@sinclair/typebox").TNumber;
    }>>;
    runsUsage: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        day: import("@sinclair/typebox").TString;
        totalRuns: import("@sinclair/typebox").TNumber;
        minutesSaved: import("@sinclair/typebox").TNumber;
    }>>;
    flowsDetails: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        flowId: import("@sinclair/typebox").TString;
        flowName: import("@sinclair/typebox").TString;
        projectId: import("@sinclair/typebox").TString;
        projectName: import("@sinclair/typebox").TString;
        runs: import("@sinclair/typebox").TNumber;
        timeSavedPerRun: import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
            isEstimated: import("@sinclair/typebox").TBoolean;
        }>;
        minutesSaved: import("@sinclair/typebox").TNumber;
    }>>;
    platformId: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type PlatformAnalyticsReport = Static<typeof PlatformAnalyticsReport>;
