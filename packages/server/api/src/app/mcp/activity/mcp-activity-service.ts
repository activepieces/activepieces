import { ActivepiecesError, ErrorCode, isNil, unique } from '@activepieces/core-utils'
import {
    FileType,
    ListMcpActivityResponse,
    McpActivity,
    McpActivityPayload,
    McpActivityStatus,
    PLATFORM_WIDE_PROJECT_FILTER,
    PopulatedMcpActivity,
    UserWithMetaInformation,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Brackets, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { z } from 'zod'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectRepo } from '../../project/project-repo'
import { userRepo } from '../../user/user-service'
import { ACTIVITY_ALIAS, McpActivityEntity } from './mcp-activity-entity'

const repo = repoFactory(McpActivityEntity)

const DEFAULT_ACTIVITY_PAGE_SIZE = 20

export const mcpActivityService = (log: FastifyBaseLogger) => ({
    async list({ platformId, userId, projectIds, memberIds, statuses, createdAfter, createdBefore, cursor, limit }: ListParams): Promise<ListMcpActivityResponse> {
        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
        const paginator = buildPaginator({
            entity: McpActivityEntity,
            query: {
                limit: limit ?? DEFAULT_ACTIVITY_PAGE_SIZE,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = repo().createQueryBuilder(ACTIVITY_ALIAS)
            .where(`${ACTIVITY_ALIAS}."platformId" = :platformId`, { platformId })
        if (!isNil(userId)) {
            queryBuilder.andWhere(`${ACTIVITY_ALIAS}."userId" = :userId`, { userId })
        }
        if (!isNil(memberIds)) {
            queryBuilder.andWhere(`${ACTIVITY_ALIAS}."userId" IN (:...memberIds)`, { memberIds })
        }
        if (!isNil(statuses)) {
            queryBuilder.andWhere(`${ACTIVITY_ALIAS}."status" IN (:...statuses)`, { statuses })
        }
        if (!isNil(createdAfter)) {
            queryBuilder.andWhere(`${ACTIVITY_ALIAS}."created" >= :createdAfter`, { createdAfter })
        }
        if (!isNil(createdBefore)) {
            queryBuilder.andWhere(`${ACTIVITY_ALIAS}."created" <= :createdBefore`, { createdBefore })
        }
        applyProjectFilter({ queryBuilder, projectIds })

        const { data, cursor: nextCursor } = await paginator.paginate(queryBuilder)

        const [members, projectNames, connectionNames] = await Promise.all([
            findMembers(data.map((activity) => activity.userId)),
            findProjectNames(data.map((activity) => activity.projectId)),
            findConnectionNames({ platformId, activities: data }),
        ])

        const rows = data.map((activity) => toPopulatedMcpActivity({ activity, members, projectNames, connectionNames }))
        return paginationHelper.createPage<PopulatedMcpActivity>(rows, nextCursor)
    },

    async getPayload({ id, platformId, userId }: GetPayloadParams): Promise<McpActivityPayload> {
        const activity = await repo().findOneBy({
            id,
            platformId,
            ...(isNil(userId) ? {} : { userId }),
        })
        if (isNil(activity) || isNil(activity.payloadFileId)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'mcp_activity', entityId: id, message: 'No payload stored for this activity' },
            })
        }
        const file = await fileService(log).getDataOrThrow({
            fileId: activity.payloadFileId,
            type: FileType.MCP_CALL_PAYLOAD,
            ...(isNil(activity.projectId) ? {} : { projectId: activity.projectId }),
        })
        const { input, output } = StoredPayload.parse(JSON.parse(file.data.toString('utf-8')))
        return { input, output, truncated: activity.payloadTruncated }
    },
})

function toPopulatedMcpActivity({ activity, members, projectNames, connectionNames }: {
    activity: McpActivity
    members: Map<string, UserWithMetaInformation>
    projectNames: Map<string, string>
    connectionNames: Map<string, string>
}): PopulatedMcpActivity {
    return {
        id: activity.id,
        created: activity.created,
        status: activity.status,
        toolName: activity.toolName,
        member: members.get(activity.userId) ?? null,
        projectId: activity.projectId,
        projectName: isNil(activity.projectId) ? null : projectNames.get(activity.projectId) ?? null,
        pieceName: activity.pieceName,
        actionName: activity.actionName,
        connectionExternalId: activity.connectionExternalId,
        connectionDisplayName: connectionNames.get(connectionKey(activity)) ?? null,
        errorMessage: activity.errorMessage,
        durationMs: activity.durationMs,
        hasPayload: !isNil(activity.payloadFileId),
    }
}

function connectionKey({ projectId, connectionExternalId }: Pick<McpActivity, 'projectId' | 'connectionExternalId'>): string {
    return `${projectId}:${connectionExternalId}`
}

function applyProjectFilter<T extends ObjectLiteral>({ queryBuilder, projectIds }: { queryBuilder: SelectQueryBuilder<T>, projectIds: string[] | undefined }): void {
    if (isNil(projectIds)) {
        return
    }
    const scopedProjectIds = projectIds.filter((projectId) => projectId !== PLATFORM_WIDE_PROJECT_FILTER)
    const includesPlatformWide = projectIds.length !== scopedProjectIds.length
    queryBuilder.andWhere(new Brackets((qb) => {
        if (scopedProjectIds.length > 0) {
            qb.orWhere(`${ACTIVITY_ALIAS}."projectId" IN (:...scopedProjectIds)`, { scopedProjectIds })
        }
        if (includesPlatformWide) {
            qb.orWhere(`${ACTIVITY_ALIAS}."projectId" IS NULL`)
        }
    }))
}

async function findProjectNames(projectIds: (string | null)[]): Promise<Map<string, string>> {
    const distinct = unique(projectIds.filter((projectId): projectId is string => !isNil(projectId)))
    if (distinct.length === 0) {
        return new Map()
    }
    const projects = await projectRepo().findBy({ id: In(distinct) })
    return new Map(projects.map((project) => [project.id, project.displayName]))
}

async function findConnectionNames({ platformId, activities }: { platformId: string, activities: McpActivity[] }): Promise<Map<string, string>> {
    const externalIds = unique(activities
        .filter((activity) => !isNil(activity.projectId))
        .map((activity) => activity.connectionExternalId)
        .filter((externalId): externalId is string => !isNil(externalId)))
    if (externalIds.length === 0) {
        return new Map()
    }
    const connections = await appConnectionsRepo().find({
        where: { platformId, externalId: In(externalIds) },
        select: ['externalId', 'displayName', 'projectIds'],
    })
    return new Map(connections.flatMap((connection) => connection.projectIds.map((projectId) =>
        [connectionKey({ projectId, connectionExternalId: connection.externalId }), connection.displayName] as const,
    )))
}

async function findMembers(userIds: string[]): Promise<Map<string, UserWithMetaInformation>> {
    const distinct = unique(userIds)
    if (distinct.length === 0) {
        return new Map()
    }
    // One batched fetch with the identity joined, mapped in memory. userService.getMetaInformation
    // re-queries per user, so calling it per row would be an N+1 across the page.
    const users = await userRepo().find({ where: { id: In(distinct) }, relations: { identity: true } })
    return new Map(users.flatMap((user) => {
        if (isNil(user.identity)) {
            return []
        }
        const member: UserWithMetaInformation = {
            id: user.id,
            email: user.identity.email,
            firstName: user.identity.firstName,
            lastName: user.identity.lastName,
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
            lastActiveDate: user.lastActiveDate,
            imageUrl: user.identity.imageUrl,
        }
        return [[user.id, member] as const]
    }))
}

const StoredPayload = z.object({
    input: z.unknown(),
    output: z.unknown(),
})

type ListParams = {
    platformId: string
    userId: string | null
    projectIds?: string[]
    memberIds?: string[]
    statuses?: McpActivityStatus[]
    createdAfter?: string
    createdBefore?: string
    cursor?: string
    limit?: number
}

type GetPayloadParams = {
    id: string
    platformId: string
    userId: string | null
}
