import { McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { toolSearchService } from '../../tool-search/tool-search.service'
import { mcpUtils } from './mcp-utils'

export const apSearchTriggersTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_search_triggers',
        description: 'Find piece triggers (the event that starts a flow) by natural-language description of when the flow should run (e.g. "when a new row is added to a Google Sheet", "when an email arrives"). Returns the most semantically relevant triggers ranked by similarity — lightweight rows only — or an empty list when nothing in the catalog is relevant (it does not force a match). Always available: when no embedding model is configured it falls back to a keyword catalog search (response "mode":"keyword", lexical not semantic). Each row carries a `connected` flag indicating whether this project already has a connection for the piece. Optionally scope to a single piece with `pieceName`. This is the discovery step: take a result\'s pieceName + triggerName to ap_get_piece_props for its input schema.',
        inputSchema: searchTriggersInput.shape,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { query, limit, pieceName } = searchTriggersInput.parse(args)

                const platformId = await mcpUtils.resolvePlatformId({ mcp, log })
                const projectId = mcpUtils.isProjectScoped(mcp) ? mcp.projectId : undefined

                const { results, mode, degradeReason } = await toolSearchService(log).searchTriggers(query, {
                    platformId,
                    projectId,
                    limit,
                    pieceName: mcpUtils.normalizePieceName(pieceName),
                })

                // Distinguish the two degrade causes so the note never claims "no model configured"
                // when a model IS configured but its embed call failed (a transient outage, not config).
                const degradeCause = degradeReason === 'embed-failed'
                    ? 'the embedding service call failed'
                    : 'no embedding model configured'
                const modeNote = mode === 'keyword'
                    ? ` (keyword fallback — ${degradeCause}, so matches are lexical, not semantic)`
                    : ''
                const text = results.length === 0
                    ? `🔍 No matching triggers found for "${query}".`
                    : `🔍 Top ${results.length} trigger match(es) for "${query}"${modeNote}:\n${JSON.stringify(results, null, 2)}`
                return {
                    content: [{ type: 'text', text }],
                    structuredContent: { results, mode },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to search triggers', err)
            }
        },
    }
}

const searchTriggersInput = z.object({
    query: z.string().trim().min(1, 'query must be a non-empty event description').describe('Natural-language description of the event that should start the flow (e.g. "when a new row is added to a Google Sheet", "when a new email arrives").'),
    limit: z.number().int().min(1).max(20).optional().describe('Maximum number of trigger matches to return. Defaults to 5.'),
    pieceName: z.string().optional().describe('Restrict results to a single piece (e.g. "slack" or "@activepieces/piece-slack"). Omit to search the whole catalog.'),
})
