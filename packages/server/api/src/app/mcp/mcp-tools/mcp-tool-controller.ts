import { ApId, McpActionWithConnection, McpFlowWithFlow, McpPieceWithConnection, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpActionsRequestBody, UpdateMcpFlowsRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpService } from '../mcp-server/mcp-service'
import { mcpActionService } from './mcp-action-service'
import { mcpFlowService } from './mcp-flow-service'

export const mcpToolController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    

    app.get('/:mcpId/pieces', GetMcpPiecesRequest, async (req) => {
        const { mcpId } = req.params
        const pieces = await mcpActionService(req.log).listPieces(mcpId)
        return { pieces }
    })

    app.get('/:mcpId/actions', GetMcpActionsRequest, async (req) => {
        const { mcpId } = req.params
        const actions = await mcpActionService(req.log).listActions(mcpId)
        return { actions }
    })

    app.get('/:mcpId/flows', GetMcpFlowsRequest, async (req) => {
        const { mcpId } = req.params
        const flows = await mcpFlowService(req.log).listFlows(mcpId)
        return { flows }
    })
    
    
    app.post('/:mcpId/actions', UpdateMcpActionsRequest, async (req) => {
        const { mcpId } = req.params
        const { pieceName, pieceVersion, actionNames, connectionId } = req.body
        
        const actions = await mcpActionService(req.log).updateBatch({
            mcpId,
            pieceName,
            pieceVersion,
            actionNames,
            connectionId: connectionId ?? undefined,
        })

        return { actions }
    })

    app.post('/:mcpId/flows', UpdateMcpFlowsRequest, async (req) => {
        const { mcpId } = req.params
        const { flowIds } = req.body
        
        const flows = await mcpFlowService(req.log).updateBatch({
            mcpId,
            flowIds,
        })

        return { flows }
    })

}

const GetMcpPiecesRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Get MCP pieces',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            mcpId: ApId,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                pieces: Type.Array(McpPieceWithConnection),
            }),
        },
    },
}

const GetMcpActionsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-action'],
        description: 'Get MCP actions',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            mcpId: ApId,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                actions: Type.Array(McpActionWithConnection),
            }),
        },
    },
}

const GetMcpFlowsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-flow'],
        description: 'Get MCP flows',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            mcpId: ApId,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                flows: Type.Array(McpFlowWithFlow),
            }),
        },
    },
}


const UpdateMcpActionsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-action'],
        description: 'Update MCP piece actions',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            mcpId: ApId,
        }),
        body: UpdateMcpActionsRequestBody,
        response: {
            [StatusCodes.OK]: Type.Object({
                actions: Type.Array(McpActionWithConnection),
            }),
        },
    },
}

const UpdateMcpFlowsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-flow'],
        description: 'Update MCP flows',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            mcpId: ApId,
        }),
        body: UpdateMcpFlowsRequestBody,
        response: {
            [StatusCodes.OK]: Type.Object({
                flows: Type.Array(McpFlowWithFlow),
            }),
        },
    },
}
