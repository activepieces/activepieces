import { FlowVersionId, isNil, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { Flow, FlowActionType, FlowOperationType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FindOptionsWhere, In } from 'typeorm'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowService } from '../../../flows/flow/flow.service'
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

async function applyUseDeno({ log, platformId, projectId, flowIds, useDeno }: { log: FastifyBaseLogger, useDeno: boolean } & MigrateToDenoParams): Promise<MigrateToDenoResult> {
    const where = await buildFlowsFilter({ log, platformId, projectId, flowIds })
    const totals: MigrateToDenoResult = { flowsProcessed: 0, republishedFlows: 0, flowVersionsMigrated: 0, staleFlows: 0 }
    let skip = 0
    for (;;) {
        const flows = await flowRepo().find({ where, skip, take: PAGE_SIZE, order: { created: 'ASC' } })
        if (flows.length === 0) {
            break
        }
        for (const flow of flows) {
            const outcome = await migrateFlow({ log, flow, useDeno })
            totals.republishedFlows += outcome.republished ? 1 : 0
            totals.flowVersionsMigrated += outcome.versionsMigratedInPlace
            totals.staleFlows += outcome.stale ? 1 : 0
        }
        totals.flowsProcessed += flows.length
        skip += flows.length
        log.info({ platform: { id: platformId }, project: { id: projectId }, useDeno, ...totals }, 'Applied deno flag to flows page')
    }
    return totals
}

const PAGE_SIZE = 100

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
        return { republished: false, versionsMigratedInPlace: 0, stale: false }
    }

    const publishedIsLatest = !isNil(flow.publishedVersionId) && flow.publishedVersionId === latestVersion.id
    if (publishedIsLatest) {
        if (!hasCodeStepToChange({ flowVersion: latestVersion, useDeno })) {
            return { republished: false, versionsMigratedInPlace: 0, stale: false }
        }
        await republishWithUseDeno({ log, flow, publishedVersion: latestVersion, useDeno })
        return { republished: true, versionsMigratedInPlace: 0, stale: false }
    }

    let versionsMigratedInPlace = await setUseDenoOnVersion({ versionId: latestVersion.id, useDeno })
    let stale = false
    if (!isNil(flow.publishedVersionId)) {
        const publishedMigrated = await setUseDenoOnVersion({ versionId: flow.publishedVersionId, useDeno })
        versionsMigratedInPlace += publishedMigrated
        stale = publishedMigrated > 0
    }
    return { republished: false, versionsMigratedInPlace, stale }
}

async function republishWithUseDeno({ log, flow, publishedVersion, useDeno }: { log: FastifyBaseLogger, flow: Flow, publishedVersion: FlowVersion, useDeno: boolean }): Promise<void> {
    const migratedVersion = setUseDenoOnCodeSteps({ flowVersion: publishedVersion, useDeno })
    const flowPlatformId = await projectService(log).getPlatformId(flow.projectId)
    await flowService(log).update({
        id: flow.id,
        projectId: flow.projectId,
        platformId: flowPlatformId,
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: migratedVersion.displayName,
                trigger: migratedVersion.trigger,
                schemaVersion: migratedVersion.schemaVersion,
                notes: migratedVersion.notes,
            },
        },
    })
    await flowService(log).update({
        id: flow.id,
        projectId: flow.projectId,
        platformId: flowPlatformId,
        operation: {
            type: FlowOperationType.LOCK_AND_PUBLISH,
            request: { status: flow.status },
        },
    })
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
    republished: boolean
    versionsMigratedInPlace: number
    stale: boolean
}

type MigrateToDenoResult = {
    flowsProcessed: number
    republishedFlows: number
    flowVersionsMigrated: number
    staleFlows: number
}
