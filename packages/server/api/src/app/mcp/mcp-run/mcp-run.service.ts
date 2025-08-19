import { 
    ApId, 
    apId, 
    Cursor, 
    McpFlowRunMetadata,
    McpPieceRunMetadata,
    McpRun,
    McpRunStatus,
    SeekPage, 
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { McpRunEntity } from './mcp-run.entity'

const mcpRunRepo = repoFactory(McpRunEntity)

export const mcpRunService = (_log: FastifyBaseLogger) => ({
    async create({ mcpId, toolId, projectId, metadata, input, output, status }: CreateParams): Promise<void> {
        await mcpRunRepo().save({
            id: apId(),
            mcpId,
            projectId,
            toolId,
            metadata,
            input,
            output,
            status,
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
    },
    async list({ mcpId, projectId, cursorRequest, limit, status, metadata }: ListParams): Promise<SeekPage<McpRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: McpRunEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = mcpRunRepo()
            .createQueryBuilder('mcp_run')
            .where({ mcpId, projectId })

        if (status) {
            queryBuilder.andWhere({ status: In(status) })
        }

        if (metadata) {
            queryBuilder.andWhere(
                '"mcp_run"."metadata"->>\'actionName\' LIKE :actionName',
                { actionName: `%${metadata}%` },
            )
        }

        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<McpRun>(data, cursor)
    },
})

type CreateParams = {
    mcpId: ApId
    toolId: ApId
    projectId: ApId
    metadata: McpPieceRunMetadata | McpFlowRunMetadata
    input: Record<string, unknown>
    output: Record<string, unknown>
    status: McpRunStatus
}

type ListParams = {
    mcpId: ApId
    projectId: ApId
    cursorRequest: Cursor | null
    limit: number
    status?: McpRunStatus[]
    metadata?: string
}