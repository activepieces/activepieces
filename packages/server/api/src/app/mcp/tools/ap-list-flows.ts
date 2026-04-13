import { FlowTriggerType, isNil, McpServer, McpToolDefinition, Permission, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

export const apListFlowsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_flows',
        permission: Permission.READ_FLOW,
        description: 'List all flows in the current project with status, trigger type, and published state.',
        inputSchema: {},
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async () => {
            try {
                const flows = await flowService(log).list({
                    projectIds: [mcp.projectId],
                    cursorRequest: null,
                    limit: 1000000,
                })
                const lines = flows.data.map((flow) => formatFlowLine(flow))
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Listed ${lines.length} flow(s):\n${lines.join('\n')}`,
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