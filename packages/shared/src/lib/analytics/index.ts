import { Static, Type } from '@sinclair/typebox'
import { Project } from '../project'

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

export type AnalyticsProjectReportItem = Static<
  typeof AnalyticsProjectReportItem
>

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
    tasksUsage: Type.Array(
        Type.Object({
            day: Type.String(),
            totalTasks: Type.Number(),
        }),
    ),
    topProjects: AnalyticsProjectReport,
})
export type AnalyticsReportResponse = Static<typeof AnalyticsReportResponse>


export const PlatformProjectLeaderBoardRow = 
Type.Object({
    id: Type.String(),
    displayName: Type.String(),
    flowsCreated: Type.String(),
    tasks: Type.String(),
    runs: Type.String(),
    connectionCreated: Type.String(),
    publishes: Type.String(),
    flowEdits: Type.String(),
    users: Type.String(),
    piecesUsed: Type.String(),
})

export type PlatformProjectLeaderBoardRow = Static<
  typeof PlatformProjectLeaderBoardRow
>


export const ListPlatformProjectsLeaderboardParams = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    createdAfter: Type.Optional(Type.String()),
    createdBefore: Type.Optional(Type.String()),
    orderBy: Type.Optional(Type.Object({
        column: Type.KeyOf(PlatformProjectLeaderBoardRow),
        order: Type.TemplateLiteral('${ASC|DESC}')
    }))
})

export type ListPlatformProjectsLeaderboardParams = Static<
  typeof ListPlatformProjectsLeaderboardParams
>
