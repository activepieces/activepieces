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
        await variableRepo().upsert(
            {
                id: apId(),
                projectId,
                platformId,
                name,
                ownerId: ownerId ?? null,
                value: await encryptUtils.encryptObject({ secret_text: value }),
                ...spreadIfDefined('metadata', metadata),
            },
            ['projectId', 'name'],
        )
        const row = await variableRepo().findOneByOrFail({ projectId, name })
        log.info({ id: row.id, projectId, name }, 'Variable upserted')
        return getOneOrThrowWithoutValue({ id: row.id, projectId, platformId })
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
        const flowIdsByName = await fetchFlowIdsForVariables(log, projectId, data)
        const sanitized = data.map((row) => ({
            ...stripSensitiveData(row),
            flowIds: flowIdsByName.get(row.name) ?? [],
        }))
        return paginationHelper.createPage<VariableWithoutSensitiveData>(sanitized, nextCursor)
    },

    async getOwners(params: { projectId: ProjectId, platformId: PlatformId }): Promise<AppConnectionOwners[]> {
        const { projectId, platformId } = params
        return variableRepo()
            .createQueryBuilder('variable')
            .innerJoin('variable.owner', 'owner')
            .innerJoin('owner.identity', 'owner_identity')
            .select('owner_identity.firstName', 'firstName')
            .addSelect('owner_identity.lastName', 'lastName')
            .addSelect('owner_identity.email', 'email')
            .where('variable.projectId = :projectId', { projectId })
            .andWhere('variable.platformId = :platformId', { platformId })
            .distinct(true)
            .limit(MAX_VARIABLE_OWNERS)
            .getRawMany<AppConnectionOwners>()
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

async function fetchFlowIdsForVariables(
    log: FastifyBaseLogger,
    projectId: ProjectId,
    variables: VariableSchema[],
): Promise<Map<string, string[]>> {
    const flowIdsByName = new Map<string, string[]>()
    if (variables.length === 0) {
        return flowIdsByName
    }
    const variableNames = variables.map((v) => v.name)

    const flowsPage = await flowService(log).list({
        projectIds: [projectId],
        cursorRequest: null,
        variableNames,
    })

    for (const flow of flowsPage.data) {
        for (const name of flow.version?.variableNames ?? []) {
            if (!variableNames.includes(name)) {
                continue
            }
            const ids = flowIdsByName.get(name) ?? []
            ids.push(flow.id)
            flowIdsByName.set(name, ids)
        }
    }

    return flowIdsByName
}

const MAX_VARIABLE_OWNERS = 200

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
