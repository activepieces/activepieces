import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    ErrorCode, 
    isNil, 
    Mcp,
    McpAction,
    McpActionWithConnection,
    McpFlow,
    McpFlowWithFlow,
    McpPiece,
    McpPieceWithConnection,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService, appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { McpEntity } from '../mcp-server/mcp-entity'
import { McpFlowEntity } from './mcp-flow-entity'
import { flowService } from '../../flows/flow/flow.service'

const mcpRepo = repoFactory(McpEntity)
const mcpFlowRepo = repoFactory(McpFlowEntity)

export const mcpFlowService = (_log: FastifyBaseLogger) => ({
    async listFlows(mcpId: ApId): Promise<McpFlowWithFlow[]> {
        await this.validateMcp(mcpId)
        
        const flows = await mcpFlowRepo().find({ 
            where: { mcpId },
        })
        
        const flowsWithFlow = await Promise.all(
            flows.map(async (flow) => {
                return enrichWithFlow(flow, _log)
            }),
        )
        
        return flowsWithFlow
    },


    async getOne(flowId: string): Promise<McpFlowWithFlow | null> {      
        const flow = await mcpFlowRepo().findOne({
            where: { id: flowId },
        })

        if (isNil(flow)) {
            return null
        }

        return enrichWithFlow(flow, _log)
    },

    async getOneOrThrow(flowId: string): Promise<McpFlowWithFlow> {
        const flow = await this.getOne(flowId)
        
        if (isNil(flow)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: flowId,
                    entityType: 'McpFlow',
                },
            })
        }
        
        return enrichWithFlow(flow, _log)
    },

    async getMcpId(flowId: string): Promise<string> {
        const flow = await this.getOne(flowId)
        if (isNil(flow)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: flowId, entityType: 'McpFlow' },
            })
        }
        return flow.mcpId
    },

    async delete(flowId: string): Promise<void> {
        const flow = await this.getOneOrThrow(flowId)
        await mcpFlowRepo().delete({ id: flowId })
        await _updateMcpTimestamp(flow.mcpId)
    },
    
    // TODO
    async updateBatch({ mcpId, flowIds }: UpdateBatchParams): Promise<McpFlowWithFlow[]> {
        const mcp = await this.validateMcp(mcpId)
        
        // const project = await projectService.getOneOrThrow(mcp.projectId)
        // await this.validateFlow({
        //     flowIds,
        //     projectId: mcp.projectId,
        //     platformId: project.platformId
        // })
        

        await mcpFlowRepo().delete({ mcpId })
        
        if (flowIds.length > 0) {
            const flows = flowIds.map(flowId => ({
                id: apId(),
                created: dayjs().toISOString(),
                updated: dayjs().toISOString(),
                mcpId,
                flowId,
            }))
            
            await mcpFlowRepo().save(flows)
        }
        
        await _updateMcpTimestamp(mcpId)
        
        return this.listFlows(mcpId)
    },

    async validateMcp(mcpId: ApId): Promise<Mcp> {
        const mcp = await mcpRepo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }

        return mcp
    },

    async validateFlow({ flowIds }: ValidateFlowParams): Promise<void> {

        // const flowPromises = flowIds.map(async (flowId: string) => {
        //     const flow = await flowService(_log).getOneById(flowId)
        //     if (isNil(flow)) {
        //         throw new ActivepiecesError({
        //             code: ErrorCode.ENTITY_NOT_FOUND,
        //             params: { entityId: flowId, entityType: 'Flow' },
        //         })
        //     }
        //     const version = await flowService(_log).getOnePopulatedOrThrow({
        //         flowId,
        //         versionId: (flow.state === FlowVersionState.DRAFT) ? undefined : (flow.publishedVersionId ?? undefined),
        //     })
        //     if (version.trigger.type !== TriggerType.PIECE || version.trigger.settings.pieceName !== '@activepieces/piece-mcp') {
        //         throw new ActivepiecesError({
        //             code: ErrorCode.VALIDATION,
        //             params: { message: `Flow ${flowId} does not start with an MCP trigger` },
        //         })
        //     }
        //     return flow
        // })
    },
})

async function _updateMcpTimestamp(mcpId: ApId): Promise<void> {
    await mcpRepo().update({ id: mcpId }, { updated: dayjs().toISOString() })
}

async function enrichWithFlow(
    item: McpFlow,
    log: FastifyBaseLogger
): Promise<McpFlowWithFlow> {
    const flow = await flowService(log).getOneById(item.flowId)
    if (isNil(flow)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: { entityId: item.flowId, entityType: 'Flow' },
        })
    }
    
    return {
        ...item,        
        flow,        
    }
}

async function validateMcpPieceConnection({ pieceName, connectionId, projectId, platformId, log }: ValidateMcpPieceConnectionParams) {
    const connection = await appConnectionService(log).getOneOrThrowWithoutValue({
        id: connectionId,
        platformId,
        projectId,
    })
    if (connection.pieceName !== pieceName) {
        throw new ActivepiecesError({
            code: ErrorCode.MCP_PIECE_CONNECTION_MISMATCH,
            params: { pieceName, connectionPieceName: connection.pieceName, connectionId },
        })
    } 
}

type UpdateBatchParams = {
    mcpId: ApId
    flowIds: ApId[]
}

type ValidateMcpPieceConnectionParams = {
    pieceName: string
    connectionId: ApId
    projectId: ApId
    platformId: ApId
    log: FastifyBaseLogger
}

type ValidateFlowParams = {
    flowIds: ApId[]
}
