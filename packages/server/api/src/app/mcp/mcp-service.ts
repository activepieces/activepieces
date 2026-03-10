import { apId, isNil, McpServer as McpServerSchema, McpServerStatus, PopulatedMcpServer } from '@activepieces/shared'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { McpServerEntity } from './mcp-entity'
import { listFlows, registerFlowTools } from './tools/flow-tools'
import { registerTableTools } from './tools/table-tools'

export const mcpServerRepository = repoFactory(McpServerEntity)

export const mcpServerService = (log: FastifyBaseLogger) => {
    return {
        getPopulatedByProjectId: async (projectId: string): Promise<PopulatedMcpServer> => {
            const mcp = await mcpServerService(log).getByProjectId(projectId)
            const flows = await listFlows(mcp, log)
            return {
                ...mcp,
                flows,
            }
        },
        getByProjectId: async (projectId: string): Promise<McpServerSchema> => {
            const mcpServer = await mcpServerRepository().findOneBy({ projectId })
            if (isNil(mcpServer)) {
                await mcpServerRepository().upsert({
                    id: apId(),
                    status: McpServerStatus.ENABLED,
                    projectId,
                    token: apId(72),
                }, ['projectId'])
                return mcpServerRepository().findOneByOrFail({ projectId })
            }
            return mcpServer
        },
        rotateToken: async ({ projectId }: RotateTokenRequest): Promise<PopulatedMcpServer> => {
            const mcp = await mcpServerService(log).getByProjectId(projectId)
            await mcpServerRepository().update(mcp.id, {
                token: apId(72),
            })
            return mcpServerService(log).getPopulatedByProjectId(projectId)
        },
        buildServer: async ({ mcp }: BuildServerRequest): Promise<McpServer> => {
            const server = new McpServer({
                name: 'Activepieces',
                title: 'Activepieces',
                version: '1.0.0',
                websiteUrl: 'https://activepieces.com',
                description: 'Automation and workflow MCP server by Activepieces',
                icons: [
                    {
                        src: 'https://cdn.activepieces.com/pieces/activepieces.png',
                        mimeType: 'image/png',
                        sizes: ['48x48', '96x96'],
                    },
                ],
            })

            await registerFlowTools(server, mcp, log)
            await registerTableTools(server, mcp.projectId, log)
            registerEmptyResourcesAndPrompts(server)

            return server
        },
    }
}

/**
 * Registers resources/list and prompts/list so they return empty lists.
 *
 * - Resources: register a resource template with an empty list.
 * - Prompts: register an empty prompt so the handler is set and returns [].
 *
 * Claude Desktop (mcp-remote) does not support prompts/list, so we register an empty prompt.
 */
function registerEmptyResourcesAndPrompts(server: McpServer): void {
    server.registerResource(
        '_',
        new ResourceTemplate('activepieces://empty', {
            list: async () => ({ resources: [] }),
        }),
        {},
        async () => ({ contents: [] }),
    )
    server.registerPrompt('_', {}, () => ({ messages: [] }))
}

type BuildServerRequest = {
    mcp: PopulatedMcpServer
}

type RotateTokenRequest = {
    projectId: string
}

