import { chunk, FlowStatus, ProjectType, RunEnvironment, tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { exceptionHandler } from '../../helper/exception-handler'
import { sleep } from '../../helper/sleep'
import { projectRepo } from '../../project/project-repo'
import { userRepo } from '../../user/user-service'
import { platformPlanRepo } from '../platform/platform-plan/platform-plan.service'

dayjs.extend(utc)

const CONSOLE_API_URL = 'https://console.activepieces.com'
const REQUEST_TIMEOUT_MS = 30000
const SNAPSHOT_BATCH_SIZE = 25
const EXECUTIONS_PROJECT_CHUNK_SIZE = 100
const EXECUTIONS_CHUNK_DELAY_MS = 1000

export const consoleUsageService = (log: FastifyBaseLogger) => ({
    /**
     * Reports per-platform usage to the Console for billing/metering — this is NOT telemetry, so it
     * is intentionally not gated on AP_TELEMETRY_ENABLED. The license key is both the gate and the
     * credential: only licensed platforms are reported, and the key is sent as the Bearer token the
     * Console validates. Unlicensed instances bail before the heavy aggregate queries, so they send
     * nothing. Only the previous *completed* UTC day is reported (the current, in-progress day is
     * excluded), so the count is final on first send. Re-running the same day carries the same value,
     * which the Console stores with a plain idempotent upsert (no max-merge). Note: with a single-day
     * window there is no healing margin — if a day's run is missed entirely, the next run won't
     * backfill it, since it only ever looks at yesterday.
     */
    async reportAllPlatforms(): Promise<void> {
        try {
            const licenseKeysByPlatform = await queryLicenseKeysByPlatform()

            if (licenseKeysByPlatform.size === 0) {
                return
            }

            const platformIds = [...licenseKeysByPlatform.keys()]
            const dayStart = utcMidnight(1)
            const dayEnd = utcMidnight(0)

            // Run the aggregates sequentially rather than in parallel: this is a background report, and
            // firing all four heavy GROUP BY queries at once would hold several connections from the shared
            // pool simultaneously, starving live request traffic. One at a time keeps the report to a single
            // connection so the app server stays responsive while it runs.
            const activeFlowsByPlatform = await queryActiveFlowsByPlatform(platformIds)
            const usersByPlatform = await queryUsersByPlatform(platformIds)
            const teamProjectsByPlatform = await queryTeamProjectsByPlatform(platformIds)
            const dailyExecutionsByPlatform = await queryDailyExecutionsByPlatform(platformIds, dayStart, dayEnd)

            const reportedAt = new Date().toISOString()

            for (const batch of chunk([...licenseKeysByPlatform.entries()], SNAPSHOT_BATCH_SIZE)) {
                const results = await Promise.allSettled(
                    batch.map(([platformId, licenseKey]) => {
                        const body = buildSnapshotBody({
                            platformId,
                            activeFlows: activeFlowsByPlatform.get(platformId) ?? 0,
                            users: usersByPlatform.get(platformId) ?? 0,
                            projects: teamProjectsByPlatform.get(platformId) ?? 0,
                            dailyExecutions: dailyExecutionsByPlatform.get(platformId) ?? [],
                            reportedAt,
                        })
                        return postSnapshot({ body, licenseKey })
                    }),
                )

                for (const result of results) {
                    if (result.status === 'rejected') {
                        exceptionHandler.handle(result.reason, log)
                    }
                }
            }
        }
        catch (error) {
            exceptionHandler.handle(error, log)
        }
    },
})

async function queryActiveFlowsByPlatform(platformIds: string[]): Promise<Map<string, number>> {
    const rows = await flowRepo()
        .createQueryBuilder('flow')
        .innerJoin('flow.project', 'project')
        .select('project.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .where('flow.status = :status', { status: FlowStatus.ENABLED })
        .andWhere('project.platformId IN (:...platformIds)', { platformIds })
        .andWhere('project.deleted IS NULL')
        .groupBy('project.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

async function queryUsersByPlatform(platformIds: string[]): Promise<Map<string, number>> {
    const rows = await userRepo()
        .createQueryBuilder('user')
        .select('user.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .where('user.platformId IN (:...platformIds)', { platformIds })
        .groupBy('user.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

async function queryTeamProjectsByPlatform(platformIds: string[]): Promise<Map<string, number>> {
    const rows = await projectRepo()
        .createQueryBuilder('project')
        .select('project.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .where('project.type = :type', { type: ProjectType.TEAM })
        .andWhere('project.platformId IN (:...platformIds)', { platformIds })
        .andWhere('project.deleted IS NULL')
        .groupBy('project.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

/**
 * Counts only production runs because test runs (RunEnvironment.TESTING) are not billable. Scopes the
 * scan to the licensed platforms' projects and filters flow_run on projectId — which is what lets
 * PostgreSQL use the flow_run (projectId, environment, created, ...) indexes. A platformId join leaves
 * the index unusable (whole-table scan), and an unscoped created-only scan reads every platform's runs
 * cloud-wide; both trip the DB statement timeout. The projectIds are chunked so each aggregate stays
 * small and bounded. Projects are mapped back to platforms in app code.
 */
async function queryDailyExecutionsByPlatform(platformIds: string[], dayStart: string, dayEnd: string): Promise<Map<string, DailyExecutionCount[]>> {
    const projects = await projectRepo()
        .createQueryBuilder('project')
        .select('project.id', 'projectId')
        .addSelect('project.platformId', 'platformId')
        .where('project.platformId IN (:...platformIds)', { platformIds })
        .andWhere('project.deleted IS NULL')
        .getRawMany<{ projectId: string, platformId: string }>()

    const platformByProject = new Map(projects.map((project): [string, string] => [project.projectId, project.platformId]))
    const countsByPlatformDay = new Map<string, Map<string, number>>()

    for (const projectIds of chunk(projects.map((project) => project.projectId), EXECUTIONS_PROJECT_CHUNK_SIZE)) {
        // Throttle before every chunk so a large report doesn't monopolise the DB connection pool /
        // Postgres, leaving capacity for live request traffic while the (background) report runs.
        await sleep(EXECUTIONS_CHUNK_DELAY_MS)

        const rows = await flowRunRepo()
            .createQueryBuilder('flow_run')
            .select('flow_run.projectId', 'projectId')
            .addSelect('to_char(flow_run.created AT TIME ZONE \'UTC\', \'YYYY-MM-DD\')', 'day')
            .addSelect('COUNT(*)', 'count')
            .where('flow_run.projectId IN (:...projectIds)', { projectIds })
            .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
            .andWhere('flow_run.created >= :dayStart', { dayStart })
            .andWhere('flow_run.created < :dayEnd', { dayEnd })
            .groupBy('flow_run.projectId')
            .addGroupBy('to_char(flow_run.created AT TIME ZONE \'UTC\', \'YYYY-MM-DD\')')
            .getRawMany<{ projectId: string, day: string, count: string }>()

        for (const row of rows) {
            const platformId = platformByProject.get(row.projectId)
            if (!platformId) {
                continue
            }
            const dayCounts = countsByPlatformDay.get(platformId) ?? new Map<string, number>()
            dayCounts.set(row.day, (dayCounts.get(row.day) ?? 0) + Number(row.count))
            countsByPlatformDay.set(platformId, dayCounts)
        }
    }

    const map = new Map<string, DailyExecutionCount[]>()
    for (const [platformId, dayCounts] of countsByPlatformDay) {
        map.set(platformId, [...dayCounts.entries()].map(([date, count]): DailyExecutionCount => ({ date, count })))
    }
    return map
}

async function queryLicenseKeysByPlatform(): Promise<Map<string, string>> {
    const rows = await platformPlanRepo()
        .createQueryBuilder('platform_plan')
        .select('platform_plan.platformId', 'platformId')
        .addSelect('platform_plan.licenseKey', 'licenseKey')
        .where('platform_plan.licenseKey IS NOT NULL')
        .getRawMany<{ platformId: string, licenseKey: string }>()

    return new Map(rows.map((row): [string, string] => [row.platformId, row.licenseKey]))
}

function toCountMap(rows: { platformId: string, count: string }[]): Map<string, number> {
    return new Map(rows.map((row): [string, number] => [row.platformId, Number(row.count)]))
}

function buildSnapshotBody({
    platformId,
    activeFlows,
    users,
    projects,
    dailyExecutions,
    reportedAt,
}: {
    platformId: string
    activeFlows: number
    users: number
    projects: number
    dailyExecutions: DailyExecutionCount[]
    reportedAt: string
}): Record<string, unknown> {
    return {
        platform_id: platformId,
        active_flows: activeFlows,
        projects,
        users,
        daily_executions: dailyExecutions,
        reported_at: reportedAt,
    }
}

function utcMidnight(daysAgo: number): string {
    return dayjs.utc().startOf('day').subtract(daysAgo, 'day').toISOString()
}

async function postSnapshot({ body, licenseKey }: { body: Record<string, unknown>, licenseKey: string }): Promise<void> {
    const result = await tryCatch(() =>
        fetch(`${CONSOLE_API_URL}/api/external/usage/snapshot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${licenseKey}`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }),
    )

    if (result.error) {
        throw result.error
    }

    if (!result.data.ok) {
        throw new Error(`Console usage snapshot POST failed with status ${result.data.status}`)
    }
}

type DailyExecutionCount = {
    date: string
    count: number
}
