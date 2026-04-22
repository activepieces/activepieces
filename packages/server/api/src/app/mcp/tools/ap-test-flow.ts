import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { executeFlowTest } from './flow-run-utils'
import { mcpUtils } from './mcp-utils'

const testFlowInput = z.object({
    flowId: z.string().describe('The ID of the flow to test. Use ap_list_flows to find it.'),
    triggerTestData: z.record(z.string(), z.unknown()).optional().describe('Mock trigger output data. Saved as sample data before running the test. Useful when the trigger has no prior test data.'),
})

export const apTestFlowTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_test_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Test a flow end-to-end in the test environment. Requires a configured trigger. Waits up to 120s. Pass triggerTestData to provide mock trigger output when no sample data exists.',
        inputSchema: testFlowInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, triggerTestData } = testFlowInput.parse(args)
                return await executeFlowTest({ flowId, projectId: mcp.projectId, triggerTestData, log })
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_test_flow failed')
                return mcpUtils.mcpToolError('Failed to test flow', err)
            }
        },
    }
}
