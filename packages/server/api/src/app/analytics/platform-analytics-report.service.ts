import { apId, isNil, PlatformId } from '@activepieces/core-utils'
import { AnalyticsFlowReportItem, AnalyticsRunsUsageItem, AnalyticsTimePeriod, FlowStatus, FlowVersionState, PlatformAnalyticsReport, RunEnvironment, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowService } from '../flows/flow/flow.service'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { ProjectEntity } from '../project/project-entity'
import { projectService } from '../project/project-service'
import { userRepo, userService } from '../user/user-service'
import { PlatformAnalyticsReportEntity } from './platform-analytics-report.entity'

export const platformAnalyticsReportRepo = repoFactory(PlatformAnalyticsReportEntity)
const projectRepo = repoFactory(ProjectEntity)

export const platformAnalyticsReportService = (log: FastifyBaseLogger) => ({
    refreshReport: async (platformId: PlatformId) => {
        return distributedLock(log).runExclusive({
            key: `platform-analytics-report-${platformId}`,
            timeoutInSeconds: 400,
            fn: async () => {
                const currentReport = await platformAnalyticsReportRepo().findOneBy({ platformId })
                const cachedAt = dayjs().toISOString()
                const users = await listUsers(platformId)
                const flows = await listFlows(platformId, log)
                const runs = await listRuns(flows.map((flow) => flow.projectId), currentReport?.cachedAt ?? null, cachedAt)

                return platformAnalyticsReportRepo().save({
                    id: currentReport?.id ?? apId(),
                    platformId,
                    cachedAt,
                    runs: mergeRuns(currentReport?.runs ?? [], runs),
                    flows,
                    users,
                    created: cachedAt,
                    outdated: false,
                    updated: cachedAt,
                })
            },
        })
    },
    markAsOutdated: async (platformId: PlatformId) => {
        return platformAnalyticsReportRepo().update({ platformId }, { outdated: true })
    },
    getOrGenerateReport: async (platformId: PlatformId, timePeriod?: AnalyticsTimePeriod): Promise<PlatformAnalyticsReport> => {
        let report = await platformAnalyticsReportRepo().findOneBy({ platformId })
        if (isNil(report) || report.outdated || dayjs().diff(dayjs(report.cachedAt), 'minute') >= 5) {
            report = await platformAnalyticsReportService(log).refreshReport(platformId)
        }
        return filterReportByTimePeriod(report, timePeriod)
    },
    getReportForUser: async ({ platformId, userId, timePeriod }: GetReportForUserParams): Promise<PlatformAnalyticsReport> => {
        const report = await platformAnalyticsReportService(log).getOrGenerateReport(platformId, timePeriod)
        return scopeReportForUser({ report, platformId, userId, log })
    },
    refreshReportForUser: async ({ platformId, userId }: RefreshReportForUserParams): Promise<PlatformAnalyticsReport> => {
        const report = await platformAnalyticsReportService(log).refreshReport(platformId)
        return scopeReportForUser({ report, platformId, userId, log })
    },
})

async function scopeReportForUser({ report, platformId, userId, log }: ScopeReportForUserParams): Promise<PlatformAnalyticsReport> {
    const user = await userService(log).getOneOrFail({ id: userId })
    if (userService(log).isUserPrivileged(user)) {
        return report
    }
    const projects = await projectService(log).getAllForUser({
        platformId,
        userId,
        isPrivileged: false,
    })
    const projectIds = projects.map((project) => project.id)
    const [visibleUserIds, visibleFlowIds] = await Promise.all([
        listUserIdsForProjects({ platformId, projectIds }),
        listFlowIdsForProjects({ projectIds }),
    ])
    return scopeReportToProjects({ report, projectIds, visibleUserIds, visibleFlowIds })
}

async function listUserIdsForProjects({ platformId, projectIds }: ListUserIdsForProjectsParams): Promise<string[]> {
    if (projectIds.length === 0) {
        return []
    }
    const rows = await userRepo()
        .createQueryBuilder('u')
        .select('u.id', 'id')
        .where('u."platformId" = :platformId', { platformId })
        .andWhere(
            '(u.id IN (SELECT pm."userId" FROM project_member pm WHERE pm."projectId" IN (:...projectIds)) OR u.id IN (SELECT p."ownerId" FROM project p WHERE p.id IN (:...projectIds)))',
            { projectIds },
        )
        .getRawMany<{ id: string }>()
    return rows.map((row) => row.id)
}

async function listFlowIdsForProjects({ projectIds }: ListFlowIdsForProjectsParams): Promise<string[]> {
    if (projectIds.length === 0) {
        return []
    }
    const rows = await flowRepo()
        .createQueryBuilder('flow')
        .select('flow.id', 'id')
        .where('flow."projectId" IN (:...projectIds)', { projectIds })
        .getRawMany<{ id: string }>()
    return rows.map((row) => row.id)
}

function scopeReportToProjects({ report, projectIds, visibleUserIds, visibleFlowIds }: ScopeReportToProjectsParams): PlatformAnalyticsReport {
    const allowedProjectIds = new Set(projectIds)
    const allowedUserIds = new Set(visibleUserIds)
    const allowedFlowIds = new Set(visibleFlowIds)
    return {
        ...report,
        flows: report.flows.filter((flow) => allowedProjectIds.has(flow.projectId)),
        runs: report.runs.filter((run) => allowedFlowIds.has(run.flowId)),
        users: report.users.filter((user) => allowedUserIds.has(user.id)),
    }
}



async function listRuns(projectIds: string[], afterDate: string | null, currentDate: string): Promise<AnalyticsRunsUsageItem[]> {
    if (projectIds.length === 0) {
        return []
    }
    let query = flowRunRepo().createQueryBuilder('flow_run')
        .select('flow_run.flowId', 'flowId')
        .addSelect('DATE_TRUNC(\'day\', flow_run.created)', 'day')
        .addSelect('COUNT(*)', 'runs')
        .where('flow_run.projectId IN (:...projectIds)', { projectIds })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('flow_run.flowId')
        .addGroupBy('DATE_TRUNC(\'day\', flow_run.created)')

    if (!isNil(afterDate)) {
        query = query.andWhere('flow_run.created > :afterDate', {
            afterDate,
        })
    }
    if (!isNil(currentDate)) {
        query = query.andWhere('flow_run.created <= :currentDate', {
            currentDate,
        })
    }
    const runs = await query.getRawMany()
    return runs.map((run) => {
        return {
            flowId: run.flowId,
            day: run.day,
            runs: Number(run.runs),
        }
    })
}

function mergeRuns(existing: AnalyticsRunsUsageItem[], incoming: AnalyticsRunsUsageItem[]): AnalyticsRunsUsageItem[] {
    const map = new Map(existing.map(run => [`${run.flowId}-${run.day}`, { ...run }]))
    for (const run of incoming) {
        const key = `${run.flowId}-${run.day}`
        if (map.has(key)) {
            map.get(key)!.runs += run.runs
        }
        else {
            map.set(key, { ...run })
        }
    }
    return Array.from(map.values())
}
async function listFlows(platformId: PlatformId, log: FastifyBaseLogger): Promise<AnalyticsFlowReportItem[]> {
    const { data } = await flowService(log).list({
        platformId,
        cursorRequest: null,
        versionState: FlowVersionState.DRAFT,
        includeTriggerSource: false,
        status: [FlowStatus.ENABLED],
    })
    const projects = await listProjects(platformId)
        
    return data.map((flow) => {
        return {
            flowId: flow.id,
            projectName: projects.find((project) => project.id === flow.projectId)?.displayName ?? '',
            flowName: flow.version.displayName,
            projectId: flow.projectId,
            status: flow.status,
            timeSavedPerRun: flow.timeSavedPerRun,
            ownerId: flow.ownerId,
        }
    })
}

async function listUsers(platformId: PlatformId): Promise<UserWithMetaInformation[]> {
    const users = await userRepo().find({
        where: {
            platformId,
        },
        relations: {
            identity: true,
        },
    })
    return users.map((user) => {
        return {
            id: user.id,
            email: user.identity.email,
            firstName: user.identity.firstName,
            lastName: user.identity.lastName,
            status: user.status,
            lastActiveDate: user.lastActiveDate,
            platformRole: user.platformRole,
            created: user.created,
            updated: user.updated,
        }
    })
}

async function listProjects(platformId: PlatformId): Promise<{ id: string, displayName: string }[]> {
    const projects = await projectRepo().find({
        where: {
            platformId,
            deleted: IsNull(),
        },
        select: {
            id: true,
            displayName: true,
        },
    })
    return projects
}

function filterReportByTimePeriod(
    report: PlatformAnalyticsReport, 
    timePeriod?: AnalyticsTimePeriod, 
): PlatformAnalyticsReport {
    if (!timePeriod) {
        return report
    }
    
    const dateRange = getDateRange(timePeriod)
    const runs = report.runs.filter((run) => dayjs(run.day).isAfter(dayjs(dateRange)))
    
    return {
        ...report,
        runs,
    }
}

function getDateRange(timePeriod: AnalyticsTimePeriod): string {
    const date = dayjs()
    switch (timePeriod) {
        case AnalyticsTimePeriod.LAST_WEEK:
            return date.subtract(1, 'week').startOf('day').toISOString()
        case AnalyticsTimePeriod.LAST_MONTH:
            return date.subtract(1, 'month').startOf('day').toISOString()
        case AnalyticsTimePeriod.LAST_THREE_MONTHS:
            return date.subtract(3, 'month').startOf('day').toISOString()
        case AnalyticsTimePeriod.LAST_SIX_MONTHS:
            return date.subtract(6, 'month').startOf('day').toISOString()
        case AnalyticsTimePeriod.LAST_YEAR:
            return date.subtract(1, 'year').startOf('day').toISOString()
        default:
            throw new Error(`Invalid time period: ${timePeriod}`)
    }
}

type GetReportForUserParams = {
    platformId: PlatformId
    userId: string
    timePeriod?: AnalyticsTimePeriod
}

type RefreshReportForUserParams = {
    platformId: PlatformId
    userId: string
}

type ScopeReportForUserParams = {
    report: PlatformAnalyticsReport
    platformId: PlatformId
    userId: string
    log: FastifyBaseLogger
}

type ListUserIdsForProjectsParams = {
    platformId: PlatformId
    projectIds: string[]
}

type ListFlowIdsForProjectsParams = {
    projectIds: string[]
}

type ScopeReportToProjectsParams = {
    report: PlatformAnalyticsReport
    projectIds: string[]
    visibleUserIds: string[]
    visibleFlowIds: string[]
}
