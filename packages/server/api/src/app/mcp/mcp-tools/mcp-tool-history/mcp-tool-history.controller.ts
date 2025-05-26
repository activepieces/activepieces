import { ListMcpToolHistoryRequest, McpToolHistory, Permission, PrincipalType, SeekPage, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../../authentication/authorization'
import { mcpToolHistoryService } from './mcp-tool-history.service'

const DEFAULT_LIMIT = 10

export const mcpToolHistoryController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    
    app.get('/', GetMcpToolHistoryRequest, async (req) => {
        const { mcpId, cursorRequest, limit, status, metadata } = req.query
        return mcpToolHistoryService(req.log).list({
            mcpId,
            cursorRequest: cursorRequest ?? null,
            limit: limit ?? DEFAULT_LIMIT,
            status: status ?? undefined,
            metadata: metadata ?? undefined, 
        })
    })
}

const GetMcpToolHistoryRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-tool-history'],
        description: 'Get MCP tool history',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListMcpToolHistoryRequest,
        response: {
            [StatusCodes.OK]: SeekPage(McpToolHistory),
        },
    },
}