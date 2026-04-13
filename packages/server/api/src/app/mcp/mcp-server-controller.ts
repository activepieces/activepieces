import { AgentMcpTool, ApId, buildAuthHeaders, isNil, McpAuthConfig, McpProtocol, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { experimental_createMCPClient as createMCPClient, MCPClient, MCPTransport } from '@ai-sdk/mcp'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { mcpServerService } from './mcp-service'

export const mcpServerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetMcpRequest, async (req) => {
        return mcpServerService(req.log).getPopulatedByProjectId(req.projectId)
    })

    app.post('/', UpdateMcpRequest, async (req) => {
        const { status, enabledTools } = req.body as UpdateMcpServerRequest
        return mcpServerService(req.log).update({
            projectId: req.projectId,
            status,
            enabledTools,
        })
    })

    app.post('/rotate', RotateTokenRequest, async (req) => {
        return mcpServerService(req.log).rotateToken({
            projectId: req.projectId,
        })
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
        params: z.object({
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
        params: z.object({
            projectId: ApId,
        }),
        body: AgentMcpTool.omit({ auth: true }).merge(
            z.object({
                auth: z.unknown(),
            }),
        ),
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
        params: z.object({
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
    params: z.object({
        projectId: ApId,
    }),
}

type McpToolValidationBody = Omit<AgentMcpTool, 'auth'> & { auth: unknown }