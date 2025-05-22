import { ApId, McpFlowWithFlow, McpPieceWithConnection, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpsertMcpPieceRequestBody as UpsertMcpPieceRequestBody, UpdateMcpFlowsRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpService } from '../mcp-server/mcp-service'
import { mcpPieceService } from './mcp-piece-service'
import { mcpFlowService } from './mcp-flow-service'

export const mcpToolController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    

    app.get('/pieces', GetMcpPiecesRequest, async (req) => {
        const { mcpId } = req.query
        const pieces = await mcpPieceService(req.log).list(mcpId)
        return pieces
    })


    app.get('/flows', GetMcpFlowsRequest, async (req) => {
        const { mcpId } = req.query
        const flows = await mcpFlowService(req.log).list(mcpId)
        return flows
    })
    
    
    app.post('/pieces', UpsertMcpPieceRequest, async (req) => {
        const { mcpId } = req.query
        const { pieceName, pieceVersion, actionNames, connectionId } = req.body
        
        const piece = await mcpPieceService(req.log).upsert({
            mcpId: mcpId,
            pieceName,
            pieceVersion,
            actionNames,
            connectionId: connectionId ?? undefined,
        })

        if(actionNames.length === 0) {
            await mcpPieceService(req.log).delete(piece.id)
        }
        return piece
    })

    app.post('/flows', UpdateMcpFlowsRequest, async (req) => {
        const { mcpId } = req.query
        const { flowIds } = req.body
        
        const flows = await mcpFlowService(req.log).updateBatch({
            mcpId,
            flowIds,
        })

        return flows
    })

    app.delete('/pieces', DeleteMcpPieceRequest, async (req, reply) => {
        const { pieceId } = req.query
        await mcpPieceService(req.log).delete(pieceId)
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    
    app.delete('/flows', DeleteMcpFlowRequest, async (req, reply) => {
        const { flowId } = req.query
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
        querystring: Type.Object({
            mcpId: ApId,
        }),
    },
    response: {
        [StatusCodes.OK]: Type.Array(McpPieceWithConnection)
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
        querystring: Type.Object({
            mcpId: ApId,
        }),
    },
    response: {
        [StatusCodes.OK]: Type.Array(McpFlowWithFlow),
    },
}


const UpsertMcpPieceRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Upsert MCP piece actions',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: Type.Object({
            mcpId: ApId,
        }),
        body: UpsertMcpPieceRequestBody,
    },
    response: {
        [StatusCodes.OK]: McpPieceWithConnection,
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
        querystring: Type.Object({
            mcpId: ApId,
        }),
        body: UpdateMcpFlowsRequestBody,
    },
    response: {
        [StatusCodes.OK]: Type.Array(McpFlowWithFlow),
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
        querystring: Type.Object({
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
        querystring: Type.Object({
            flowId: ApId,
        }),
    },
    response: {
        [StatusCodes.NO_CONTENT]: Type.Never(),
    },
}
