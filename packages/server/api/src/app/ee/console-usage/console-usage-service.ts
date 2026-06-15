import { chunk, FlowStatus, ProjectType, RunEnvironment, tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { exceptionHandler } from '../../helper/exception-handler'
import { projectRepo } from '../../project/project-repo'
import { userRepo } from '../../user/user-service'
import { platformPlanRepo } from '../platform/platform-plan/platform-plan.service'

dayjs.extend(utc)

const CONSOLE_API_URL = 'https://console.activepieces.com'
const REQUEST_TIMEOUT_MS = 30000
const SNAPSHOT_BATCH_SIZE = 25

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
    async reportAllPlatforms(range?: { from?: string, to?: string }): Promise<void> {
        const licenseKeysByPlatform = await queryLicenseKeysByPlatform()

        if (licenseKeysByPlatform.size === 0) {
            return
        }

        const platformIds = [...licenseKeysByPlatform.keys()]
        const entries = [...licenseKeysByPlatform.entries()]
        const backfill = range?.from && range?.to ? { from: range.from, to: range.to } : null

        const [
            activeFlowsByPlatform,
            usersByPlatform,
            teamProjectsByPlatform,
            dailyExecutionsByPlatform,
        ] = await Promise.all([
            queryActiveFlowsByPlatform(platformIds),
            queryUsersByPlatform(platformIds),
            queryTeamProjectsByPlatform(platformIds),
            queryDailyExecutionsByPlatform(
                platformIds,
                backfill ? dayjs.utc(backfill.from).startOf('day').toISOString() : utcMidnight(1),
                backfill ? dayjs.utc(backfill.to).startOf('day').add(1, 'day').toISOString() : utcMidnight(0),
            ),
        ])

        const gauges = { activeFlowsByPlatform, usersByPlatform, teamProjectsByPlatform, dailyExecutionsByPlatform }
        const tasks = backfill
            ? buildBackfillTasks({ entries, from: backfill.from, to: backfill.to, ...gauges })
            : buildDailyTasks({ entries, ...gauges })

        for (const batch of chunk(tasks, SNAPSHOT_BATCH_SIZE)) {
            const results = await Promise.allSettled(
                batch.map((task) => postSnapshot({ body: task.body, licenseKey: task.licenseKey })),
            )

            for (const result of results) {
                if (result.status === 'rejected') {
                    exceptionHandler.handle(result.reason, log)
                }
            }
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
 * Counts only production runs because test runs (RunEnvironment.TESTING) are not billable, and
 * scopes to licensed platforms while bounding on `created` so PostgreSQL hits the
 * flow_run (projectId, environment, ..., created) indexes instead of scanning the whole table.
 */
async function queryDailyExecutionsByPlatform(platformIds: string[], dayStart: string, dayEnd: string): Promise<Map<string, DailyExecutionCount[]>> {
    const rows = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .innerJoin('flow_run.project', 'project')
        .select('project.platformId', 'platformId')
        .addSelect('to_char(flow_run.created AT TIME ZONE \'UTC\', \'YYYY-MM-DD\')', 'day')
        .addSelect('COUNT(*)', 'count')
        .where('project.platformId IN (:...platformIds)', { platformIds })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .andWhere('flow_run.created >= :dayStart', { dayStart })
        .andWhere('flow_run.created < :dayEnd', { dayEnd })
        .groupBy('project.platformId')
        .addGroupBy('to_char(flow_run.created AT TIME ZONE \'UTC\', \'YYYY-MM-DD\')')
        .getRawMany<{ platformId: string, day: string, count: string }>()

    const map = new Map<string, DailyExecutionCount[]>()
    for (const row of rows) {
        const days = map.get(row.platformId) ?? []
        days.push({ date: row.day, count: Number(row.count) })
        map.set(row.platformId, days)
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

// Daily cron path (unchanged): one snapshot per platform for the previous completed UTC day, with the
// executions exactly as the window query returned them and `reported_at` stamped as-of now.
function buildDailyTasks({ entries, activeFlowsByPlatform, usersByPlatform, teamProjectsByPlatform, dailyExecutionsByPlatform }: SnapshotTaskInput): SnapshotTask[] {
    const reportedAt = new Date().toISOString()
    return entries.map(([platformId, licenseKey]) => ({
        licenseKey,
        body: buildSnapshotBody({
            platformId,
            activeFlows: activeFlowsByPlatform.get(platformId) ?? 0,
            users: usersByPlatform.get(platformId) ?? 0,
            projects: teamProjectsByPlatform.get(platformId) ?? 0,
            dailyExecutions: dailyExecutionsByPlatform.get(platformId) ?? [],
            reportedAt,
        }),
    }))
}

// Backfill path: one snapshot per (platform, day) across [from, to] inclusive, each stamped on its own
// day so the Console buckets them correctly (it keys days off `reported_at`, not the daily_executions
// dates). Gauges have no history, so every backfilled day carries the current point-in-time reading.
function buildBackfillTasks({ entries, from, to, activeFlowsByPlatform, usersByPlatform, teamProjectsByPlatform, dailyExecutionsByPlatform }: SnapshotTaskInput & { from: string, to: string }): SnapshotTask[] {
    const days = enumerateUtcDays(from, to)
    const countsByPlatformDay = indexCountsByPlatformDay(dailyExecutionsByPlatform)
    return days.flatMap((day) =>
        entries.map(([platformId, licenseKey]) => ({
            licenseKey,
            body: buildSnapshotBody({
                platformId,
                activeFlows: activeFlowsByPlatform.get(platformId) ?? 0,
                users: usersByPlatform.get(platformId) ?? 0,
                projects: teamProjectsByPlatform.get(platformId) ?? 0,
                dailyExecutions: [{ date: day, count: countsByPlatformDay.get(platformId)?.get(day) ?? 0 }],
                reportedAt: `${day}T12:00:00.000Z`,
            }),
        })),
    )
}

function enumerateUtcDays(from: string, to: string): string[] {
    const days: string[] = []
    const end = dayjs.utc(to).startOf('day')
    let cursor = dayjs.utc(from).startOf('day')
    while (!cursor.isAfter(end)) {
        days.push(cursor.format('YYYY-MM-DD'))
        cursor = cursor.add(1, 'day')
    }
    return days
}

function indexCountsByPlatformDay(dailyExecutionsByPlatform: Map<string, DailyExecutionCount[]>): Map<string, Map<string, number>> {
    const byPlatform = new Map<string, Map<string, number>>()
    for (const [platformId, days] of dailyExecutionsByPlatform) {
        byPlatform.set(platformId, new Map(days.map((day): [string, number] => [day.date, day.count])))
    }
    return byPlatform
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

type SnapshotTask = {
    licenseKey: string
    body: Record<string, unknown>
}

type SnapshotTaskInput = {
    entries: [string, string][]
    activeFlowsByPlatform: Map<string, number>
    usersByPlatform: Map<string, number>
    teamProjectsByPlatform: Map<string, number>
    dailyExecutionsByPlatform: Map<string, DailyExecutionCount[]>
}
