import { Static, Type } from '@sinclair/typebox';
import { Project } from '../project';

export const AnalyticsPieceReportItem = Type.Object({
  name: Type.String(),
  displayName: Type.String(),
  logoUrl: Type.String(),
  usageCount: Type.Number(),
});
export type AnalyticsPieceReportItem = Static<typeof AnalyticsPieceReportItem>;

export const AnalyticsPieceReport = Type.Array(AnalyticsPieceReportItem);
export type AnalyticsPieceReport = Static<typeof AnalyticsPieceReport>;

export const AnalyticsProjectReportItem = Type.Object({
  id: Type.String(),
  displayName: Type.String(),
  activeFlows: Type.Number(),
  totalFlows: Type.Number(),
});

export type AnalyticsProjectReportItem = Static<
  typeof AnalyticsProjectReportItem
>;

export const AnalyticsProjectReport = Type.Array(AnalyticsProjectReportItem);
export type AnalyticsProjectReport = Static<typeof AnalyticsProjectReport>;

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
    })
  ),
  topProjects: AnalyticsProjectReport,
});
export type AnalyticsReportResponse = Static<typeof AnalyticsReportResponse>;

export const ListPlatformProjectsLeaderboardParams = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number()),
  from: Type.Optional(Type.String()),
  to: Type.Optional(Type.String()),
});

export type ListPlatformProjectsLeaderboardParams = Static<
  typeof ListPlatformProjectsLeaderboardParams
>;
//TODO: this schema is fake we need to fix it run the leaderboard query and you will see that
export const PlatfromProjectLeaderBoardRow = Type.Intersect([
  Project,
  Type.Object({
    flowsCreated: Type.Number(),
    tasks: Type.Number(),
    runs: Type.Number(),
    connectionCreated: Type.Number(),
    flowsPublished: Type.Number(),
    flowEdits: Type.Number(),
    users: Type.Number(),
    piecesUsed: Type.Number(),
  }),
]);

export type PlatfromProjectLeaderBoardRow = Static<
  typeof PlatfromProjectLeaderBoardRow
>;
