import { McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { executeFlowTest } from './flow-run-utils'
import { mcpUtils } from './mcp-utils'

const testStepInput = z.object({
    flowId: z.string().describe('The ID of the flow containing the step. Use ap_list_flows to find it.'),
    stepName: z.string().describe('The name of the step to test (e.g., "step_1"). Use ap_flow_structure to find it.'),
    triggerTestData: z.record(z.string(), z.unknown()).optional().describe('Mock trigger output data. Saved as sample data before running the test. Useful when the trigger has no prior test data.'),
})

export const apTestStepTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_test_step',
        permission: Permission.WRITE_FLOW,
        description: 'Test a single step within a flow. Runs all steps up to and including the specified step. The flow must have a configured trigger. Pass triggerTestData when no sample data exists.',
        inputSchema: testStepInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, stepName, triggerTestData } = testStepInput.parse(args)
                return await executeFlowTest({ flowId, projectId: mcp.projectId, stepName, triggerTestData, log })
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_test_step failed')
                return mcpUtils.mcpToolError('Failed to test step', err)
            }
        },
    }
}
