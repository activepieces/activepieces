import {
    ActivepiecesError,
    ApId,
    apId,
    AppConnectionOwners,
    Cursor,
    ErrorCode,
    isNil,
    Metadata,
    PlatformId,
    ProjectId,
    SeekPage,
    spreadIfDefined,
    unique,
    User,
    UserId,
    UserIdentity,
    UserWithMetaInformation,
    Variable,
    VariableWithoutSensitiveData,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, ILike } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { flowService } from '../flows/flow/flow.service'
import { encryptUtils } from '../helper/encryption'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { VariableEntity, VariableSchema } from './variable.entity'

export const variableRepo = repoFactory(VariableEntity)

export const variableService = (log: FastifyBaseLogger) => ({
    async upsert(params: UpsertParams): Promise<VariableWithoutSensitiveData> {
        const { projectId, platformId, name, value, ownerId, metadata } = params

        const existing = await variableRepo().findOneBy({ projectId, name })
        const encryptedValue = await encryptUtils.encryptObject({ secret_text: value })

        const id = existing?.id ?? apId()
        const row = {
            id,
            projectId,
            platformId,
            name,
            ownerId: existing?.ownerId ?? ownerId ?? null,
            value: encryptedValue,
            ...spreadIfDefined('metadata', metadata ?? existing?.metadata ?? undefined),
        }
        await variableRepo().upsert(row, ['id'])
        log.info({ id, projectId, name }, 'Variable upserted')
        return getOneOrThrowWithoutValue({ id, projectId, platformId })
    },

    async list(params: ListParams): Promise<SeekPage<VariableWithoutSensitiveData>> {
        const { projectId, platformId, cursor, limit, name } = params
        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
        const paginator = buildPaginator({
            entity: VariableEntity,
            query: {
                limit: limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = variableRepo()
            .createQueryBuilder('variable')
            .leftJoinAndSelect('variable.owner', 'owner')
            .leftJoinAndSelect('owner.identity', 'owner_identity')
            .where({
                projectId: Equal(projectId),
                platformId: Equal(platformId),
                ...(isNil(name) ? {} : { name: ILike(`%${name}%`) }),
            })

        const { data, cursor: nextCursor } = await paginator.paginate(queryBuilder)
        const flowIdsByName = await fetchFlowIdsForVariables(log, data)
        const sanitized = data.map((row) => ({
            ...stripSensitiveData(row),
            flowIds: flowIdsByName.get(row.name) ?? [],
        }))
        return paginationHelper.createPage<VariableWithoutSensitiveData>(sanitized, nextCursor)
    },

    async getOwners(params: { projectId: ProjectId, platformId: PlatformId }): Promise<AppConnectionOwners[]> {
        const { projectId, platformId } = params
        const rows = await variableRepo()
            .createQueryBuilder('variable')
            .leftJoinAndSelect('variable.owner', 'owner')
            .leftJoinAndSelect('owner.identity', 'owner_identity')
            .where({ projectId: Equal(projectId), platformId: Equal(platformId) })
            .getMany()
        const owners: AppConnectionOwners[] = []
        for (const row of rows) {
            const identity = row.owner?.identity
            if (isNil(identity)) {
                continue
            }
            owners.push({
                firstName: identity.firstName,
                lastName: identity.lastName,
                email: identity.email,
            })
        }
        return unique(owners)
    },

    async getOneOrThrowWithoutValue(params: GetOneParams): Promise<VariableWithoutSensitiveData> {
        return getOneOrThrowWithoutValue(params)
    },

    async getDecryptedValue(params: GetOneParams): Promise<string> {
        const { id, projectId, platformId } = params
        const row = await variableRepo().findOneBy({ id, projectId, platformId })
        if (isNil(row)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'Variable',
                },
            })
        }
        const decrypted = await encryptUtils.decryptObject<{ secret_text: string }>(row.value)
        return decrypted.secret_text
    },

    async getDecryptedValueForWorker(params: GetForWorkerParams): Promise<string> {
        const { projectId, name } = params
        const row = await variableRepo().findOneBy({ projectId, name })
        if (isNil(row)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `name=${name}`,
                    entityType: 'Variable',
                },
            })
        }
        const decrypted = await encryptUtils.decryptObject<{ secret_text: string }>(row.value)
        return decrypted.secret_text
    },

    async delete(params: GetOneParams): Promise<VariableWithoutSensitiveData> {
        const target = await getOneOrThrowWithoutValue(params)
        await variableRepo().delete({ id: params.id, projectId: params.projectId, platformId: params.platformId })
        log.info({ id: params.id, projectId: params.projectId }, 'Variable deleted')
        return target
    },
})

async function getOneOrThrowWithoutValue(params: GetOneParams): Promise<VariableWithoutSensitiveData> {
    const { id, projectId, platformId } = params
    const row = await variableRepo()
        .createQueryBuilder('variable')
        .leftJoinAndSelect('variable.owner', 'owner')
        .leftJoinAndSelect('owner.identity', 'owner_identity')
        .where({ id, projectId, platformId })
        .getOne()
    if (isNil(row)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: id,
                entityType: 'Variable',
            },
        })
    }
    return stripSensitiveData(row)
}

function stripSensitiveData(row: VariableSchema): VariableWithoutSensitiveData {
    return {
        id: row.id,
        created: row.created,
        updated: row.updated,
        name: row.name,
        projectId: row.projectId,
        platformId: row.platformId,
        ownerId: row.ownerId,
        owner: mapToUserWithMetaInformation(row.owner ?? null),
        metadata: row.metadata,
        flowIds: null,
    }
}

const VARIABLE_MENTION_REGEX = /variables\['([^']+)'\]/g

async function fetchFlowIdsForVariables(
    log: FastifyBaseLogger,
    variables: VariableSchema[],
): Promise<Map<string, string[]>> {
    const flowIdsByName = new Map<string, string[]>()
    if (variables.length === 0) {
        return flowIdsByName
    }
    const projectIds = Array.from(new Set(variables.map((v) => v.projectId)))
    const variableNames = new Set(variables.map((v) => v.name))

    const flowsPage = await flowService(log).list({
        projectIds,
        cursorRequest: null,
    })

    for (const flow of flowsPage.data) {
        const triggerJson = JSON.stringify(flow.version?.trigger ?? {})
        const matched = new Set<string>()
        let match: RegExpExecArray | null
        VARIABLE_MENTION_REGEX.lastIndex = 0
        while ((match = VARIABLE_MENTION_REGEX.exec(triggerJson)) !== null) {
            if (variableNames.has(match[1])) {
                matched.add(match[1])
            }
        }
        for (const name of matched) {
            const ids = flowIdsByName.get(name) ?? []
            ids.push(flow.id)
            flowIdsByName.set(name, ids)
        }
    }

    return flowIdsByName
}

function mapToUserWithMetaInformation(owner: (User & { identity?: UserIdentity }) | null): UserWithMetaInformation | null {
    if (isNil(owner)) {
        return null
    }
    const identity = owner.identity
    if (isNil(identity)) {
        return null
    }
    return {
        id: owner.id,
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        platformId: owner.platformId,
        platformRole: owner.platformRole,
        status: owner.status,
        externalId: owner.externalId,
        created: owner.created,
        updated: owner.updated,
    }
}

type UpsertParams = {
    projectId: string
    platformId: string
    name: string
    value: string
    ownerId: UserId | null
    metadata: Metadata | undefined
}

type GetOneParams = {
    id: ApId
    projectId: string
    platformId: string
}

type GetForWorkerParams = {
    projectId: string
    name: string
}

type ListParams = {
    projectId: string
    platformId: string
    cursor: Cursor | undefined
    limit: number | undefined
    name: string | undefined
}

export type { Variable }
