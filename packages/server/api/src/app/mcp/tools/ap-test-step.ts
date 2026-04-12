import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { executeFlowTest } from './flow-run-utils'
import { mcpToolError } from './mcp-utils'

const testStepInput = z.object({
    flowId: z.string().describe('The ID of the flow containing the step. Use ap_list_flows to find it.'),
    stepName: z.string().describe('The name of the step to test (e.g., "step_1"). Use ap_flow_structure to find it.'),
})

export const apTestStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_test_step',
        permission: Permission.WRITE_FLOW,
        description: 'Test a single step within a flow. Runs all steps up to and including the specified step using saved sample data. The flow must have a configured trigger.',
        inputSchema: testStepInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, stepName } = testStepInput.parse(args)
                return await executeFlowTest({ flowId, projectId: mcp.projectId, stepName, log })
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_test_step failed')
                return mcpToolError('Failed to test step', err)
            }
        },
    }
}
