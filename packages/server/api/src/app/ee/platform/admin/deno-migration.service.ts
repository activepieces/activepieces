import { FlowVersionId, isNil, sanitizeObjectForPostgresql, tryCatch, unique } from '@activepieces/core-utils'
import { Flow, FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FindOptionsWhere, In } from 'typeorm'
import { websocketService } from '../../../core/websockets.service'
import { fileService } from '../../../file/file.service'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowVersionRepo } from '../../../flows/flow-version/flow-version.service'
import { projectService } from '../../../project/project-service'

export const denoMigrationService = (log: FastifyBaseLogger) => ({
    async migrateToDeno(params: MigrateToDenoParams): Promise<MigrateToDenoResult> {
        return applyUseDeno({ log, ...params, useDeno: true })
    },
    async revertFromDeno(params: MigrateToDenoParams): Promise<MigrateToDenoResult> {
        return applyUseDeno({ log, ...params, useDeno: false })
    },
})

const PAGE_SIZE = 100

async function applyUseDeno({ log, platformId, projectId, flowIds, useDeno }: { log: FastifyBaseLogger, useDeno: boolean } & MigrateToDenoParams): Promise<MigrateToDenoResult> {
    const where = await buildFlowsFilter({ log, platformId, projectId, flowIds })
    const totals: MigrateToDenoResult = { flowsProcessed: 0, flowVersionsMigrated: 0, notifiedFlows: 0 }
    let skip = 0
    for (;;) {
        const flows = await flowRepo().find({ where, skip, take: PAGE_SIZE, order: { created: 'ASC' } })
        if (flows.length === 0) {
            break
        }
        for (const flow of flows) {
            const outcome = await migrateFlow({ log, flow, useDeno })
            totals.flowVersionsMigrated += outcome.versionsMigrated
            totals.notifiedFlows += outcome.notified ? 1 : 0
        }
        totals.flowsProcessed += flows.length
        skip += flows.length
        log.info({ platform: { id: platformId }, project: { id: projectId }, useDeno, ...totals }, 'Applied deno flag to flows page')
    }
    return totals
}

async function buildFlowsFilter({ log, platformId, projectId, flowIds }: { log: FastifyBaseLogger } & MigrateToDenoParams): Promise<FindOptionsWhere<Flow>> {
    if (!isNil(flowIds)) {
        return { id: In(flowIds) }
    }
    if (!isNil(projectId)) {
        return { projectId }
    }
    if (isNil(platformId)) {
        throw new Error('one of platformId, projectId or flowIds must be provided')
    }
    const projectIds = await projectService(log).getProjectIdsByPlatform(platformId)
    return { projectId: In(projectIds) }
}

async function migrateFlow({ log, flow, useDeno }: { log: FastifyBaseLogger, flow: Flow, useDeno: boolean }): Promise<FlowMigrationOutcome> {
    const latestVersion = await flowVersionRepo().findOne({ where: { flowId: flow.id }, order: { created: 'DESC' } })
    if (isNil(latestVersion)) {
        return { versionsMigrated: 0, notified: false }
    }

    const targetVersionIds = unique([latestVersion.id, ...isNil(flow.publishedVersionId) ? [] : [flow.publishedVersionId]])
    let versionsMigrated = 0
    let publishedVersionMigrated = false
    for (const versionId of targetVersionIds) {
        const migrated = await setUseDenoOnVersion({ versionId, useDeno })
        versionsMigrated += migrated
        publishedVersionMigrated = publishedVersionMigrated || (migrated > 0 && versionId === flow.publishedVersionId)
    }

    if (publishedVersionMigrated && !isNil(flow.publishedVersionId)) {
        await refreshWorkersForPublishedVersion({ log, flow, publishedVersionId: flow.publishedVersionId })
    }
    return { versionsMigrated, notified: publishedVersionMigrated }
}

async function refreshWorkersForPublishedVersion({ log, flow, publishedVersionId }: { log: FastifyBaseLogger, flow: Flow, publishedVersionId: FlowVersionId }): Promise<void> {
    const { error } = await tryCatch(() => fileService(log).delete({ projectId: flow.projectId, fileId: publishedVersionId }))
    if (error) {
        log.debug({ flowVersion: { id: publishedVersionId }, error: String(error) }, 'No stored flow bundle to delete')
    }
    websocketService.notifyWorkers().flowPublished({ flowId: flow.id, flowVersionId: publishedVersionId, projectId: flow.projectId })
}

async function setUseDenoOnVersion({ versionId, useDeno }: { versionId: FlowVersionId, useDeno: boolean }): Promise<number> {
    const flowVersion = await flowVersionRepo().findOneBy({ id: versionId })
    if (isNil(flowVersion)) {
        return 0
    }
    if (!hasCodeStepToChange({ flowVersion, useDeno })) {
        return 0
    }
    const migratedVersion = setUseDenoOnCodeSteps({ flowVersion, useDeno })
    await flowVersionRepo().update(versionId, { trigger: sanitizeObjectForPostgresql(migratedVersion.trigger) })
    return 1
}

function setUseDenoOnCodeSteps({ flowVersion, useDeno }: { flowVersion: FlowVersion, useDeno: boolean }): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.type !== FlowActionType.CODE) {
            return step
        }
        return { ...step, settings: { ...step.settings, useDeno } }
    })
}

function hasCodeStepToChange({ flowVersion, useDeno }: { flowVersion: FlowVersion, useDeno: boolean }): boolean {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .some((step) => step.type === FlowActionType.CODE && (step.settings.useDeno === true) !== useDeno)
}

type MigrateToDenoParams = {
    platformId?: string
    projectId?: string
    flowIds?: string[]
}

type FlowMigrationOutcome = {
    versionsMigrated: number
    notified: boolean
}

type MigrateToDenoResult = {
    flowsProcessed: number
    flowVersionsMigrated: number
    notifiedFlows: number
}
