import { ApId, McpFlowWithFlow, McpPieceWithConnection, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpsertMcpPieceRequestBody as UpsertMcpPieceRequestBody, UpdateMcpFlowsRequestBody } from '@activepieces/shared'
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
    
    
    app.post('/:id/pieces', UpsertMcpPieceRequest, async (req) => {
        console.log('HAHAHAHAHA upsert piece', req.body)
        const { id } = req.params
        const { pieceName, pieceVersion, actionNames, connectionId } = req.body
        
        const piece = await mcpPieceService(req.log).upsert({
            mcpId: id,
            pieceName,
            pieceVersion,
            actionNames,
            connectionId: connectionId ?? undefined,
        })
        console.log('HAHAHAHAHA after get one or throw', piece)

        if(actionNames.length === 0) {
            await mcpPieceService(req.log).delete(piece.id)
        }
        console.log('HAHAHAHAHA after delete', piece)
        return piece
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
        params: Type.Object({
            id: ApId,
        }),
        body: UpsertMcpPieceRequestBody,
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
}
