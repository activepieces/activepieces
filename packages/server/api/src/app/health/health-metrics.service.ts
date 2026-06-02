import { apDayjsDuration } from '@activepieces/server-utils'
import { FlowRunStatus, InternalErrorImpactItem, PlatformId, PlatformMetricsHealthDay, PlatformMetricsHealthHistory, PlatformMetricsLive, PlatformMetricsReport, PlatformMetricsStatusPoint, RunEnvironment, StuckJob } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../database/redis-connections'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { projectService } from '../project/project-service'

type ReportWindow = {
    createdAfter: string
    createdBefore: string
}

function buildReportCacheKey(platformId: PlatformId, window: ReportWindow): string {
    return `${REPORT_CACHE_PREFIX}:${platformId}:${window.createdAfter}:${window.createdBefore}`
}

async function countsByStatus(projectIds: string[], window: ReportWindow): Promise<Map<FlowRunStatus, number>> {
    const rows: Array<{ status: FlowRunStatus, count: string }> = await flowRunRepo().query(`
        SELECT status, COUNT(*) AS count
        FROM flow_run
        WHERE "projectId" = ANY($1)
          AND environment = $2
          AND "archivedAt" IS NULL
          AND created >= $3
          AND created <= $4
        GROUP BY status
    `, [projectIds, RunEnvironment.PRODUCTION, window.createdAfter, window.createdBefore])

    return new Map(rows.map((row) => [row.status, Number(row.count)]))
}

async function buildStatusTimeseries(projectIds: string[], window: ReportWindow): Promise<PlatformMetricsStatusPoint[]> {
    const rows: Array<{ day: Date, status: FlowRunStatus, count: string }> = await flowRunRepo().query(`
        SELECT DATE_TRUNC('day', created) AS day, status, COUNT(*) AS count
        FROM flow_run
        WHERE "projectId" = ANY($1)
          AND environment = $2
          AND "archivedAt" IS NULL
          AND created >= $3
          AND created <= $4
        GROUP BY day, status
        ORDER BY day ASC
    `, [projectIds, RunEnvironment.PRODUCTION, window.createdAfter, window.createdBefore])
    return rows.map((row) => ({
        day: dayjs(row.day).toISOString(),
        status: row.status,
        count: Number(row.count),
    }))
}

async function buildInternalErrorImpact(projectIds: string[], window: ReportWindow): Promise<InternalErrorImpactItem[]> {
    const rows: Array<{ projectId: string, flowId: string, projectName: string | null, flowName: string | null, count: string }> = await flowRunRepo().query(`
        SELECT fr."projectId" AS "projectId",
               fr."flowId" AS "flowId",
               MAX(p."displayName") AS "projectName",
               MAX(fv."displayName") AS "flowName",
               COUNT(*) AS count
        FROM flow_run fr
        LEFT JOIN flow_version fv ON fv.id = fr."flowVersionId"
        LEFT JOIN project p ON p.id = fr."projectId"
        WHERE fr."projectId" = ANY($1)
          AND fr.environment = $2
          AND fr."archivedAt" IS NULL
          AND fr.status = $3
          AND fr.created >= $4
          AND fr.created <= $5
        GROUP BY fr."projectId", fr."flowId"
        ORDER BY COUNT(*) DESC
        LIMIT $6
    `, [projectIds, RunEnvironment.PRODUCTION, FlowRunStatus.INTERNAL_ERROR, window.createdAfter, window.createdBefore, INTERNAL_ERROR_LIMIT])
    return rows.map((row) => ({
        projectId: row.projectId,
        projectName: row.projectName ?? '',
        flowId: row.flowId,
        flowName: row.flowName ?? '',
        count: Number(row.count),
    }))
}

function previousWindow(window: ReportWindow): ReportWindow {
    const lengthMs = dayjs(window.createdBefore).diff(dayjs(window.createdAfter), 'millisecond')
    return {
        createdAfter: dayjs(window.createdAfter).subtract(lengthMs, 'millisecond').toISOString(),
        createdBefore: window.createdAfter,
    }
}

function summarize(counts: Map<FlowRunStatus, number>): { completed: number, successRate: number } {
    const succeeded = counts.get(FlowRunStatus.SUCCEEDED) ?? 0
    const failed = counts.get(FlowRunStatus.FAILED) ?? 0
    const completed = succeeded + failed
    const successRate = completed === 0 ? 0 : (succeeded / completed) * 100
    return { completed, successRate }
}

async function liveStatusCounts(projectIds: string[]): Promise<Map<FlowRunStatus, number>> {
    const rows: Array<{ status: FlowRunStatus, count: string }> = await flowRunRepo().query(`
        SELECT status, COUNT(*) AS count
        FROM flow_run
        WHERE "projectId" = ANY($1)
          AND environment = $2
          AND "archivedAt" IS NULL
          AND status = ANY($3)
        GROUP BY status
    `, [projectIds, RunEnvironment.PRODUCTION, [FlowRunStatus.RUNNING, FlowRunStatus.QUEUED]])
    return new Map(rows.map((row) => [row.status, Number(row.count)]))
}

function stuckBeforeIso(): string {
    const flowTimeoutSeconds = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
    return dayjs().subtract(flowTimeoutSeconds, 'second').toISOString()
}

async function buildStuckJobs(projectIds: string[]): Promise<StuckJob[]> {
    const rows: Array<{ flowRunId: string, flowId: string, projectId: string, status: FlowRunStatus, flowName: string | null, projectName: string | null }> = await flowRunRepo().query(`
        SELECT fr.id AS "flowRunId",
               fr."flowId" AS "flowId",
               fr."projectId" AS "projectId",
               fr.status AS status,
               fv."displayName" AS "flowName",
               p."displayName" AS "projectName"
        FROM flow_run fr
        LEFT JOIN flow_version fv ON fv.id = fr."flowVersionId"
        LEFT JOIN project p ON p.id = fr."projectId"
        WHERE fr."projectId" = ANY($1)
          AND fr.environment = $2
          AND fr."archivedAt" IS NULL
          AND fr.status = $3
          AND fr."startTime" IS NOT NULL
          AND fr."finishTime" IS NULL
          AND fr."startTime" < $4
        ORDER BY fr."startTime" ASC
        LIMIT $5
    `, [projectIds, RunEnvironment.PRODUCTION, FlowRunStatus.RUNNING, stuckBeforeIso(), STUCK_JOBS_LIMIT])
    return rows.map((row) => ({
        flowRunId: row.flowRunId,
        flowId: row.flowId,
        flowName: row.flowName ?? '',
        projectId: row.projectId,
        projectName: row.projectName ?? '',
        status: row.status,
    }))
}

function buildEmptyHealthHistory(): PlatformMetricsHealthDay[] {
    return Array.from({ length: HEALTH_HISTORY_DAYS }, (_unused, index) => ({
        day: dayjs().startOf('day').subtract(HEALTH_HISTORY_DAYS - 1 - index, 'day').toISOString(),
        internalErrors: 0,
        affectedFlows: 0,
        stuckJobs: 0,
    }))
}

async function buildHealthHistory(projectIds: string[]): Promise<PlatformMetricsHealthDay[]> {
    const windowStart = dayjs().startOf('day').subtract(HEALTH_HISTORY_DAYS - 1, 'day').toISOString()

    const errorRows: Array<{ day: Date, internalErrors: string, affectedFlows: string }> = await flowRunRepo().query(`
        SELECT DATE_TRUNC('day', created) AS day,
               COUNT(*) AS "internalErrors",
               COUNT(DISTINCT "flowId") AS "affectedFlows"
        FROM flow_run
        WHERE "projectId" = ANY($1)
          AND environment = $2
          AND "archivedAt" IS NULL
          AND status = $3
          AND created >= $4
        GROUP BY day
    `, [projectIds, RunEnvironment.PRODUCTION, FlowRunStatus.INTERNAL_ERROR, windowStart])

    const stuckRows: Array<{ day: Date, stuckJobs: string }> = await flowRunRepo().query(`
        SELECT DATE_TRUNC('day', "startTime") AS day, COUNT(*) AS "stuckJobs"
        FROM flow_run
        WHERE "projectId" = ANY($1)
          AND environment = $2
          AND "archivedAt" IS NULL
          AND status = $3
          AND "startTime" IS NOT NULL
          AND "finishTime" IS NULL
          AND "startTime" >= $4
          AND "startTime" < $5
        GROUP BY day
    `, [projectIds, RunEnvironment.PRODUCTION, FlowRunStatus.RUNNING, windowStart, stuckBeforeIso()])

    const errorByDay = new Map(errorRows.map((row) => [dayjs(row.day).format('YYYY-MM-DD'), row]))
    const stuckByDay = new Map(stuckRows.map((row) => [dayjs(row.day).format('YYYY-MM-DD'), row]))

    return Array.from({ length: HEALTH_HISTORY_DAYS }, (_unused, index) => {
        const date = dayjs().startOf('day').subtract(HEALTH_HISTORY_DAYS - 1 - index, 'day')
        const key = date.format('YYYY-MM-DD')
        const error = errorByDay.get(key)
        const stuck = stuckByDay.get(key)
        return {
            day: date.toISOString(),
            internalErrors: Number(error?.internalErrors ?? 0),
            affectedFlows: Number(error?.affectedFlows ?? 0),
            stuckJobs: Number(stuck?.stuckJobs ?? 0),
        }
    })
}

export const healthMetricsService = (log: FastifyBaseLogger) => ({
    getRunMetrics: async (platformId: PlatformId, window: ReportWindow): Promise<PlatformMetricsReport> => {
        const cacheKey = buildReportCacheKey(platformId, window)
        const cached = await distributedStore.get<PlatformMetricsReport>(cacheKey)
        if (cached) {
            return cached
        }

        const projectIds = await projectService(log).getProjectIdsByPlatform(platformId)
        if (projectIds.length === 0) {
            return { summary: { completed: 0, successRate: 0, previousCompleted: 0, previousSuccessRate: 0 }, statusTimeseries: [], internalErrors: [] }
        }

        const [currentCounts, previousCounts, statusTimeseries, internalErrors] = await Promise.all([
            countsByStatus(projectIds, window),
            countsByStatus(projectIds, previousWindow(window)),
            buildStatusTimeseries(projectIds, window),
            buildInternalErrorImpact(projectIds, window),
        ])

        const current = summarize(currentCounts)
        const previous = summarize(previousCounts)
        const value: PlatformMetricsReport = {
            summary: {
                completed: current.completed,
                successRate: current.successRate,
                previousCompleted: previous.completed,
                previousSuccessRate: previous.successRate,
            },
            statusTimeseries,
            internalErrors,
        }
        await distributedStore.put(cacheKey, value, REPORT_TTL_SECONDS)
        return value
    },
    getQueueMetrics: async (platformId: PlatformId): Promise<PlatformMetricsLive> => {
        const projectIds = await projectService(log).getProjectIdsByPlatform(platformId)
        if (projectIds.length === 0) {
            return { running: 0, queued: 0, stuckJobs: [] }
        }
        const [counts, stuckJobs] = await Promise.all([
            liveStatusCounts(projectIds),
            buildStuckJobs(projectIds),
        ])
        return {
            running: counts.get(FlowRunStatus.RUNNING) ?? 0,
            queued: counts.get(FlowRunStatus.QUEUED) ?? 0,
            stuckJobs,
        }
    },
    getHealthHistory: async (platformId: PlatformId): Promise<PlatformMetricsHealthHistory> => {
        const projectIds = await projectService(log).getProjectIdsByPlatform(platformId)
        if (projectIds.length === 0) {
            return { days: buildEmptyHealthHistory() }
        }
        return { days: await buildHealthHistory(projectIds) }
    },
})

const REPORT_CACHE_PREFIX = 'health-metrics:report'
const REPORT_TTL_SECONDS = apDayjsDuration(6, 'hours').asSeconds() // only run metrics is cached
const HEALTH_HISTORY_DAYS = 30

// Limits for internal errors and stuck jobs . It's unlikely that these will exceed the limit, but even if it does we don't care much about all of them.
const INTERNAL_ERROR_LIMIT = 50
const STUCK_JOBS_LIMIT = 50
