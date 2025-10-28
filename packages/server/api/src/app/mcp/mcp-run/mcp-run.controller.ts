import { ListMcpRunRequest, McpRun, Permission, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpRunService } from './mcp-run.service'

const DEFAULT_LIMIT = 10

export const mcpRunController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    
    app.get('/', GetMcpRunRequest, async (req) => {
        const { mcpId, cursorRequest, limit, status, metadata } = req.query
        return mcpRunService(req.log).list({
            mcpId,
            projectId: req.principal.projectId,
            cursorRequest: cursorRequest ?? null,
            limit: limit ?? DEFAULT_LIMIT,
            status: status ?? undefined,
            metadata: metadata ?? undefined, 
        })
    })
}

const GetMcpRunRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-run'],
        description: 'Get MCP run',
        querystring: ListMcpRunRequest,
        response: {
            [StatusCodes.OK]: SeekPage(McpRun),
        },
    },
}