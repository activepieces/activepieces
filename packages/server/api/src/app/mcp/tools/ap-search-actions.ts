import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { toolSearchService } from '../../tool-search/tool-search.service'
import { mcpUtils } from './mcp-utils'

export const apSearchActionsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_search_actions',
        description: 'Find piece actions by natural-language task description (e.g. "send a message to a Slack channel"). Returns the most semantically relevant actions ranked by similarity — lightweight rows only — or an empty list when nothing in the catalog is relevant (it does not force a match). This is the discovery step: take a result\'s pieceName + actionName to ap_get_piece_props for its input schema, then ap_run_action to execute it.',
        inputSchema: searchActionsInput.shape,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { query, limit } = searchActionsInput.parse(args)

                const platformId = await mcpUtils.resolvePlatformId({ mcp, log })
                const projectId = mcpUtils.isProjectScoped(mcp) ? mcp.projectId : undefined

                const { results, mode } = await toolSearchService(log).searchActions(query, { platformId, projectId, limit })

                const text = results.length === 0
                    ? `🔍 No matching actions found for "${query}".`
                    : `🔍 Top ${results.length} action match(es) for "${query}":\n${JSON.stringify(results, null, 2)}`
                return {
                    content: [{ type: 'text', text }],
                    structuredContent: { results, mode },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to search actions', err)
            }
        },
    }
}

const searchActionsInput = z.object({
    query: z.string().describe('Natural-language description of the task to accomplish (e.g. "send a message to a Slack channel", "create a Google Calendar event").'),
    limit: z.number().int().min(1).max(20).optional().describe('Maximum number of action matches to return. Defaults to 5.'),
})
