import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ApId, Cursor, ErrorCode, isNil, McpWithPieces, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { telemetry } from '../helper/telemetry.utils'
import { McpEntity } from './mcp-entity'
import { mcpPieceService } from './mcp-piece-service'
import { buildPaginator } from '../helper/pagination/build-paginator'



const repo = repoFactory(McpEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({

    async upsert({ projectId }: { projectId: ApId }): Promise<McpWithPieces> {
        const mcp = await repo().save({
            id: apId(),
            projectId,
            token: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async list({ projectId, cursorRequest, limit }: ListParams): Promise<SeekPage<McpWithPieces>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: McpEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryWhere: Record<string, unknown> = { projectId }

        const queryBuilder = repo().createQueryBuilder('mcp').where(queryWhere)


        const { data, cursor } = await paginator.paginate(queryBuilder)


        const populatedMcpPromises = data.map(async (mcp) => {
            const mcpWithPieces = await this.getOrThrow({
                mcpId: mcp.id,
            })
            return mcpWithPieces
        })

        const populatedMcps = await Promise.all(populatedMcpPromises)
        return paginationHelper.createPage(populatedMcps, cursor)
    },

    async getOrThrow({ mcpId }: { mcpId: string }): Promise<McpWithPieces> {
        const mcp = await repo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
        return {
            ...mcp,
            pieces: await mcpPieceService(_log).list(mcp.id),
        }
    },

    async getByToken({ token }: { token: string }): Promise<McpWithPieces> {
        const mcp = await repo().findOne({ where: { token } })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: token, entityType: 'MCP' },
            })
        }
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async update({ mcpId, token }: UpdateParams): Promise<McpWithPieces> {
        await repo().update(mcpId, {
            ...spreadIfDefined('token', token),
            updated: dayjs().toISOString(),
        })

        return this.getOrThrow({ mcpId })
    },

    async trackToolCall({ mcpId, toolName }: { mcpId: ApId, toolName: string }): Promise<void> {
        const mcp = await repo().findOneBy({ id: mcpId })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
        rejectedPromiseHandler(telemetry(_log).trackProject(mcp.projectId, {
            name: TelemetryEventName.MCP_TOOL_CALLED,
            payload: {
                mcpId,
                toolName,
            },
        }), _log)
    },
})

type ListParams = {
    projectId: ApId
    cursorRequest: Cursor | null
    limit: number
}

type UpdateParams = {
    mcpId: ApId
    token?: string
}

