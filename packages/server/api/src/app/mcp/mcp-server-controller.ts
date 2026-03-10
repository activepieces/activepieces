import { securityAccess } from '@activepieces/server-common'
import { AgentMcpTool, buildAuthHeaders, isNil, McpAuthConfig, McpProtocol, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { projectService } from '../project/project-service'
import { mcpServerService } from './mcp-service'

export const mcpStreamableController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', StreamableHttpRequest, async (_req, reply) => {
        return reply.status(405).send({
            error: 'Method Not Allowed',
            message: 'Use POST with Authorization: Bearer <token> for MCP requests.',
        })
    })

    app.post('/', StreamableHttpRequest, async (req, reply) => {
        const userId = req.principal.id
        const platformId = req.principal.platform.id
        const mcp = await mcpServerService(req.log).getPopulatedByUserId(userId, platformId)
        const projects = await projectService(req.log).getAllForUser({ userId, platformId, isPrivileged: false })
        const mcpServer = await mcpServerService(req.log).buildServer({
            mcp,
            projects: projects.map((p) => ({ id: p.id, displayName: p.displayName })),
        })

        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        })

        reply.raw.on('close', async () => {
            await transport.close()
            await mcpServer.close()
        })

        await mcpServer.connect(transport)
        await transport.handleRequest(req.raw, reply.raw, req.body)
    })
}

export const mcpServerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetMcpRequest, async (req) => {
        return mcpServerService(req.log).getPopulatedByUserId(req.principal.id, req.principal.platform.id)
    })

    app.post('/validate-agent-mcp-tool', AddMcpServerToolRequest, async (req) => {
        const tool = req.body as McpToolValidationBody
        let mcpClient: MCPClient | null = null

        try {
            mcpClient = await createMCPClient({
                transport: createTransportConfig(
                    tool.protocol,
                    tool.serverUrl,
                    buildAuthHeaders(tool.auth as McpAuthConfig),
                ) as MCPTransport,
            })
            const mcpTools = await mcpClient.tools()

            return { toolNames: Object.keys(mcpTools), error: null }
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

function createTransportConfig(
    protocol: McpProtocol,
    serverUrl: string,
    headers: Record<string, string> = {},
) {
    const url = new URL(serverUrl)

    switch (protocol) {
        case McpProtocol.SIMPLE_HTTP: {
            return {
                type: 'http',
                url: serverUrl,
                headers,
            }
        }
        case McpProtocol.STREAMABLE_HTTP: {
            return new StreamableHTTPClientTransport(url, {
                requestInit: {
                    headers,
                },
            })
        }
        case McpProtocol.SSE: {
            return {
                type: 'sse',
                url: serverUrl,
                headers,
            }
        }
        default:
            throw new Error(`Unsupported MCP protocol type: ${protocol}`)
    }
}

const StreamableHttpRequest = {
    config: {
        security: securityAccess.unscoped([PrincipalType.OAUTH]),
    },
    schema: {
    },
}

export const AddMcpServerToolRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['agent'],
        description: 'Validate agent MCP tool',
        body: AgentMcpTool.omit({ auth: true }).merge(
            z.object({
                auth: z.unknown(),
            }),
        ),
    },
}

const GetMcpRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.OAUTH]),
    },
    schema: {
        tags: ['mcp'],
        description: 'Get an MCP server for the current user',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

type McpToolValidationBody = Omit<AgentMcpTool, 'auth'> & { auth: unknown }
