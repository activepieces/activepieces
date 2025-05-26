import { 
    ActivepiecesError, 
    apId,
    ApId, 
    assertNotNullOrUndefined, 
    ErrorCode, 
    isNil, 
    McpTool,
    McpToolData,
    McpToolType,
    McpToolWithFlow,
    McpToolWithPiece,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Raw } from 'typeorm'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { mcpToolHandler } from './mcp-tool-handler'
import { McpToolHistoryEntity } from './mcp-tool-history/mcp-tool-history.entity'
import { McpToolEntity } from './mcp-tool.entity'

const mcpToolRepo = repoFactory(McpToolEntity)
const mcpToolHistoryRepo = repoFactory(McpToolHistoryEntity)

export const mcpToolService = (log: FastifyBaseLogger) => ({
    async getOne(mcpToolId: string): Promise<McpTool | null> {      
        const tool = await mcpToolRepo().findOne({
            where: { id: mcpToolId },
        })

        if (isNil(tool)) {
            return null
        }
        return tool
    },

    async getOneOrThrow(mcpToolId: string): Promise<McpTool> {
        const tool = await this.getOne(mcpToolId)
        
        if (isNil(tool)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: mcpToolId,
                    entityType: 'McpTool',
                },
            })
        }
        
        return tool
    },

    async upsert(params: UpsertParams): Promise<McpTool> {
        switch (params.data.type) {
            case McpToolType.FLOW: {
                await mcpToolHandler.validateFlow({
                    data: params.data,
                    projectId: params.projectId,
                    log,
                })
                break
            }
            case McpToolType.PIECE: {
                await mcpToolHandler.validatePiece({
                    data: params.data,
                    projectId: params.projectId,
                    platformId: params.platformId,
                    log,
                })
                break
            }
        }
        
        const existingTool = await getExistingTool({
            data: params.data,
            mcpId: params.mcpId,
        })
        const newId = existingTool?.id ?? apId()

        const mcpTool = {
            ...params,
            mcpId: params.mcpId,
            id: newId,
        }
        await mcpToolRepo().upsert(mcpTool, ['id'])
        return this.getOneOrThrow(mcpTool.id)
    },

    async list({ mcpId, projectId, platformId, type }: ListParams): Promise<(McpToolWithFlow | McpToolWithPiece)[]> {
        const tools = await mcpToolRepo().find({ 
            where: { 
                mcpId,
                ...spreadIfDefined('type', type),
            },
        })

        return Promise.all(tools.map(tool => enrichToolWithData(tool, projectId, platformId, log)))
    },

    async delete(mcpToolId: string): Promise<void> {
        // First delete all related history records to avoid foreign key constraint violation
        await mcpToolHistoryRepo().delete({ toolId: mcpToolId })
        
        // Then delete the tool itself
        await mcpToolRepo().delete({ id: mcpToolId })
    },
})


async function getExistingTool(params: GetExistingToolParams): Promise<McpTool | null> {
    const { data, mcpId } = params
    switch (data.type) {
        case McpToolType.FLOW:
            return mcpToolRepo().findOne({
                where: {
                    mcpId,
                    type: McpToolType.FLOW,
                },
            })
        case McpToolType.PIECE:
            return mcpToolRepo().findOne({
                where: {
                    mcpId,
                    type: McpToolType.PIECE,
                    data: Raw((alias) => `${alias}->>'pieceName' = :pieceName`, {
                        pieceName: data.pieceName,
                    }),
                },
            })
    }
}

async function enrichToolWithData(
    item: McpTool,
    projectId: ApId,
    platformId: ApId,
    log: FastifyBaseLogger,
): Promise<McpToolWithFlow | McpToolWithPiece> {
    switch (item.data.type) {
        case McpToolType.FLOW: {
            const flows = await Promise.all(item.data.flowIds.map(flowId => flowService(log).getOneOrThrow({
                id: flowId,
                projectId,
            })))
            const flowsWithPublishedVersion = await Promise.all(flows.map(async flow => {
                assertNotNullOrUndefined(flow.publishedVersionId, `Flow ${flow.id} has no published version`)
                return {
                    ...flow,
                    version: await flowVersionService(log).getFlowVersionOrThrow({
                        flowId: flow.id, 
                        versionId: flow.publishedVersionId,
                    }),
                }
            }))
            return {
                ...item,
                flows: flowsWithPublishedVersion,
            }
        }
        case McpToolType.PIECE: {
            const connection = item.data.connectionExternalId ? await appConnectionService(log).getOne({
                projectId,
                platformId,
                externalId: item.data.connectionExternalId,
            }) : undefined
            return {
                ...item,
                piece: item.data,
                connection: connection ?? undefined,
            }
        }
    }
}

type ListParams = {
    mcpId: ApId
    projectId: ApId
    platformId: ApId
    type?: McpToolType
}

type UpsertParams = {
    mcpId: ApId
    type: McpToolType
    data: McpToolData
    projectId: ApId
    platformId: ApId
}

type GetExistingToolParams = {
    mcpId: ApId
    data: McpToolData
}