import {
    BranchCondition,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
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
    conditions: z.array(z.array(BranchCondition)).optional(),
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
            conditions: z.array(
                z.array(
                    z.object({
                        firstValue: z.string().describe('Left-hand value (can be a template expression like {{step_1.output}})'),
                        operator: z.string().optional().describe('Comparison operator (e.g. TEXT_CONTAINS, NUMBER_IS_GREATER_THAN, EXISTS)'),
                        secondValue: z.string().optional().describe('Right-hand value (not needed for single-value operators like EXISTS, BOOLEAN_IS_TRUE)'),
                        caseSensitive: z.boolean().optional().describe('For text operators: whether to match case sensitively'),
                    }),
                ),
            ).optional().describe('Conditions array (outer array = OR groups, inner array = AND conditions). Required for condition-type branches; omit to use an empty condition group.'),
        },
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowId, routerStepName, branchName, conditions } = addBranchInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const routerStep = flowStructureUtil.getStep(routerStepName, flow.version.trigger)
            if (isNil(routerStep) || routerStep.type !== FlowActionType.ROUTER) {
                const routers = flowStructureUtil.getAllSteps(flow.version.trigger)
                    .filter(s => s.type === FlowActionType.ROUTER)
                    .map(s => s.name)
                    .join(', ')
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Step "${routerStepName}" is not a ROUTER step. Available routers: ${routers || 'none'}`,
                    }],
                }
            }

            const routerSettings = (routerStep as { settings: { branches: unknown[] } }).settings
            // Insert before the last (fallback) branch
            const branchIndex = Math.max(0, routerSettings.branches.length - 1)

            const operation: FlowOperationRequest = {
                type: FlowOperationType.ADD_BRANCH,
                request: {
                    stepName: routerStepName,
                    branchIndex,
                    branchName,
                    conditions: conditions ?? [[]],
                },
            }

            try {
                await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Branch "${branchName}" added at index ${branchIndex} in router "${routerStepName}". Use ap_add_step with stepLocationRelativeToParent=INSIDE_BRANCH and branchIndex=${branchIndex} to add steps inside this branch.`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Add branch failed', err)
            }
        },
    }
}
