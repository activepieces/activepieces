import { ApId, McpFlowWithFlow, McpPieceWithConnection, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpPieceRequestBody, UpdateMcpFlowsRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpService } from '../mcp-server/mcp-service'
import { mcpPieceService } from './mcp-piece-service'
import { mcpFlowService } from './mcp-flow-service'

export const mcpToolController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    

    app.get('/:id/pieces', GetMcpPiecesRequest, async (req) => {
        const { id } = req.params
        const pieces = await mcpPieceService(req.log).list(id)
        return { pieces }
    })


    app.get('/:id/flows', GetMcpFlowsRequest, async (req) => {
        const { id } = req.params
        const flows = await mcpFlowService(req.log).list(id)
        return { flows }
    })
    
    
    app.post('/:id/pieces', UpdateMcpPieceRequest, async (req) => {
        const { id } = req.params
        const { pieceName, pieceVersion, actionNames, connectionId } = req.body
        
        const pieces = await mcpPieceService(req.log).updateBatch({
            mcpId: id,
            pieceName,
            pieceVersion,
            actionNames,
            connectionId: connectionId ?? undefined,
        })

        return { pieces }
    })

    app.post('/:id/flows', UpdateMcpFlowsRequest, async (req) => {
        const { id } = req.params
        const { flowIds } = req.body
        
        const flows = await mcpFlowService(req.log).updateBatch({
            mcpId: id,
            flowIds,
        })

        return { flows }
    })

    app.delete('/:id/pieces/:pieceId', DeleteMcpPieceRequest, async (req, reply) => {
        const { pieceId } = req.params
        await mcpPieceService(req.log).delete(pieceId)
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    
    app.delete('/:id/flows/:flowId', DeleteMcpFlowRequest, async (req, reply) => {
        const { flowId } = req.params
        await mcpFlowService(req.log).delete(flowId)
        await reply.status(StatusCodes.NO_CONTENT).send()
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
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                pieces: Type.Array(McpPieceWithConnection),
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
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                flows: Type.Array(McpFlowWithFlow),
            }),
        },
    },
}


const UpdateMcpPieceRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Update MCP piece actions',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateMcpPieceRequestBody,
        response: {
            [StatusCodes.OK]: Type.Object({
                pieces: Type.Array(McpPieceWithConnection),
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
            id: ApId,
        }),
        body: UpdateMcpFlowsRequestBody,
        response: {
            [StatusCodes.OK]: Type.Object({
                flows: Type.Array(McpFlowWithFlow),
            }),
        },
    },
}

const DeleteMcpPieceRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Delete MCP piece',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
            pieceId: ApId,
        }),
    },
    response: {
        [StatusCodes.NO_CONTENT]: Type.Never(),
    },
}

const DeleteMcpFlowRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-flow'],
        description: 'Delete MCP flow',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
            flowId: ApId,
        }),
    },
    response: {
        [StatusCodes.NO_CONTENT]: Type.Never(),
    },
}
