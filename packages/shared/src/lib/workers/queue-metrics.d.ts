import { Static } from '@sinclair/typebox';
export declare const WorkerJobStats: import("@sinclair/typebox").TObject<{
    active: import("@sinclair/typebox").TNumber;
    delayed: import("@sinclair/typebox").TNumber;
    prioritized: import("@sinclair/typebox").TNumber;
    waiting: import("@sinclair/typebox").TNumber;
    'waiting-children': import("@sinclair/typebox").TNumber;
    completed: import("@sinclair/typebox").TNumber;
    failed: import("@sinclair/typebox").TNumber;
    paused: import("@sinclair/typebox").TNumber;
}>;
export type WorkerJobStats = Static<typeof WorkerJobStats>;
export declare const QueueMetricsResponse: import("@sinclair/typebox").TObject<{
    stats: import("@sinclair/typebox").TObject<{
        active: import("@sinclair/typebox").TNumber;
        delayed: import("@sinclair/typebox").TNumber;
        prioritized: import("@sinclair/typebox").TNumber;
        waiting: import("@sinclair/typebox").TNumber;
        'waiting-children': import("@sinclair/typebox").TNumber;
        completed: import("@sinclair/typebox").TNumber;
        failed: import("@sinclair/typebox").TNumber;
        paused: import("@sinclair/typebox").TNumber;
    }>;
}>;
export type QueueMetricsResponse = Static<typeof QueueMetricsResponse>;
