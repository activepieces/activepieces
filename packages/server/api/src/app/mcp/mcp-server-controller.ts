import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { AgentMcpTool, ApId, buildAuthHeaders, createTransportConfig, isNil, Permission, PopulatedMcpServer, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { mcpServerService } from './mcp-service'

export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {


    app.get('/', GetMcpRequest, async (req) => {
        return mcpServerService(req.log).getPopulatedByProjectId(req.projectId)
    })

    app.post('/', UpdateMcpRequest, async (req) => {
        const { status } = req.body
        return mcpServerService(req.log).update({
            projectId: req.projectId,
            status,
        })
    })

    app.post('/rotate', RotateTokenRequest, async (req) => {
        return mcpServerService(req.log).rotateToken({
            projectId: req.projectId,
        })
    })

    app.post('/http', StreamableHttpRequestRequest, async (req, reply) => {
        const mcp = await mcpServerService(req.log).getPopulatedByProjectId(req.params.projectId)
        const authHeader = req.headers['authorization']
        if (!validateAuthorizationHeader(authHeader, mcp)) {
            return reply.status(401).send({
                error: 'Unauthorized',
            })
        }
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

    app.post('/validate-agent-mcp-tool', AddMcpServerToolRequest, async (req) => {
        const tool = req.body
        let mcpClient: MCPClient | null = null

        try {
            mcpClient = await createMCPClient({
                transport: createTransportConfig(
                    tool.protocol,
                    tool.serverUrl,
                    buildAuthHeaders(tool.auth),
                ) as MCPTransport,
            })
            const mcpTools = await mcpClient.tools()

            return { toolNames: Object.keys(mcpTools).map(toolName => toolName), error: null }
        }
        catch (error) {
            return { toolNames: null, error: `Error connecting to mcp server ${tool.toolName}, Error: ${error}` }
        }
        finally {
            if (!isNil(mcpClient)) {
                await mcpClient.close()
            }
        }
    })
}

function validateAuthorizationHeader(authHeader: string | undefined, mcp: PopulatedMcpServer) {
    const [type, token] = authHeader?.split(' ') ?? []
    return type === 'Bearer' && token === mcp.token
}

const StreamableHttpRequestRequest = {
    config: {
        security: securityAccess.public(),
        skipAuth: true,
    },
    schema: {
        params: Type.Object({
            projectId: ApId,
        }),
    },
}

export const UpdateMcpRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
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

export const AddMcpServerToolRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_FLOW,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['agent'],
        description: 'Validate agent MCP tool',
        params: Type.Object({
            projectId: ApId,
        }),
        body: Type.Composite([
            Type.Omit(AgentMcpTool, ['auth']), 
            Type.Object({
                auth: Type.Any(),
            }),
        ]),
    },
}

const GetMcpRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.READ_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
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
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['mcp'],
        description: 'Rotate the MCP server token',
    },
    params: Type.Object({
        projectId: ApId,
    }),
}