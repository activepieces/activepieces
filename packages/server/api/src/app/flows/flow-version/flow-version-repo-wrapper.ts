import { FlowVersion, isNil, spreadIfDefined } from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from './flow-version-entity'
import { flowVersionMigrationService } from './flow-version-migration.service'

const flowVersionRepo = repoFactory(FlowVersionEntity)

export const flowVersionRepoWrapper = {
    async find(options: FindOptions): Promise<FlowVersion[]> {
        const flowVersions = await flowVersionRepo().find(options)
        const migratedFlowVersions = await Promise.all(flowVersions.map(flowVersion => flowVersionMigrationService.migrate(flowVersion)))
        return migratedFlowVersions
    },
    async findOne(options: FindOneOptions, entityManager?: EntityManager): Promise<FlowVersion | null> {
        const flowVersion = await flowVersionRepo(entityManager).findOne(options)
        if (isNil(flowVersion)) {
            return null
        }
        return flowVersionMigrationService.migrate(flowVersion)
    },
    async findOneOrFail(options: FindOneOptions, entityManager?: EntityManager): Promise<FlowVersion> {
        const flowVersion = await flowVersionRepo(entityManager).findOneOrFail(options)
        return flowVersionMigrationService.migrate(flowVersion)
    },
    async exists(options: ExistsOptions): Promise<boolean> {
        return flowVersionRepo().exists(options)
    },
    async save(params: SaveParams): Promise<FlowVersion> {
        return flowVersionRepo(params.entityManager).save(params.flowVersion)
    },
    async update(params: UpdateParams) {
        return flowVersionRepo().update(params.id, {
            ...spreadIfDefined('displayName', params.flowVersion.displayName),
            ...spreadIfDefined('trigger', params.flowVersion.trigger),
            ...spreadIfDefined('valid', params.flowVersion.valid),
            ...spreadIfDefined('updatedBy', params.flowVersion.updatedBy),
            ...spreadIfDefined('schemaVersion', params.flowVersion.schemaVersion),
            ...spreadIfDefined('state', params.flowVersion.state),
            ...spreadIfDefined('connectionIds', params.flowVersion.connectionIds),
        })
    },
    createQueryBuilder() {
        return flowVersionRepo().createQueryBuilder('flow_version')
    },
}

type WhereOptions = Record<string, unknown> | Record<string, unknown>[]
type OrderOptions = Record<string, 'ASC' | 'DESC'>

type FindOptions = {
    where?: WhereOptions
    order?: OrderOptions
}

type FindOneOptions = {
    where: WhereOptions
    order?: OrderOptions
}

type ExistsOptions = {
    where: WhereOptions
}

type SaveParams = {
    flowVersion: FlowVersion | Omit<FlowVersion, 'created' | 'updated'>
    entityManager?: EntityManager
}

type UpdateParams = {
    id: string
    flowVersion: Partial<FlowVersion>
}