import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { formatRunResult } from './flow-run-utils'
import { mcpToolError } from './mcp-utils'

const getRunInput = z.object({
    flowRunId: z.string().describe('The ID of the flow run. Use ap_list_runs to find it.'),
})

export const apGetRunTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_run',
        permission: Permission.READ_RUN,
        description: 'Get detailed results of a flow run including step-by-step outputs, errors, and durations. Use ap_list_runs or ap_test_flow to get run IDs.',
        inputSchema: getRunInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowRunId } = getRunInput.parse(args)

                const run = await flowRunService(log).getOnePopulatedOrThrow({
                    id: flowRunId,
                    projectId: mcp.projectId,
                })

                return {
                    content: [{
                        type: 'text',
                        text: formatRunResult(run),
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_get_run failed')
                return mcpToolError('Failed to get run', err)
            }
        },
    }
}
