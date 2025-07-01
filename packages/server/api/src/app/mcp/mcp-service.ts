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
import { ILike, IsNull } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { McpEntity } from './mcp-entity'
import { McpToolEntity } from './tool/mcp-tool.entity'

export const mcpRepo = repoFactory(McpEntity)
const mcpToolRepo = repoFactory(McpToolEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({
    async create({ projectId, name }: CreateParams): Promise<McpWithTools> {
        const mcp = await mcpRepo().save({
            id: apId(),
            projectId,
            name,
            token: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId: mcp.id, projectId })
    },

    async getMcpTool(toolId: ApId): Promise<McpTool> {
        return mcpToolRepo().findOneOrFail({ where: { id: toolId } })
    },

    async deleteFlowTool({ flowId }: DeleteFlowToolsParams): Promise<void> {
        await mcpToolRepo().delete({ flowId })
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

        const queryWhere: Record<string, unknown> = { projectId, agentId: IsNull() }
        if (!isNil(name)) {
            queryWhere.name = ILike(`%${name}%`)
        }


        const { data, cursor } = await paginator.paginate(mcpRepo().createQueryBuilder('mcp').where(queryWhere))
        const populatedMcps = await Promise.all(data.map(async (mcp) => this.getOrThrow({ mcpId: mcp.id, projectId })))
        return paginationHelper.createPage(populatedMcps, cursor)
    },

    async getOrThrow({ mcpId, projectId }: GetOrThrowParams): Promise<McpWithTools> {
        const mcp = await mcpRepo().findOne({
            where: { id: mcpId, projectId },
            relations: { tools: true },
            order: { tools: { created: 'DESC' } },
        })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }

        const enrichedTools = await Promise.all(mcp.tools.map((tool) => enrichTool(tool, mcp.projectId, _log))).then(tools => tools.filter(tool => tool !== null))
        return {
            ...mcp,
            tools: enrichedTools,
        }
    },

    async getByToken({ token }: { token: string }): Promise<McpWithTools> {
        const mcp = await mcpRepo().findOne({ where: { token } })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: token, entityType: 'MCP' },
            })
        }
        return this.getOrThrow({ mcpId: mcp.id, projectId: mcp.projectId })
    },

    async update({ mcpId, token, name, tools, agentId }: UpdateParams): Promise<McpWithTools> {
        const enrichedTools = !isNil(tools) ? await Promise.all(tools.map(async (tool) => {
            const existingToolId = await findToolId(mcpId, tool)
            return {
                ...tool,
                id: existingToolId || apId(),
                mcpId,
                created: existingToolId ? undefined : dayjs().toISOString(),
                updated: dayjs().toISOString(),
            }
        })) : undefined

        const mcp = await mcpRepo().findOneOrFail({ where: { id: mcpId } })

        await mcpRepo().save({
            ...mcp,
            ...spreadIfDefined('token', token),
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('tools', enrichedTools),
            ...spreadIfDefined('agentId', agentId),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId, projectId: mcp.projectId })
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

})

async function enrichTool(tool: McpTool, projectId: ApId, _log: FastifyBaseLogger): Promise<McpTool | null> {
    switch (tool.type) {
        case McpToolType.PIECE: {
            return {
                ...tool,
                pieceMetadata: tool.pieceMetadata,
                flowId: undefined,
            }
        }
        case McpToolType.FLOW: {
            assertNotNullOrUndefined(tool.flowId, 'flowId is required')
            const flow = await flowService(_log).getOneOrThrow({
                id: tool.flowId,
                projectId,
            })

            if (flow.publishedVersionId === null) {
                return null
            }

            const publishedVersion = await flowVersionService(_log).getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: flow.publishedVersionId,
            })
            return {
                ...tool,
                pieceMetadata: undefined,
                flow: {
                    ...flow,
                    version: publishedVersion,
                },
            }
        }
    }
}

async function findToolId(mcpId: ApId, tool: Omit<McpTool, 'created' | 'updated' | 'id'>): Promise<ApId | undefined> {
    switch (tool.type) {
        case McpToolType.PIECE: {
            assertNotNullOrUndefined(tool.pieceMetadata, 'pieceMetadata is required')
            const result = await mcpToolRepo()
                .createQueryBuilder('mcp_tool')
                .where('mcp_tool.mcpId = :mcpId', { mcpId })
                .andWhere('mcp_tool.type = :type', { type: tool.type })
                .andWhere('mcp_tool."pieceMetadata"->>\'pieceName\' = :pieceName', { pieceName: tool.pieceMetadata?.pieceName })
                .getOne()
            return result?.id
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
    agentId?: ApId
    token?: string
    name?: string
    tools?: Omit<McpTool, 'created' | 'updated' | 'id'>[]
}

type CountParams = {
    projectId: ApId
}

type GetOrThrowParams = {
    mcpId: ApId
    projectId: ApId
}

type DeleteFlowToolsParams = {
    flowId: ApId
}