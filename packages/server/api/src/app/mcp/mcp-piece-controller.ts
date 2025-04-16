import { AddMCPPieceRequestBody, ALL_PRINCIPAL_TYPES, ApId, MCPPieceStatus, MCPPieceWithConnection, MCPWithPieces, SERVICE_KEY_SECURITY_OPENAPI, UpdateMCPPieceRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { mcpPieceService } from './mcp-piece-service'
import { mcpService } from './mcp-service'

export const mcpPieceController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.get('/', GetMCPPiecesRequest, async (req) => {
        const projectId = req.principal.projectId
        const mcp = await mcpService(req.log).getOrCreate({ projectId })
        return { pieces: mcp.pieces || [] }
    })
    
    app.post('/', AddMCPPieceRequest, async (req) => {
        const { mcpId, pieceName, connectionId, status } = req.body
        
        await mcpPieceService(req.log).add({
            mcpId,
            pieceName,
            status: status ?? MCPPieceStatus.ENABLED,
            connectionId: connectionId ?? undefined,
        })
                
        return mcpService(req.log).getOrThrow({ 
            mcpId,  
        })
    })
    
    app.post('/:id', UpdateMCPPieceRequest, async (req) => {
        const { id } = req.params
        const { connectionId, status } = req.body
        
        await mcpPieceService(req.log).update({
            pieceId: id,
            connectionId: connectionId ?? undefined,
            status: status ?? undefined,
        })

        const mcpId = await mcpPieceService(req.log).getMcpId(id)

        return mcpService(req.log).getOrThrow({ 
            mcpId,
        })
    })
    
    app.delete('/:id', DeletePieceRequest, async (req) => {
        const { id } = req.params
        
        await mcpPieceService(req.log).delete(id)
        
        const mcpId = await mcpPieceService(req.log).getMcpId(id)
        return mcpService(req.log).getOrThrow({ 
            mcpId,
        })
    })

}

const GetMCPPiecesRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['mcp-pieces'],
        description: 'Get current project MCP pieces',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: Type.Object({
                pieces: Type.Array(MCPPieceWithConnection),
            }),
        },
    },
}

const AddMCPPieceRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['mcp-pieces'],
        description: 'Add a new project MCP tool',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: AddMCPPieceRequestBody,
        response: {
            [StatusCodes.OK]: MCPWithPieces,
        },
    },
}

const UpdateMCPPieceRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['mcp-pieces'],
        description: 'Update MCP tool status',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateMCPPieceRequestBody,
        response: {
            [StatusCodes.OK]: MCPWithPieces,
        },
    },
}


const DeletePieceRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['mcp-pieces'],
        description: 'Delete a piece from MCP configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: MCPWithPieces,
        },
    },
} 