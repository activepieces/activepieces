import { Static, Type } from '@sinclair/typebox'


export const AnalyticsPieceReportItem = Type.Object({
    name: Type.String(),        
    displayName: Type.String(),
    logoUrl: Type.String(),
    usageCount: Type.Number(),
})
export type AnalyticsPieceReportItem = Static<typeof AnalyticsPieceReportItem>

export const AnalyticsPieceReport = Type.Array(AnalyticsPieceReportItem)
export type AnalyticsPieceReport = Static<typeof AnalyticsPieceReport>

export const AnalyticsProjectReportItem = Type.Object({
    id: Type.String(),
    displayName: Type.String(),
    activeFlows: Type.Number(),
    totalFlows: Type.Number(),
})
export type AnalyticsProjectReportItem = Static<typeof AnalyticsProjectReportItem>

export const AnalyticsProjectReport = Type.Array(AnalyticsProjectReportItem)
export type AnalyticsProjectReport = Static<typeof AnalyticsProjectReport>

export const AnalyticsReportResponse = Type.Object({
    totalFlows: Type.Number(),
    activeFlows: Type.Number(),
    totalUsers: Type.Number(),
    activeUsers: Type.Number(),
    totalProjects: Type.Number(),
    activeProjects: Type.Number(),
    uniquePiecesUsed: Type.Number(),
    activeFlowsWithAI: Type.Number(),
    topPieces: AnalyticsPieceReport,
    tasksUsage: Type.Array(Type.Object({
        day: Type.String(),
        totalTasks: Type.Number(),
    })),
    topProjects: AnalyticsProjectReport,
})
export type AnalyticsReportResponse = Static<typeof AnalyticsReportResponse>


// Flow run analytics reports (custom)

// Export GetAnalyticsParams
export const GetAnalyticsParams = Type.Object({
    startTimestamp: Type.String({ format: 'date-time' }),
    endTimestamp: Type.String({ format: 'date-time' }),
})
export type GetAnalyticsParams = Static<typeof GetAnalyticsParams>

// Export AnalyticsResult and AnalyticsResultMap
export type AnalyticsResult = {
    averageRuntime: number
    flowRunCount: number
    successRate: number
    failureRate: number
}

export type AnalyticsResultMap = Record<string, AnalyticsResult>

// Export AnalyticsResponseSchema
export const AnalyticsResponseSchema = Type.Record(
    Type.String(), // flowId as string key
    Type.Object({
        averageRuntime: Type.Number(),
        flowRunCount: Type.Number(),
        successRate: Type.Number(),
        failureRate: Type.Number(),
    }),
)
export type AnalyticsResponse = Static<typeof AnalyticsResponseSchema>
