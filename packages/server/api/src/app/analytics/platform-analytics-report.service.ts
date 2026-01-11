import { AnalyticsFlowReportItem, AnalyticsRunsUsageItem, AnalyticsTimePeriod, apId, FlowVersionState, isNil, PlatformAnalyticsReport, PlatformId, ProjectLeaderboardItem, RunEnvironment, UserLeaderboardItem, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { flowService } from '../flows/flow/flow.service'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { ProjectEntity } from '../project/project-entity'
import { userRepo } from '../user/user-service'
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
    getProjectLeaderboard: async (platformId: PlatformId, timePeriod: AnalyticsTimePeriod): Promise<ProjectLeaderboardItem[]> => {
        const report = await platformAnalyticsReportService(log).getOrGenerateReport(platformId)
        const projects = await listProjects(platformId)
        
        return projects.map((project) => {
            const projectFlows = report.flows.filter((flow) => flow.projectId === project.id)
            const flowIds = projectFlows.map((flow) => flow.flowId)
            const flowCount = projectFlows.length
            const minutesSaved = calculateTimeSaved(flowIds, report, timePeriod)
            return {
                projectId: project.id,
                projectName: project.displayName,
                flowCount,
                minutesSaved,
            }
        })
    },
    getUserLeaderboard: async (platformId: PlatformId, timePeriod: AnalyticsTimePeriod): Promise<UserLeaderboardItem[]> => {
        const report = await platformAnalyticsReportService(log).getOrGenerateReport(platformId)
        const users = report.users ?? []
        
        return users.map((user) => {
            const flowsOfUser = report.flows.filter((flow) => flow.ownerId === user.id)
            const flowIds = flowsOfUser.map((flow) => flow.flowId)
            const flowCount = flowsOfUser.length
            const minutesSaved = calculateTimeSaved(flowIds, report, timePeriod)
            return {
                userId: user.id,
                flowCount,
                minutesSaved,
            }
        })
    },
})



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
        case AnalyticsTimePeriod.ALL_TIME:
            return date.subtract(10, 'year').startOf('day').toISOString()
        default:
            throw new Error(`Invalid time period: ${timePeriod}`)
    }
}

function calculateTimeSaved(flowIds: string[], report: PlatformAnalyticsReport, timePeriod: AnalyticsTimePeriod): number | null {
    const flowsWithTimeSaved = report.flows.filter((flow) => flowIds.includes(flow.flowId) && flow.timeSavedPerRun !== null)
    if (flowsWithTimeSaved.length === 0) {
        return null
    }
    const dateRange = getDateRange(timePeriod)
    return flowsWithTimeSaved.reduce((acc, flow) => {
        const timeSavedPerRun = flow.timeSavedPerRun ?? 0
        const totalRuns = report.runs
            .filter((run) => dayjs(run.day).isAfter(dayjs(dateRange)) && run.flowId === flow.flowId)
            .reduce((sum, run) => sum + (run.runs ?? 0), 0)
        return acc + timeSavedPerRun * totalRuns
    }, 0)
}