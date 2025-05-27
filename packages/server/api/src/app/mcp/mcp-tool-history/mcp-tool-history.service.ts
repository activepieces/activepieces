import { 
    ApId, 
    apId, 
    Cursor, 
    McpFlowToolHistoryMetadata,
    McpPieceToolHistoryMetadata,
    McpToolHistory,
    McpToolHistoryStatus,
    SeekPage, 
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { McpToolHistoryEntity } from './mcp-tool-history.entity'

const mcpToolHistoryRepo = repoFactory(McpToolHistoryEntity)

export const mcpToolHistoryService = (_log: FastifyBaseLogger) => ({
    async create({ mcpId, toolId, metadata, input, output, status }: CreateParams): Promise<void> {
        await mcpToolHistoryRepo().save({
            id: apId(),
            mcpId,
            toolId,
            metadata,
            input,
            output,
            status,
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
    },
    async list({ mcpId, projectId, cursorRequest, limit, status, metadata }: ListParams): Promise<SeekPage<McpToolHistory>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: McpToolHistoryEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = mcpToolHistoryRepo()
            .createQueryBuilder('mcp_tool_history')
            .where({ mcpId, projectId })

        if (status) {
            queryBuilder.andWhere({ status: In(status) })
        }

        if (metadata) {
            queryBuilder.andWhere(
                '"mcp_tool_history"."metadata"->>\'actionName\' LIKE :actionName',
                { actionName: `%${metadata}%` },
            )
        }

        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<McpToolHistory>(data, cursor)
    },
})

type CreateParams = {
    mcpId: ApId
    toolId: ApId
    metadata: McpPieceToolHistoryMetadata | McpFlowToolHistoryMetadata
    input: Record<string, unknown>
    output: Record<string, unknown>
    status: McpToolHistoryStatus
}

type ListParams = {
    mcpId: ApId
    projectId: ApId
    cursorRequest: Cursor | null
    limit: number
    status?: McpToolHistoryStatus[]
    metadata?: string
}