import { ApId, McpActionWithConnection, McpPieceWithConnection, McpWithActions, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpActionsRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpActionService } from './mcp-action-service'
import { mcpService } from '../mcp-server/mcp-service'

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
    
    
    app.post('/:mcpId/actions', UpdateMcpActionsRequest, async (req) => {
        const { mcpId } = req.params
        const { pieceName, pieceVersion, actionNames, connectionId } = req.body
        
        await mcpActionService(req.log).updateBatch({
            mcpId,
            pieceName: pieceName,
            pieceVersion: pieceVersion,
            actionNames: actionNames,
            connectionId: connectionId ?? undefined,
        })


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
            [StatusCodes.OK]: McpWithActions,
        },
    },
}
