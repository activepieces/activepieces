import {
    BranchCondition,
    FlowOperationRequest,
    FlowOperationType,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const addBranchInput = z.object({
    flowId: z.string(),
    routerStepName: z.string(),
    branchName: z.string(),
    conditions: mcpUtils.BRANCH_CONDITIONS_INPUT_SCHEMA.optional(),
})

export const apAddBranchTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_add_branch',
        permission: Permission.WRITE_FLOW,
        description: 'Add a conditional branch to a router step. Inserted before the fallback branch.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            routerStepName: z.string().describe('The name of the ROUTER step to add a branch to. Use ap_flow_structure to get valid values.'),
            branchName: z.string().describe('Display name for the new branch (e.g. "Branch 1")'),
            conditions: mcpUtils.BRANCH_CONDITIONS_INPUT_SCHEMA.optional().describe('Conditions array (outer array = OR groups, inner array = AND conditions). Required for condition-type branches; omit to use an empty condition group.'),
        },
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, routerStepName, branchName, conditions } = addBranchInput.parse(args)

                const [flow, project] = await Promise.all([
                    flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                    projectService(log).getOneOrThrow(mcp.projectId),
                ])
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }] }
                }

                const resolved = mcpUtils.resolveRouterStep({ stepName: routerStepName, trigger: flow.version.trigger })
                if (resolved.error) {
                    return resolved.error
                }
                const routerStep = resolved.routerStep

                const routerSettings = (routerStep as { settings: { branches: unknown[] } }).settings
                // Insert before the last (fallback) branch
                const branchIndex = Math.max(0, routerSettings.branches.length - 1)

                // The MCP input schema (BRANCH_CONDITIONS_INPUT_SCHEMA) is a single
                // shape with optional fields, while shared's BranchCondition is a
                // discriminated union. The .min(1) and .superRefine on the input
                // schema guarantee the runtime data matches one of the union's
                // members, so the cast is sound.
                const operation: FlowOperationRequest = {
                    type: FlowOperationType.ADD_BRANCH,
                    request: {
                        stepName: routerStepName,
                        branchIndex,
                        branchName,
                        conditions: (conditions ?? [[]]) as BranchCondition[][],
                    },
                }

                const updatedFlow = await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })

                const invalidWarning = mcpUtils.routerInvalidWarning({ stepName: routerStepName, trigger: updatedFlow.version.trigger })
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Branch "${branchName}" added at index ${branchIndex} in router "${routerStepName}". Use ap_add_step with stepLocationRelativeToParent=INSIDE_BRANCH and branchIndex=${branchIndex} to add steps inside this branch.${invalidWarning}`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Add branch failed', err)
            }
        },
    }
}
