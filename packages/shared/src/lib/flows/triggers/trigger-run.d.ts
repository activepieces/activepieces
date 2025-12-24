import { Static } from '@sinclair/typebox';
export declare enum TriggerRunStatus {
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    TIMED_OUT = "TIMED_OUT"
}
export declare const TriggerStatusReport: import("@sinclair/typebox").TObject<{
    pieces: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        dailyStats: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            success: import("@sinclair/typebox").TNumber;
            failure: import("@sinclair/typebox").TNumber;
        }>>;
        totalRuns: import("@sinclair/typebox").TNumber;
    }>>;
}>;
export type TriggerStatusReport = Static<typeof TriggerStatusReport>;
