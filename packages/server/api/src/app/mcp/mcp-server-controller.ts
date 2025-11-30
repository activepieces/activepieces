import { ALL_PRINCIPAL_TYPES, apId, ApId, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { mcpServerService } from './mcp-service'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'


export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.get('/', GetMcpRequest, async (req) => {
        return mcpServerService(req.log).getPopulatedByProjectId(req.principal.projectId)
    })

    app.post('/', UpdateMcpRequest, async (req) => {
        const { status } = req.body
        return mcpServerService(req.log).update({
            projectId: req.principal.projectId,
            status,
        })
    })

    app.post('/rotate', RotateTokenRequest, async (req) => {
        return mcpServerService(req.log).rotateToken({
            projectId: req.principal.projectId,
        })
    })

    app.post('/http', StreamableHttpRequestRequest, async (req, reply) => {
        const mcp = await mcpServerService(req.log).getPopulatedByProjectId(req.params.projectId)
        const { server } = await mcpServerService(req.log).buildServer({
            mcp,
        })

        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        })

        reply.raw.on('close', async () => {
            await transport.close()
            await server.close()
        })

        await server.connect(transport)
        await transport.handleRequest(req.raw, reply.raw, req.body)
    })

}


const StreamableHttpRequestRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            projectId: ApId,
        }),
    },
}

export const UpdateMcpRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp'],
        description: 'Update the project MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            projectId: ApId,
        }),
        body: UpdateMcpServerRequest,
    },
}


const GetMcpRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp'],
        description: 'Get an MCP server by ID',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            projectId: ApId,
        }),
    },
}

const RotateTokenRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp'],
        description: 'Rotate the MCP server token',
    },
    params: Type.Object({
        projectId: ApId,
    }),
}