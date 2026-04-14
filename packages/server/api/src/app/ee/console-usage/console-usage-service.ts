import { ApEdition, FlowStatus, isEmpty, isNil, ProjectType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { exceptionHandler } from '../../helper/exception-handler'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformService } from '../../platform/platform.service'
import { projectRepo } from '../../project/project-repo'
import { userRepo } from '../../user/user-service'
import { platformPlanRepo } from '../platform/platform-plan/platform-plan.service'

const CONSOLE_API_URL = 'https://console.activepieces.com'
const CLOUD_API_URL = 'https://cloud.activepieces.com'
const CONSOLE_API_KEY = system.get(AppSystemProp.CONSOLE_API_KEY)

export const consoleUsageService = (log: FastifyBaseLogger) => ({
    async reportAllPlatforms(): Promise<void> {
        const edition = system.getEdition()
        const isCloud = edition === ApEdition.CLOUD

        if (!isCloud) {
            const telemetryEnabled = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED)
            if (!telemetryEnabled) {
                return
            }
        }

        if (isCloud && isNil(CONSOLE_API_KEY)) {
            return
        }

        const [
            activeFlowsByPlatform,
            usersByPlatform,
            teamProjectsByPlatform,
            executionsByPlatform,
            licenseKeysByPlatform,
        ] = await Promise.all([
            queryActiveFlowsByPlatform(),
            queryUsersByPlatform(),
            queryTeamProjectsByPlatform(),
            queryExecutionsByPlatform(),
            queryLicenseKeysByPlatform(),
        ])

        const platforms = await platformService(log).getAll()
        const reportedAt = new Date().toISOString()

        const results = await Promise.allSettled(
            platforms.map((platform) => {
                const body = buildSnapshotBody({
                    platformId: platform.id,
                    activeFlows: activeFlowsByPlatform.get(platform.id) ?? 0,
                    users: usersByPlatform.get(platform.id) ?? 0,
                    projects: teamProjectsByPlatform.get(platform.id) ?? 0,
                    executions: executionsByPlatform.get(platform.id) ?? 0,
                    licenseKey: licenseKeysByPlatform.get(platform.id) ?? null,
                    reportedAt,
                })
                return CONSOLE_API_KEY
                    ? postSnapshot({ url: `${CONSOLE_API_URL}/api/external/usage/snapshot`, body, apiKey: CONSOLE_API_KEY })
                    : postSnapshot({ url: `${CLOUD_API_URL}/api/v1/console-usage/snapshots`, body })
            }),
        )

        for (const result of results) {
            if (result.status === 'rejected') {
                exceptionHandler.handle(result.reason, log)
            }
        }
    },

    processRelayedSnapshot(snapshot: Record<string, unknown>): void {
        if (system.getEdition() !== ApEdition.CLOUD || isNil(CONSOLE_API_KEY)) {
            return
        }
        rejectedPromiseHandler(
            postSnapshot({ url: `${CONSOLE_API_URL}/api/external/usage/snapshot`, body: snapshot, apiKey: CONSOLE_API_KEY }),
            log,
        )
    },
})

async function queryActiveFlowsByPlatform(): Promise<Map<string, number>> {
    const rows = await flowRepo()
        .createQueryBuilder('flow')
        .innerJoin('flow.project', 'project')
        .select('project.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .where('flow.status = :status', { status: FlowStatus.ENABLED })
        .groupBy('project.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

async function queryUsersByPlatform(): Promise<Map<string, number>> {
    const rows = await userRepo()
        .createQueryBuilder('user')
        .select('user.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('user.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

async function queryTeamProjectsByPlatform(): Promise<Map<string, number>> {
    const rows = await projectRepo()
        .createQueryBuilder('project')
        .select('project.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .where('project.type = :type', { type: ProjectType.TEAM })
        .groupBy('project.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

async function queryExecutionsByPlatform(): Promise<Map<string, number>> {
    const rows = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .innerJoin('flow_run.project', 'project')
        .select('project.platformId', 'platformId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('project.platformId')
        .getRawMany<{ platformId: string, count: string }>()

    return toCountMap(rows)
}

async function queryLicenseKeysByPlatform(): Promise<Map<string, string>> {
    const rows = await platformPlanRepo()
        .createQueryBuilder('platform_plan')
        .select('platform_plan.platformId', 'platformId')
        .addSelect('platform_plan.licenseKey', 'licenseKey')
        .where('platform_plan.licenseKey IS NOT NULL')
        .getRawMany<{ platformId: string, licenseKey: string }>()

    const map = new Map<string, string>()
    for (const row of rows) {
        map.set(row.platformId, row.licenseKey)
    }
    return map
}

function toCountMap(rows: { platformId: string, count: string }[]): Map<string, number> {
    const map = new Map<string, number>()
    for (const row of rows) {
        map.set(row.platformId, parseInt(row.count, 10))
    }
    return map
}

function buildSnapshotBody({
    platformId,
    activeFlows,
    users,
    projects,
    executions,
    licenseKey,
    reportedAt,
}: {
    platformId: string
    activeFlows: number
    users: number
    projects: number
    executions: number
    licenseKey: string | null
    reportedAt: string
}): Record<string, unknown> {
    const body: Record<string, unknown> = {
        platform_id: platformId,
        executions,
        active_flows: activeFlows,
        projects,
        users,
        reported_at: reportedAt,
    }

    if (!isNil(licenseKey) && !isEmpty(licenseKey)) {
        body.key_value = licenseKey
    }

    return body
}

async function postSnapshot({ url, body, apiKey }: { url: string, body: Record<string, unknown>, apiKey?: string }): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
    }

    const result = await tryCatch(() =>
        fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        }),
    )

    if (result.error) {
        throw result.error
    }

    if (!result.data.ok) {
        throw new Error(`Console usage POST to ${url} failed with status ${result.data.status}`)
    }
}
