import { AnalyticsFlowReportItem, AnalyticsRunsUsageItem, apId, FlowVersionState, isNil, PlatformAnalyticsReport, PlatformId, RunEnvironment, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowService } from '../flows/flow/flow.service'
import { userRepo } from '../user/user-service'
import { PlatformAnalyticsReportEntity } from './platform-analytics-report-cache.entity'

export const platformAnalyticsReportRepo = repoFactory(PlatformAnalyticsReportEntity)

export const platformAnalyticsReportService = (log: FastifyBaseLogger) => ({
    refreshReport: async (platformId: PlatformId) => {
        return distributedLock(log).runExclusive({
            key: `platform-analytics-report-${platformId}`,
            timeoutInSeconds: 400,
            fn: async () => {
                const currentReport = await platformAnalyticsReportRepo().findOneBy({ platformId })
                if (currentReport && dayjs(currentReport.cachedAt).add(2, 'minute').isAfter(dayjs())) {
                    return currentReport
                }
                const cachedAt = dayjs().toISOString()
                const users = await listUsers(platformId)
                const flows = await listFlows(platformId, log)
                const runs = await listRuns(flows.map((flow) => flow.projectId), currentReport?.cachedAt ?? null, cachedAt)

                return platformAnalyticsReportRepo().save({
                    id: apId(),
                    platformId,
                    cachedAt,
                    runs: mergeRuns(currentReport?.runs ?? [], runs),
                    flows,
                    users,
                    created: cachedAt,
                    updated: cachedAt,
                })
            },
        })
    },
    getOrGenerateReport: async (platformId: PlatformId): Promise<PlatformAnalyticsReport> => {
        const report = await platformAnalyticsReportRepo().findOneBy({ platformId })
        if (isNil(report)) {
            return platformAnalyticsReportService(log).refreshReport(platformId)
        }
        return report
    },
})



async function listRuns(projectIds: string[], afterDate: string | null, currentDate: string): Promise<AnalyticsRunsUsageItem[]> {
    let query = flowRepo().createQueryBuilder('"flow_run"')
        .select('"flow_run"."flowId"', 'flowId')
        .addSelect('DATE_TRUNC(\'day\', "flow_run"."created")', 'day')
        .addSelect('COUNT(*)', 'runs')
        .where('"flow_run"."projectId" IN (:...projectIds)', { projectIds })
        .where('"flow_run"."environment" = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('"flow_run"."flowId"')
        .addGroupBy('DATE_TRUNC(\'day\', "flow_run"."created")')

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

function mergeRuns(runs: AnalyticsRunsUsageItem[], newRuns: AnalyticsRunsUsageItem[]): AnalyticsRunsUsageItem[] {
    return newRuns.map((newRun) => {
        const existing = runs.find((run) => run.flowId === newRun.flowId && run.day === newRun.day)
        if (existing) {
            return {
                ...newRun,
                runs: newRun.runs + existing.runs,
            }
        }
        return newRun
    })
}
async function listFlows(platformId: PlatformId, log: FastifyBaseLogger): Promise<AnalyticsFlowReportItem[]> {
    const { data } = await flowService(log).list({
        platformId,
        cursorRequest: null,
        versionState: FlowVersionState.DRAFT,
        includeTriggerSource: false,
    })
    return data.map((flow) => {
        return {
            flowId: flow.id,
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