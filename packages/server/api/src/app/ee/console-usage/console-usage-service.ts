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
const COMPLETED_DAYS_WINDOW = 2
const SNAPSHOT_BATCH_SIZE = 25

export const consoleUsageService = (log: FastifyBaseLogger) => ({
    /**
     * Reports per-platform usage to the Console for billing/metering — this is NOT telemetry, so it
     * is intentionally not gated on AP_TELEMETRY_ENABLED. The license key is both the gate and the
     * credential: only licensed platforms are reported, and the key is sent as the Bearer token the
     * Console validates. Unlicensed instances bail before the heavy aggregate queries, so they send
     * nothing. Only *completed* UTC days are reported (the current day is excluded), so each
     * (platform, day) count is final on first send; the 2-day window gives a one-day healing margin
     * for a missed run, and re-sends carry the same value — letting the Console store them with a
     * plain idempotent upsert, no max-merge.
     */
    async reportAllPlatforms(): Promise<void> {
        const licenseKeysByPlatform = await queryLicenseKeysByPlatform()

        if (licenseKeysByPlatform.size === 0) {
            return
        }

        const platformIds = [...licenseKeysByPlatform.keys()]
        const windowStart = utcMidnight(COMPLETED_DAYS_WINDOW)
        const todayStart = utcMidnight(0)

        const [
            activeFlowsByPlatform,
            usersByPlatform,
            teamProjectsByPlatform,
            dailyExecutionsByPlatform,
        ] = await Promise.all([
            queryActiveFlowsByPlatform(platformIds),
            queryUsersByPlatform(platformIds),
            queryTeamProjectsByPlatform(platformIds),
            queryDailyExecutionsByPlatform(platformIds, windowStart, todayStart),
        ])

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
async function queryDailyExecutionsByPlatform(platformIds: string[], windowStart: string, todayStart: string): Promise<Map<string, DailyExecutionCount[]>> {
    const rows = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .innerJoin('flow_run.project', 'project')
        .select('project.platformId', 'platformId')
        .addSelect('to_char(flow_run.created AT TIME ZONE \'UTC\', \'YYYY-MM-DD\')', 'day')
        .addSelect('COUNT(*)', 'count')
        .where('project.platformId IN (:...platformIds)', { platformIds })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .andWhere('flow_run.created >= :windowStart', { windowStart })
        .andWhere('flow_run.created < :todayStart', { todayStart })
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
