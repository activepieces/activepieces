import { Static, Type } from '@sinclair/typebox'


export const AnalyticsReportResponse = Type.Object({
    totalFlows: Type.Number(),
    activeFlows: Type.Number(),
    totalUsers: Type.Number(),
    totalProjects: Type.Number(),
    activeProjects: Type.Number(),
    uniquePiecesUsed: Type.Number(),
    activeFlowsWithAI: Type.Number(),
    topPieces: Type.Array(Type.Object({
        name: Type.String(),
        usageCount: Type.Number(),
    })),
    tasksUsage: Type.Array(Type.Object({
        day: Type.String(),
        totalTasks: Type.Number(),
    })),
    topProjects: Type.Array(Type.Object({
        name: Type.String(),
        activeFlows: Type.Number(),
        totalFlows: Type.Number(),
    })),
})

export type AnalyticsReportResponse = Static<typeof AnalyticsReportResponse>