import { 
    ActivepiecesError, 
    apId, 
    ApId, 
    ErrorCode, 
    isNil, 
    Mcp,
    McpFlow,
    McpFlowWithFlow,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { flowService } from '../../flows/flow/flow.service'
import { McpEntity } from '../mcp-server/mcp-entity'
import { McpFlowEntity } from './mcp-flow-entity'

const mcpRepo = repoFactory(McpEntity)
const mcpFlowRepo = repoFactory(McpFlowEntity)

export const mcpFlowService = (_log: FastifyBaseLogger) => ({
    async list(mcpId: ApId): Promise<McpFlowWithFlow[]> {
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
        await mcpFlowRepo().delete({ id: flowId })
    },
    
    async updateBatch({ mcpId, flowIds }: UpdateBatchParams): Promise<McpFlowWithFlow[]> {
        const mcp = await this.validateMcp(mcpId)
  
        await mcpFlowRepo().delete({ mcpId: mcp.id })
        
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
        
        return this.list(mcpId)
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

})

async function _updateMcpTimestamp(mcpId: ApId): Promise<void> {
    await mcpRepo().update({ id: mcpId }, { updated: dayjs().toISOString() })
}

async function enrichWithFlow(
    item: McpFlow,
    log: FastifyBaseLogger,
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
