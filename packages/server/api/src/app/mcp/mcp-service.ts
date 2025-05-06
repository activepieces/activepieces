import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ApId, Cursor, ErrorCode, isNil, McpWithPieces, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { telemetry } from '../helper/telemetry.utils'
import { McpEntity } from './mcp-entity'
import { mcpPieceService } from './mcp-piece-service'



const repo = repoFactory(McpEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async getOrCreate({ projectId }: { projectId: ApId }): Promise<McpWithPieces> {
        const existingMcp = await repo().findOneBy({ projectId })
        if (!isNil(existingMcp)) {
            return this.getOrThrow({ mcpId: existingMcp.id })
        }
        const mcp = await repo().save({
            id: apId(),
            projectId,
            token: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async list({ projectId }: ListParams): Promise<SeekPage<McpWithPieces>> {
        const existingMcp = await repo().findOneBy({ projectId })
        
        if (isNil(existingMcp)) {
            const newMCP = await this.getOrCreate({ projectId })
            return paginationHelper.createPage<McpWithPieces>([newMCP], null)
        }
        
        const mcpWithPieces = await this.getOrThrow({ mcpId: existingMcp.id })
        
        return paginationHelper.createPage<McpWithPieces>([mcpWithPieces], null)
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

    async getByProjectId({ projectId }: { projectId: ApId }): Promise<McpWithPieces> {
        const mcp = await repo().findOneBy({ projectId })
        if (isNil(mcp)) {
            return this.getOrCreate({ projectId })
        }
        return this.getOrThrow({ mcpId: mcp.id })
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
    cursorRequest?: Cursor | null
    limit?: number
}

type UpdateParams = {
    mcpId: ApId
    token?: string
}

