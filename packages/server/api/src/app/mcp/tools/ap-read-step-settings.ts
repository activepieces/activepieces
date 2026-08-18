import { isNil, Permission } from '@activepieces/core-utils'
import { flowStructureUtil, FlowTriggerType, McpToolDefinition, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

const readStepSettingsInput = z.object({
    flowId: z.string().describe('The id of the flow'),
    stepName: z.string().describe('The name of the step (e.g. "trigger", "step_1"). Use ap_flow_structure to get valid values.'),
})

export const apReadStepSettingsTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_read_step_settings',
        permission: Permission.READ_FLOW,
        description: 'Read the full untruncated settings of any step, including the trigger: piece input, action/trigger name, loop items, router branches, and error handling options. Use this to see a step\'s current configuration before updating it (ap_flow_structure truncates piece input). For reviewing a CODE step\'s source, prefer ap_read_step_code.',
        inputSchema: readStepSettingsInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, stepName } = readStepSettingsInput.parse(args)

                const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }] }
                }

                const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
                if (isNil(step)) {
                    const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger).map(s => s.name).join(', ')
                    return { content: [{ type: 'text', text: `❌ Step "${stepName}" not found. Available steps: ${allSteps}` }] }
                }

                const emptyTriggerHint = step.type === FlowTriggerType.EMPTY
                    ? '\n\nNo trigger selected yet. Use ap_update_trigger to configure one.'
                    : ''
                return {
                    content: [{
                        type: 'text',
                        text: `Settings for step "${step.name}" (type: ${step.type}, displayName: "${step.displayName}"):\n\n${JSON.stringify(step.settings, null, 2)}${emptyTriggerHint}`,
                    }],
                    structuredContent: {
                        stepName: step.name,
                        type: step.type,
                        displayName: step.displayName,
                        valid: step.valid,
                        settings: step.settings,
                    },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to read step settings', err)
            }
        },
    }
}
