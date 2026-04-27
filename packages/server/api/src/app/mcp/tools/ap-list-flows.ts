import { FlowStatus, FlowTriggerType, isNil, McpServer, McpToolDefinition, Permission, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

const listFlowsInput = z.object({
    limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    status: z.enum(Object.values(FlowStatus) as [FlowStatus, ...FlowStatus[]]).optional(),
    name: z.string().optional(),
})

export const apListFlowsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_flows',
        permission: Permission.READ_FLOW,
        description: 'List flows in the current project with status, trigger type, and published state.',
        inputSchema: {
            limit: z.number().int().min(1).max(MAX_LIMIT).optional().describe(`Max flows to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`),
            status: z.enum(Object.values(FlowStatus) as [FlowStatus, ...FlowStatus[]]).optional().describe('Filter by status: ENABLED or DISABLED.'),
            name: z.string().optional().describe('Filter by flow name (partial match).'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { limit, status, name } = listFlowsInput.parse(args)
                const flows = await flowService(log).list({
                    projectIds: [mcp.projectId],
                    cursorRequest: null,
                    limit: limit ?? DEFAULT_LIMIT,
                    status: status !== undefined ? [status] : undefined,
                    name,
                })
                const lines = flows.data.map((flow) => formatFlowLine(flow))
                const filterNote = (status || name) ? ' (filtered)' : ''
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Listed ${lines.length} flow(s)${filterNote}:\n${lines.join('\n')}`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to list flows', err)
            }
        },
    }
}

function formatFlowLine(flow: PopulatedFlow): string {
    const trigger = flow.version.trigger
    const triggerLabel = trigger.type === FlowTriggerType.PIECE
        ? (trigger.settings.pieceName ?? 'piece (unconfigured)')
        : 'no trigger'
    const published = !isNil(flow.publishedVersionId) ? 'published' : 'draft'
    return `- ${flow.version.displayName} (${flow.id}) | ${flow.status} | ${published} | trigger: ${triggerLabel}`
}
