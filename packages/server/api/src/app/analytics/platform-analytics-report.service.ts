import { AnalyticsFlowReportItem, AnalyticsRunsUsageItem, apId, isNil, PlatformAnalyticsReport, PlatformId, RunEnvironment, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { PlatformAnalyticsReportEntity } from './platform-analytics-report-cache.entity'
import { userRepo } from '../user/user-service'

export const platformAnalyticsReportRepo = repoFactory(PlatformAnalyticsReportEntity)

export const platformAnalyticsReportService = (log: FastifyBaseLogger) => ({
    refreshReport: async (platformId: PlatformId) => {
        await distributedLock(log).runExclusive({
            key: `platform-analytics-report-${platformId}`,
            timeoutInSeconds: 400,
            fn: async () => {
                await createNewCacheEntry(platformId, log)
            },
        })
        return getMergedReport(platformId)
    },
    getOrGenerateReport: async (platformId: PlatformId, timePeriod?: 'weekly' | 'monthly' | '3-months' | 'all-time'): Promise<PlatformAnalyticsReport> => {
        const latestCache = await platformAnalyticsReportRepo()
            .createQueryBuilder('cache')
            .where('cache.platformId = :platformId', { platformId })
            .orderBy('cache.cachedAt', 'DESC')
            .getOne()
        
        if (latestCache && dayjs(latestCache.cachedAt).add(5, 'minute').isAfter(dayjs())) {
            return getMergedReport(platformId, timePeriod)
        }
        
        await distributedLock(log).runExclusive({
            key: `platform-analytics-report-${platformId}`,
            timeoutInSeconds: 400,
            fn: async () => {
                await createNewCacheEntry(platformId, log)
            },
        })
        
        return getMergedReport(platformId, timePeriod)
    },
})


const createNewCacheEntry = async (platformId: PlatformId, log: FastifyBaseLogger): Promise<void> => {
    const latestCache = await platformAnalyticsReportRepo()
        .createQueryBuilder('cache')
        .where('cache.platformId = :platformId', { platformId })
        .orderBy('cache.cachedAt', 'DESC')
        .getOne()
    
    if (latestCache && dayjs(latestCache.cachedAt).add(5, 'minute').isAfter(dayjs())) {
        return
    }
    
    const startDate = latestCache 
        ? dayjs(latestCache.cachedAt).toISOString()
        : dayjs().subtract(3, 'month').toISOString()
    
    const runsUsage = await analyzeRuns(platformId, startDate)
    const flowsDetails = await analyzeFlowsDetails(platformId, startDate)
    
    const timeSaved = runsUsage.reduce((sum, item) => sum + item.minutesSaved, 0)
    
    const now = new Date()
    await platformAnalyticsReportRepo().save({
        id: apId(),
        platformId,
        cachedAt: now,
        runsUsage,
        flowsDetails,
        timeSaved,
        created: now,
        updated: now,
    } as any)
}


const getMergedReport = async (platformId: PlatformId, timePeriod?: 'weekly' | 'monthly' | '3-months' | 'all-time'): Promise<PlatformAnalyticsReport> => {
    const users = await analyzeUsers(platformId)
    
    const cacheEntries = await platformAnalyticsReportRepo()
        .createQueryBuilder('cache')
        .where('cache.platformId = :platformId', { platformId })
        .orderBy('cache.cachedAt', 'ASC')
        .getMany()
    
    if (cacheEntries.length === 0) {
        const now = dayjs().toISOString()
        return {
            id: apId(),
            platformId,
            cachedAt: now,
            runsUsage: [],
            flowsDetails: [],
            timeSaved: 0,
            created: now,
            updated: now,
            users
        } as PlatformAnalyticsReport
    }
    
    const effectiveTimePeriod = timePeriod ?? '3-months'
    let startDate: dayjs.Dayjs | null = null
    if (effectiveTimePeriod === 'weekly') {
        startDate = dayjs().subtract(7, 'day')
    } else if (effectiveTimePeriod === 'monthly') {
        startDate = dayjs().subtract(30, 'day')
    } else if (effectiveTimePeriod === '3-months') {
        startDate = dayjs().subtract(3, 'month')
    }
    
    let mergedRunsUsage = mergeRunsUsage(cacheEntries.map(c => c.runsUsage))
    let mergedFlowsDetails = mergeFlowsDetails(cacheEntries.map(c => c.flowsDetails))
    
    if (startDate) {
        const startDateStartOfDay = startDate.startOf('day')
        mergedRunsUsage = mergedRunsUsage.filter(item => {
            const itemDate = dayjs(item.day).startOf('day')
            return itemDate.isAfter(startDateStartOfDay) || itemDate.isSame(startDateStartOfDay)
        })
    }
    
    if (startDate) {
        const startDateISO = startDate.toISOString()
        mergedFlowsDetails = await analyzeFlowsDetails(platformId, startDateISO)
    }
    
    const totalTimeSaved = mergedRunsUsage.reduce((sum, item) => sum + item.minutesSaved, 0)
    
    const latestCache = cacheEntries[cacheEntries.length - 1]
    
    const toISOString = (date: Date | string): string => {
        return date instanceof Date ? date.toISOString() : date
    }
    
    return {
        id: apId(),
        platformId,
        cachedAt: toISOString(latestCache.cachedAt as Date | string),
        runsUsage: mergedRunsUsage,
        flowsDetails: mergedFlowsDetails,
        timeSaved: totalTimeSaved,
        created: toISOString(latestCache.created as Date | string),
        updated: toISOString(latestCache.updated as Date | string),
        users,
    }
}

function mergeRunsUsage(runsUsageArrays: AnalyticsRunsUsageItem[][]): AnalyticsRunsUsageItem[] {
    const dayMap = new Map<string, { totalRuns: number, minutesSaved: number }>()
    
    for (const runsUsage of runsUsageArrays) {
        for (const item of runsUsage) {
            const existing = dayMap.get(item.day)
            if (existing) {
                existing.totalRuns += item.totalRuns
                existing.minutesSaved += item.minutesSaved
            } else {
                dayMap.set(item.day, {
                    totalRuns: item.totalRuns,
                    minutesSaved: item.minutesSaved,
                })
            }
        }
    }
    
    return Array.from(dayMap.entries())
        .map(([day, data]) => ({
            day,
            totalRuns: data.totalRuns,
            minutesSaved: data.minutesSaved,
        }))
        .sort((a, b) => a.day.localeCompare(b.day))
}

function mergeFlowsDetails(flowsDetailsArrays: AnalyticsFlowReportItem[][]): AnalyticsFlowReportItem[] {
    const flowMap = new Map<string, AnalyticsFlowReportItem>()
    
    for (const flowsDetails of flowsDetailsArrays) {
        for (const flow of flowsDetails) {
            const existing = flowMap.get(flow.flowId)
            if (existing) {
                existing.runs += flow.runs
                existing.minutesSaved += flow.minutesSaved
                if (!flow.timeSavedPerRun.isEstimated && existing.timeSavedPerRun.isEstimated) {
                    existing.timeSavedPerRun = flow.timeSavedPerRun
                }
            } else {
                flowMap.set(flow.flowId, {
                    ...flow,
                    runs: flow.runs,
                    minutesSaved: flow.minutesSaved,
                })
            }
        }
    }
    
    return Array.from(flowMap.values())
        .sort((a, b) => b.runs - a.runs)
}


async function analyzeRuns(platformId: PlatformId, startDate: string): Promise<AnalyticsRunsUsageItem[]> {
    const runsData = await flowRunRepo()
        .manager
        .createQueryBuilder()
        .select('flow_day_agg.day', 'day')
        .addSelect('SUM(flow_day_agg."runs")::int', 'totalRuns')
        .addSelect('SUM(COALESCE(flow."timeSavedPerRun", 0) * flow_day_agg."runs")::int', 'minutesSaved')
        .from(
            (subQuery) => {
                return subQuery
                    .select('DATE(flow_run_inner.created)', 'day')
                    .addSelect('flow_run_inner."flowId"', 'flowId')
                    .addSelect('COUNT(*)::int', 'runs')
                    .from('flow_run', 'flow_run_inner')
                    .innerJoin('project', 'project_inner', 'flow_run_inner."projectId" = project_inner.id')
                    .where('project_inner."platformId" = :platformId', { platformId })
                    .andWhere('flow_run_inner.created >= :startDate', { startDate })
                    .andWhere('flow_run_inner.environment = :environment', { environment: RunEnvironment.PRODUCTION })
                    .groupBy('DATE(flow_run_inner.created)')
                    .addGroupBy('flow_run_inner."flowId"')
            },
            'flow_day_agg'
        )
        .innerJoin('flow', 'flow', 'flow_day_agg."flowId" = flow.id')
        .groupBy('flow_day_agg.day')
        .orderBy('flow_day_agg.day', 'ASC')
        .setParameters({ platformId, startDate, environment: RunEnvironment.PRODUCTION })
        .getRawMany()
    
    return runsData.map((row) => ({
        day: row.day,
        totalRuns: parseInt(row.totalRuns),
        minutesSaved: parseInt(row.minutesSaved),
    }))
}

async function analyzeFlowsDetails(platformId: PlatformId, startDate: string): Promise<AnalyticsFlowReportItem[]> {
    const flowData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('flow.id', 'flowId')
        .addSelect('flow.status', 'status')
        .addSelect('flow."ownerId"', 'ownerId')
        .addSelect('latest_version."displayName"', 'flowName')
        .addSelect('project.id', 'projectId')
        .addSelect('project."displayName"', 'projectName')
        .addSelect('COUNT(*)::int', 'runs')
        .addSelect('flow."timeSavedPerRun"', 'timeSavedPerRun')
        .addSelect('COALESCE(flow."timeSavedPerRun", 0) * COUNT(*)::int', 'minutesSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .innerJoin('flow_version', 'latest_version', 'latest_version."flowId" = flow.id AND latest_version.id = (SELECT fv.id FROM flow_version fv WHERE fv."flowId" = flow.id ORDER BY fv.created DESC LIMIT 1)')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.created >= :startDate', { startDate })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('flow.id')
        .addGroupBy('latest_version."displayName"')
        .addGroupBy('project.id')
        .addGroupBy('project."displayName"')
        .addGroupBy('flow."timeSavedPerRun"')
        .addGroupBy('flow.status')
        .addGroupBy('flow."ownerId"')
        .orderBy('COUNT(*)', 'DESC')
        .setParameters({ platformId, startDate, environment: RunEnvironment.PRODUCTION })
        .getRawMany()

    return flowData.map((row) => ({
        flowId: row.flowId,
        status: row.status,
        ownerId: row.ownerId,
        flowName: row.flowName,
        projectId: row.projectId,
        projectName: row.projectName,
        timeSavedPerRun: {
            value: !isNil(row.timeSavedPerRun) ? parseInt(row.timeSavedPerRun) : null,
            isEstimated: isNil(row.timeSavedPerRun),
        },
        minutesSaved: parseInt(row.minutesSaved),
        runs: parseInt(row.runs),
    }))
}


async function analyzeUsers(platformId: PlatformId): Promise<UserWithMetaInformation[]> {
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