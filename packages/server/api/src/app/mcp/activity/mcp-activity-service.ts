import { ActivepiecesError, ErrorCode, isNil, SeekPage, unique } from '@activepieces/core-utils'
import {
    FileType,
    McpActivity,
    McpActivityPayload,
    McpActivityStatus,
    McpOAuthClientKey,
    PopulatedMcpActivity,
    UserWithMetaInformation,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { z } from 'zod'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { executionDataRetention } from '../../helper/retention/execution-data-retention'
import { mcpListingUtils } from '../mcp-listing-utils'
import { ACTIVITY_ALIAS, McpActivityEntity } from './mcp-activity-entity'

const repo = repoFactory(McpActivityEntity)

const DEFAULT_ACTIVITY_PAGE_SIZE = 20

export const mcpActivityService = (log: FastifyBaseLogger) => ({
    async list({ platformId, userId, projectIds, memberIds, clientKeys, statuses, createdAfter, createdBefore, cursor, limit }: ListParams): Promise<SeekPage<PopulatedMcpActivity>> {
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
        if (!isNil(clientKeys)) {
            queryBuilder.andWhere(`${ACTIVITY_ALIAS}."clientKey" IN (:...clientKeys)`, { clientKeys })
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
        mcpListingUtils.applyProjectFilter({ queryBuilder, alias: ACTIVITY_ALIAS, projectIds })

        const { data, cursor: nextCursor } = await paginator.paginate(queryBuilder)

        const [members, projectNames, connectionNames] = await Promise.all([
            mcpListingUtils.findMembers({ userIds: data.map((activity) => activity.userId), platformId }),
            mcpListingUtils.findProjectNames({ projectIds: data.map((activity) => activity.projectId), platformId }),
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

    async deleteStale(): Promise<void> {
        await executionDataRetention.sweep({ repo, alias: ACTIVITY_ALIAS, logLabel: 'mcpActivityRetention', log })
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
        clientKey: activity.clientKey,
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

const StoredPayload = z.object({
    input: z.unknown(),
    output: z.unknown(),
})

type ListParams = {
    platformId: string
    userId: string | null
    projectIds?: string[]
    memberIds?: string[]
    clientKeys?: McpOAuthClientKey[]
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
