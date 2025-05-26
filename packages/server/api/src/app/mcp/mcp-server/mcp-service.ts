import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    Cursor, 
    ErrorCode, 
    isNil, 
    McpWithTools, 
    SeekPage, 
    spreadIfDefined, 
    TelemetryEventName, 
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { ILike } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { telemetry } from '../../helper/telemetry.utils'
import { projectService } from '../../project/project-service'
import { mcpToolService } from '../mcp-tools/mcp-tool.service'
import { McpEntity } from './mcp-entity'
import { McpFlowToolHistoryEntity } from './mcp-flow-tool-history-entity'
import { McpPieceToolHistoryEntity } from './mcp-piece-tool-history-entity'

export const mcpRepo = repoFactory(McpEntity)
const mcpPieceToolHistoryRepo = repoFactory(McpPieceToolHistoryEntity)
const mcpFlowToolHistoryRepo = repoFactory(McpFlowToolHistoryEntity)

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
                order: 'DESC',
                orderBy: 'updated',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryWhere: Record<string, unknown> = { projectId }
        if (!isNil(name)) {
            queryWhere.name = ILike(`%${name}%`)
        }

        const queryBuilder = mcpRepo().createQueryBuilder('mcp').where(queryWhere)
        const { data, cursor } = await paginator.paginate(queryBuilder)

        const populatedMcpPromises = data.map(async (mcp) => {
            const mcpWithTools = await this.getOrThrow({
                mcpId: mcp.id,
            })
            return mcpWithTools
        })

        const populatedMcps = await Promise.all(populatedMcpPromises)
        return paginationHelper.createPage(populatedMcps, cursor)
    },

    async getOrThrow({ mcpId }: GetOrThrowParams): Promise<McpWithTools> {
        const mcp = await mcpRepo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
        
        const project = await projectService.getOneOrThrow(mcp.projectId)

        const tools = await mcpToolService(_log).list({
            mcpId: mcp.id,
            projectId: mcp.projectId,
            platformId: project.platformId,
        })

        return {
            ...mcp,
            tools,
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
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async update({ mcpId, token, name }: UpdateParams): Promise<McpWithTools> {
        await mcpRepo().update(mcpId, {
            ...spreadIfDefined('token', token),
            ...spreadIfDefined('name', name),
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

    async trackToolCall({ mcpId, toolName }: { mcpId: ApId, toolName: string }): Promise<void> {
        const mcp = await mcpRepo().findOneBy({ id: mcpId })
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

    async addPieceToolHistory({ mcpId, pieceName, pieceVersion, toolName, input, output, success }: AddPieceToolHistoryParams): Promise<void> {
        await mcpPieceToolHistoryRepo().save({
            id: apId(),
            mcpId,
            pieceName,
            pieceVersion,
            toolName,
            input,
            output,
            success,
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
    },

    async addFlowToolHistory({ mcpId, flowId, flowVersionId, toolName, input, output, success }: AddFlowToolHistoryParams): Promise<void> {
        await mcpFlowToolHistoryRepo().save({
            id: apId(),
            mcpId,
            flowId,
            flowVersionId,
            toolName,
            input,
            output,
            success,
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
    },
})

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
}

type CountParams = {
    projectId: ApId
}

type AddPieceToolHistoryParams = {
    mcpId: ApId
    pieceName: string
    pieceVersion: string
    toolName: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    success: boolean
}

type AddFlowToolHistoryParams = {
    mcpId: ApId
    flowId: ApId
    flowVersionId?: ApId
    toolName: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    success: boolean
}

type GetOrThrowParams = {
    mcpId: ApId
}