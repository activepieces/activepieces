import { DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP, LeaderboardCreatorItem, LeaderboardProjectItem, LeaderboardReport, PlatformId, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { platformAnalyticsReportRepo } from '../analytics/platform-analytics-report.service'

export const leaderboardService = (_log: FastifyBaseLogger) => ({
    getLeaderboard: async (platformId: PlatformId): Promise<LeaderboardReport> => {
        const report = await platformAnalyticsReportRepo().findOneBy({ platformId })
        const estimatedTimeSavedPerStep = report?.estimatedTimeSavedPerStep ?? DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP
        const creators = await getCreatorsLeaderboard(platformId, estimatedTimeSavedPerStep)
        const projects = await getProjectsLeaderboard(platformId, estimatedTimeSavedPerStep)
        return { creators, projects }
    },
})

async function getCreatorsLeaderboard(
    platformId: PlatformId,
    estimatedTimeSavedPerStep: number,
): Promise<LeaderboardCreatorItem[]> {
    const flowsData = await flowRepo()
        .createQueryBuilder('flow')
        .select('first_version."updatedBy"', 'creatorId')
        .addSelect('user_identity.email', 'email')
        .addSelect('user_identity."firstName"', 'firstName')
        .addSelect('user_identity."lastName"', 'lastName')
        .addSelect('COUNT(DISTINCT flow.id)::int', 'flowsCount')
        .innerJoin('project', 'project', 'flow."projectId" = project.id')
        .innerJoin('flow_version', 'first_version', 'first_version."flowId" = flow.id AND first_version.id = (SELECT fv.id FROM flow_version fv WHERE fv."flowId" = flow.id ORDER BY fv.created ASC LIMIT 1)')
        .leftJoin('user', 'creator_user', 'creator_user.id = first_version."updatedBy"')
        .leftJoin('user_identity', 'user_identity', 'user_identity.id = creator_user."identityId"')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('first_version."updatedBy" IS NOT NULL')
        .groupBy('first_version."updatedBy"')
        .addGroupBy('user_identity.email')
        .addGroupBy('user_identity."firstName"')
        .addGroupBy('user_identity."lastName"')
        .orderBy('COUNT(DISTINCT flow.id)', 'DESC')
        .getRawMany()

    const timeSavedData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('first_version."updatedBy"', 'creatorId')
        .addSelect('COALESCE(SUM(COALESCE(flow."timeSavedPerRun", flow_run."stepsCount" * :estimatedTimeSavedPerStep)), 0)::int', 'timeSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .innerJoin('flow_version', 'first_version', 'first_version."flowId" = flow.id AND first_version.id = (SELECT fv.id FROM flow_version fv WHERE fv."flowId" = flow.id ORDER BY fv.created ASC LIMIT 1)')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .andWhere('first_version."updatedBy" IS NOT NULL')
        .groupBy('first_version."updatedBy"')
        .setParameters({ estimatedTimeSavedPerStep })
        .getRawMany()

    const timeSavedMap = new Map(timeSavedData.map(row => [row.creatorId, parseInt(row.timeSaved) || 0]))

    return flowsData.map((row) => ({
        id: row.creatorId,
        email: row.email ?? '',
        firstName: row.firstName ?? undefined,
        lastName: row.lastName ?? undefined,
        flowsCount: parseInt(row.flowsCount),
        timeSaved: timeSavedMap.get(row.creatorId) ?? 0,
    }))
}

async function getProjectsLeaderboard(
    platformId: PlatformId,
    estimatedTimeSavedPerStep: number,
): Promise<LeaderboardProjectItem[]> {
    const flowsData = await flowRepo()
        .createQueryBuilder('flow')
        .select('project.id', 'projectId')
        .addSelect('project."displayName"', 'displayName')
        .addSelect('COUNT(flow.id)::int', 'flowsCount')
        .innerJoin('project', 'project', 'flow."projectId" = project.id')
        .where('project."platformId" = :platformId', { platformId })
        .groupBy('project.id')
        .addGroupBy('project."displayName"')
        .orderBy('COUNT(flow.id)', 'DESC')
        .getRawMany()

    const timeSavedData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('flow_run."projectId"', 'projectId')
        .addSelect('COALESCE(SUM(COALESCE(flow."timeSavedPerRun", flow_run."stepsCount" * :estimatedTimeSavedPerStep)), 0)::int', 'timeSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('flow_run."projectId"')
        .setParameters({ estimatedTimeSavedPerStep })
        .getRawMany()

    const timeSavedMap = new Map(timeSavedData.map(row => [row.projectId, parseInt(row.timeSaved) || 0]))

    return flowsData.map((row) => ({
        id: row.projectId,
        displayName: row.displayName,
        flowsCount: parseInt(row.flowsCount),
        timeSaved: timeSavedMap.get(row.projectId) ?? 0,
    }))
}

