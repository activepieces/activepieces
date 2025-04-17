import { ActivepiecesError, apId, ApId, Cursor, ErrorCode, isNil, MCPWithPieces, SeekPage, spreadIfDefined } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { MCPEntity } from './mcp-entity'
import { mcpPieceService } from './mcp-piece-service'

const repo = repoFactory(MCPEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async getOrCreate({ projectId }: { projectId: ApId }): Promise<MCPWithPieces> {
        const existingMCP = await repo().findOneBy({ projectId })
        if (!isNil(existingMCP)) {
            return this.getOrThrow({ mcpId: existingMCP.id })
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

    async list({ projectId }: ListParams): Promise<SeekPage<MCPWithPieces>> {
        const existingMCP = await repo().findOneBy({ projectId })
        
        if (isNil(existingMCP)) {
            const newMCP = await this.getOrCreate({ projectId })
            return paginationHelper.createPage<MCPWithPieces>([newMCP], null)
        }
        
        const mcpWithPieces = await this.getOrThrow({ mcpId: existingMCP.id })
        
        return paginationHelper.createPage<MCPWithPieces>([mcpWithPieces], null)
    },

    async getOrThrow({ mcpId }: { mcpId: string }): Promise<MCPWithPieces> {
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

    async getByToken({ token }: { token: string }): Promise<MCPWithPieces> {
        const mcp = await repo().findOne({ where: { token } })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: token, entityType: 'MCP' },
            })
        }
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async update({ mcpId, token }: UpdateParams): Promise<MCPWithPieces> {

        await repo().update(mcpId, {
            ...spreadIfDefined('token', token),
            updated: dayjs().toISOString(),
        })

        return this.getOrThrow({ mcpId })
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

