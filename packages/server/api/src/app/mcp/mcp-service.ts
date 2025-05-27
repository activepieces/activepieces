import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ApId,
    assertNotNullOrUndefined,
    Cursor,
    ErrorCode,
    isNil,
    McpTool,
    McpToolType,
    McpWithTools,
    SeekPage,
    spreadIfDefined,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { ILike, Raw } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'
import { McpEntity } from './mcp-entity'
import { McpToolEntity } from './tool/mcp-tool.entity'

export const mcpRepo = repoFactory(McpEntity)
export const mcpToolRepo = repoFactory(McpToolEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async create({ projectId, name }: CreateParams): Promise<McpWithTools> {
        await this.validateCount({ projectId })
        const mcp = await mcpRepo().save({
            id: apId(),
            projectId,
            name,
            token: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async list({ projectId, cursorRequest, limit, name }: ListParams): Promise<SeekPage<McpWithTools>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: McpEntity,
            query: {
                limit,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryWhere: Record<string, unknown> = { projectId }
        if (!isNil(name)) {
            queryWhere.name = ILike(`%${name}%`)
        }

        const { data, cursor } = await paginator.paginate(mcpRepo().createQueryBuilder('mcp').where(queryWhere))
        const populatedMcps = await Promise.all(data.map(async (mcp) => await this.getOrThrow({ mcpId: mcp.id })))
        return paginationHelper.createPage(populatedMcps, cursor)
    },

    async getOrThrow({ mcpId }: GetOrThrowParams): Promise<McpWithTools> {
        const mcp = await mcpRepo().findOne({ where: { id: mcpId }, relations: { tools: true } })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
        return mcp
    },

    async getByToken({ token }: { token: string }): Promise<McpWithTools> {
        const mcp = await mcpRepo().findOne({ where: { token } })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: token, entityType: 'MCP' },
            })
        }
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async update({ mcpId, token, name, tools }: UpdateParams): Promise<McpWithTools> {
        const enrichedTools = !isNil(tools) ? await Promise.all(tools.map(async (tool) => {
            return {
                ...tool,
                id: await findToolId(mcpId, tool),
            }
        })) : undefined
        await mcpRepo().update(mcpId, {
            ...spreadIfDefined('token', token),
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('tools', enrichedTools),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId })
    },

    async delete({ mcpId, projectId }: { mcpId: ApId, projectId: ApId }): Promise<void> {
        const deleteResult = await mcpRepo().delete({
            id: mcpId,
            projectId,
        })

        if (deleteResult.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
    },

    async count({ projectId }: CountParams): Promise<number> {
        return mcpRepo().count({
            where: { projectId },
        })
    },

    async validateCount(params: CountParams): Promise<void> {
        const countRes = await this.count(params)
        if (countRes + 1 > system.getNumberOrThrow(AppSystemProp.MAX_MCPS_PER_PROJECT)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Max mcps per project reached: ${system.getNumberOrThrow(AppSystemProp.MAX_MCPS_PER_PROJECT)}`,
                },
            })
        }
    },
})

function findToolId(mcpId: ApId, tool: Omit<McpTool, 'created' | 'updated' | 'id'>): Promise<ApId | undefined> {
    switch (tool.type) {
        case McpToolType.PIECE: {
            assertNotNullOrUndefined(tool.pieceMetadata, 'pieceMetadata is required')
            return mcpToolRepo().findOne({
                where: {
                    mcpId,
                    type: tool.type,
                    pieceMetadata: Raw(alias => `${alias}->>'pieceName' = :pieceName`, { pieceName: tool.pieceMetadata?.pieceName })
                }
            }).then(tool => tool?.id)
        }
        case McpToolType.FLOW: {
            assertNotNullOrUndefined(tool.flowId, 'flowId is required')
            return mcpToolRepo().findOne({ where: { mcpId, type: tool.type, flowId: tool.flowId } }).then(tool => tool?.id)
        }
    }
}

type CreateParams = {
    projectId: ApId
    name: string
}

type ListParams = {
    projectId: ApId
    cursorRequest: Cursor | null
    limit: number
    name: string | undefined
}

type UpdateParams = {
    mcpId: ApId
    token?: string
    name?: string
    tools?: Omit<McpTool, 'created' | 'updated' | 'id'>[]
}

type CountParams = {
    projectId: ApId
}

type GetOrThrowParams = {
    mcpId: ApId
}