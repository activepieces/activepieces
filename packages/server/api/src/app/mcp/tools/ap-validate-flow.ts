import { isNil, Permission } from '@activepieces/core-utils'
import { McpToolContext, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { flowValidation } from './flow-validation'
import { mcpUtils } from './mcp-utils'
import { solutionValidation } from './solution-validation'

export const apValidateFlowTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_validate_flow',
        permission: Permission.READ_FLOW,
        description: 'Validate without publishing or running anything. To check whether several flows and tables in a folder fit together, pass folderName instead of inspecting them by hand. Pass flowId to check one flow: step validity, template references and empty branches. Pass folderName to check a whole solution: every flow in the folder, plus the connections between them (each Call Flow targets a real Callable Flow, sends every input its sample data expects and only waits for a response the subflow returns; each Tables step and table trigger points at a real table and real fields). Use it before ap_lock_and_publish, and after building a solution of several flows and tables, fixing every issue it reports.',
        inputSchema: validateFlowInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, folderName } = validateFlowInput.parse(args)
                const validatesSolution = !isNil(folderName) && isNil(flowId)
                if (validatesSolution) {
                    return await solutionValidation.validate({ mcp, userId, folderName, log })
                }
                if (isNil(flowId) || !isNil(folderName)) {
                    return { content: [{ type: 'text', text: '❌ Pass exactly one of flowId (one flow) or folderName (a whole solution).' }] }
                }

                const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found.' }] }
                }

                const result = flowValidation.validateFlow({ trigger: flow.version.trigger })
                return {
                    content: [{ type: 'text', text: flowValidation.formatValidationResult({ result, flowDisplayName: flow.version.displayName }) }],
                    structuredContent: {
                        valid: flowValidation.hasNoBlockingIssues(result.issues) && result.validSteps > 0,
                        totalSteps: result.totalSteps,
                        validSteps: result.validSteps,
                        invalidSteps: result.invalidSteps,
                        skippedSteps: result.skippedSteps,
                        issues: result.issues.map(i => ({ category: i.category, severity: i.severity, stepName: i.stepName, message: i.message })),
                    },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow validation failed', err)
            }
        },
    }
}

const validateFlowInput = z.object({
    flowId: z.string().optional().describe('The id of one flow to validate. Use ap_list_flows to find it.'),
    folderName: mcpUtils.FOLDER_NAME_SCHEMA.describe('The folder holding a solution of several flows and tables (as created with ap_create_folder), to validate all of them and the connections between them.'),
})
