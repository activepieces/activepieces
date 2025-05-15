import { AddMcpPieceRequestBody, ApId, McpPieceStatus, McpPieceWithConnection, McpWithPieces, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpPieceRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { mcpPieceService } from './mcp-piece-service'
import { mcpService } from './mcp-service'

export const mcpPieceController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    

    app.get('/:id', GetMcpPiecesRequest, async (req) => {
        const { id } = req.params
        const mcp = await mcpService(req.log).getOrThrow({ mcpId: id })
        return { pieces: mcp.pieces || [] }
    })
    
    app.post('/', AddMcpPieceRequest, async (req) => {
        const { mcpId, pieceName, connectionId, status } = req.body
        
        await mcpPieceService(req.log).add({
            mcpId,
            pieceName,
            status: status ?? McpPieceStatus.ENABLED,
            connectionId: connectionId ?? undefined,
        })
                
        return mcpService(req.log).getOrThrow({ 
            mcpId,  
        })
    })
    
    app.post('/:id', UpdateMcpPieceRequest, async (req) => {
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

        const mcpId = await mcpPieceService(req.log).getMcpId(id)

        await mcpPieceService(req.log).delete(id)

        return mcpService(req.log).getOrThrow({ 
            mcpId,
        }) 
    })

}

const GetMcpPiecesRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Get current project MCP pieces',
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

const AddMcpPieceRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Add a new MCP piece',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: AddMcpPieceRequestBody,
        response: {
            [StatusCodes.OK]: McpWithPieces,
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
        description: 'Update MCP piece status',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateMcpPieceRequestBody,
        response: {
            [StatusCodes.OK]: McpWithPieces,
        },
    },
}


const DeletePieceRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Delete a piece from MCP configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: McpWithPieces,
        },
    },
} 