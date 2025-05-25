import { ApId, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpsertMcpToolRequestBody, McpTool, McpToolWithPiece, McpToolWithFlow } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpToolService } from './mcp-tool.service'

export const mcpToolController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    
    app.get('/', GetMcpToolsRequest, async (req) => {
        const { mcpId } = req.query
        return await mcpToolService(req.log).list({
            mcpId,
            projectId: req.principal.projectId,
            platformId: req.principal.platform.id,
        })
    })
    
    app.post('/', UpsertMcpToolRequest, async (req) => {
        const { mcpId, type, data } = req.body

        const tool = await mcpToolService(req.log).upsert({
            mcpId,
            type,
            data,
            projectId: req.principal.projectId,
            platformId: req.principal.platform.id,
        })

        return tool
    })

    app.delete('/:id', DeleteMcpToolRequest, async (req, reply) => {
        const { id } = req.params
        await mcpToolService(req.log).delete(id)
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const GetMcpToolsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp-tool'],
        description: 'Get MCP tools',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: Type.Object({
            mcpId: ApId,
        }),
    },
    response: {
        [StatusCodes.OK]: Type.Object({
            tools: Type.Array(Type.Union([McpToolWithFlow, McpToolWithPiece])),
        })
    },
}

const UpsertMcpToolRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-tool'],
        description: 'Update MCP tool',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: UpsertMcpToolRequestBody,
    },
}

const DeleteMcpToolRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp-piece'],
        description: 'Delete MCP Tool',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
    },
    response: {
        [StatusCodes.NO_CONTENT]: Type.Never(),
    },
}