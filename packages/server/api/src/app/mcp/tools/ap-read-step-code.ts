import {
    FlowActionType,
    flowStructureUtil,
    isNil,
    McpToolDefinition,
    Permission,
    ProjectScopedMcpServer,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

const readStepCodeInput = z.object({
    flowId: z.string(),
    stepName: z.string(),
})

export const apReadStepCodeTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_read_step_code',
        permission: Permission.READ_FLOW,
        description: 'Read the full source code, package.json, and input of a CODE step. Returns untruncated content (unlike ap_flow_structure which truncates).',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            stepName: z.string().describe('The name of the CODE step (e.g. "step_1"). Use ap_flow_structure to get valid values.'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, stepName } = readStepCodeInput.parse(args)

                const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }] }
                }

                const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
                if (isNil(step)) {
                    const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger).map(s => s.name).join(', ')
                    return { content: [{ type: 'text', text: `❌ Step "${stepName}" not found. Available steps: ${allSteps}` }] }
                }

                if (step.type !== FlowActionType.CODE) {
                    return { content: [{ type: 'text', text: `❌ Step "${stepName}" is type ${step.type}, not CODE. This tool only works with CODE steps.` }] }
                }

                const settings = step.settings as { sourceCode?: { code?: string, packageJson?: string }, input?: Record<string, unknown> }
                const code = settings.sourceCode?.code ?? ''
                const packageJson = settings.sourceCode?.packageJson ?? '{}'
                const input = settings.input ?? {}

                return {
                    content: [{
                        type: 'text',
                        text: `Source code for step "${stepName}":\n\n### Source Code\n\`\`\`typescript\n${code}\n\`\`\`\n\n### package.json\n\`\`\`json\n${packageJson}\n\`\`\`\n\n### Input\n${JSON.stringify(input, null, 2)}`,
                    }],
                    structuredContent: { stepName, code, packageJson, input },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to read step code', err)
            }
        },
    }
}
