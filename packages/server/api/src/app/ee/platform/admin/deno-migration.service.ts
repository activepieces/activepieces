import { FlowVersionId, isNil, sanitizeObjectForPostgresql, unique } from '@activepieces/core-utils'
import { Flow, FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FindOptionsWhere, In } from 'typeorm'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { flowVersionRepo, flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { projectService } from '../../../project/project-service'

export const denoMigrationService = (log: FastifyBaseLogger) => ({
    async migrateToDeno({ platformId, projectId, flowIds }: MigrateToDenoParams): Promise<MigrateToDenoResult> {
        const where = await buildFlowsFilter({ log, platformId, projectId, flowIds })
        let flowsProcessed = 0
        let flowVersionsMigrated = 0
        let skip = 0
        for (;;) {
            const flows = await flowRepo().find({ where, skip, take: PAGE_SIZE, order: { created: 'ASC' } })
            if (flows.length === 0) {
                break
            }
            const versionIds = await collectTargetVersionIds({ log, flows })
            for (const versionId of versionIds) {
                flowVersionsMigrated += await enableDenoOnVersion(versionId)
            }
            flowsProcessed += flows.length
            skip += flows.length
            log.info({ platform: { id: platformId }, project: { id: projectId }, flowsProcessed, flowVersionsMigrated }, 'Migrated flows page to deno')
        }
        return { flowsProcessed, flowVersionsMigrated }
    },
})

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

async function collectTargetVersionIds({ log, flows }: { log: FastifyBaseLogger, flows: Flow[] }): Promise<FlowVersionId[]> {
    const latestVersions = await flowVersionService(log).getLatestVersionsByFlowIds(flows.map((flow) => flow.id))
    const latestVersionIds = Array.from(latestVersions.values()).map((version) => version.id)
    const publishedVersionIds = flows.map((flow) => flow.publishedVersionId).filter((versionId): versionId is FlowVersionId => !isNil(versionId))
    return unique([...latestVersionIds, ...publishedVersionIds])
}

async function enableDenoOnVersion(versionId: FlowVersionId): Promise<number> {
    const flowVersion = await flowVersionRepo().findOneBy({ id: versionId })
    if (isNil(flowVersion)) {
        return 0
    }
    if (!hasCodeStepWithoutDeno(flowVersion)) {
        return 0
    }
    const migratedVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.type !== FlowActionType.CODE) {
            return step
        }
        return { ...step, settings: { ...step.settings, useDeno: true } }
    })
    await flowVersionRepo().update(versionId, { trigger: sanitizeObjectForPostgresql(migratedVersion.trigger) })
    return 1
}

function hasCodeStepWithoutDeno(flowVersion: FlowVersion): boolean {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .some((step) => step.type === FlowActionType.CODE && step.settings.useDeno !== true)
}

type MigrateToDenoParams = {
    platformId?: string
    projectId?: string
    flowIds?: string[]
}

type MigrateToDenoResult = {
    flowsProcessed: number
    flowVersionsMigrated: number
}
