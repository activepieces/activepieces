import { FlowRunStatus, McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { formatRunSummary } from './flow-run-utils'
import { mcpUtils } from './mcp-utils'

const runStatusValues = Object.values(FlowRunStatus) as [FlowRunStatus, ...FlowRunStatus[]]

const listRunsInput = z.object({
    flowId: z.string().optional().describe('Filter by flow ID. Use ap_list_flows to find it.'),
    status: z.enum(runStatusValues).optional().describe('Filter by status: SUCCEEDED, FAILED, RUNNING, QUEUED, PAUSED, TIMEOUT, etc.'),
    limit: z.number().min(1).max(50).optional().describe('Max runs to return (default 10, max 50)'),
})

export const apListRunsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_runs',
        permission: Permission.READ_RUN,
        description: 'List recent flow runs with optional filters. Returns run ID, status, environment, timestamps, and failed step info. Does not include step outputs — use ap_get_run for full details.',
        inputSchema: listRunsInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, status, limit } = listRunsInput.parse(args)

                const result = await flowRunService(log).list({
                    projectId: mcp.projectId,
                    flowId: flowId ? [flowId] : undefined,
                    status: status ? [status] : undefined,
                    cursor: null,
                    limit: limit ?? 10,
                })

                if (result.data.length === 0) {
                    return { content: [{ type: 'text', text: 'No flow runs found matching the criteria.' }] }
                }

                const lines = result.data.map(run => formatRunSummary(run))
                return {
                    content: [{
                        type: 'text',
                        text: `Flow runs (${result.data.length}):\n\n${lines.join('\n')}`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_list_runs failed')
                return mcpUtils.mcpToolError('Failed to list runs', err)
            }
        },
    }
}
