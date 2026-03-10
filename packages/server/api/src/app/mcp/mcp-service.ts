import { apId, isNil, McpServer as McpServerSchema, McpServerStatus, PopulatedMcpServer } from '@activepieces/shared'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { projectService } from '../project/project-service'
import { McpServerEntity } from './mcp-entity'
import { listFlows, registerFlowTools } from './tools/flow-tools'
import { registerProjectTools } from './tools/project-tools'
import { registerTableTools } from './tools/table-tools'

export const mcpServerRepository = repoFactory(McpServerEntity)

export const mcpServerService = (log: FastifyBaseLogger) => {
    return {
        getPopulatedByUserId: async (userId: string, platformId: string): Promise<PopulatedMcpServer> => {
            const mcp = await mcpServerService(log).getByUserId(userId)
            const projects = await projectService(log).getAllForUser({ userId, platformId, isPrivileged: false })
            const projectIds = projects.map((p) => p.id)
            const flows = await listFlows(projectIds, log)
            return {
                ...mcp,
                flows,
            }
        },
        getByUserId: async (userId: string): Promise<McpServerSchema> => {
            const mcpServer = await mcpServerRepository().findOneBy({ userId })
            if (isNil(mcpServer)) {
                await mcpServerRepository().upsert({
                    id: apId(),
                    status: McpServerStatus.ENABLED,
                    userId,
                }, ['userId'])
                return mcpServerRepository().findOneByOrFail({ userId })
            }
            return mcpServer
        },
        buildServer: async ({ mcp, projects }: BuildServerRequest): Promise<McpServer> => {
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
            registerProjectTools(server, projects)
            await registerTableTools(server, projects, log)
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
    projects: Array<{ id: string, displayName: string }>
}
