import {
    BranchCondition,
    BranchExecutionType,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
    RouterActionSettings,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const updateBranchInput = z.object({
    flowId: z.string(),
    routerStepName: z.string(),
    branchIndex: z.number().int().min(0),
    branchName: z.string().optional(),
    conditions: z.array(z.array(BranchCondition)).optional(),
})

export const apUpdateBranchTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_update_branch',
        permission: Permission.WRITE_FLOW,
        description: 'Update the conditions and/or name of an existing router branch. Does not affect the steps inside the branch.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            routerStepName: z.string().describe('The name of the ROUTER step. Use ap_flow_structure to get valid values.'),
            branchIndex: z.number().describe('The index of the branch to update (0-based). Cannot update the fallback branch conditions.'),
            branchName: z.string().optional().describe('New display name for the branch'),
            conditions: mcpUtils.BRANCH_CONDITIONS_INPUT_SCHEMA.optional().describe('New conditions array (outer array = OR groups, inner array = AND conditions). Replaces the existing conditions entirely.'),
        },
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, routerStepName, branchIndex, branchName, conditions } = updateBranchInput.parse(args)
                if (isNil(branchName) && isNil(conditions)) {
                    return { content: [{ type: 'text', text: '❌ Nothing to update. Provide at least branchName or conditions.' }] }
                }

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

                const branches = [...routerStep.settings.branches]

                if (branchIndex < 0 || branchIndex >= branches.length) {
                    return {
                        content: [{
                            type: 'text',
                            text: `❌ branchIndex ${branchIndex} is out of range. Valid indices are 0–${branches.length - 1}.`,
                        }],
                    }
                }

                const targetBranch = branches[branchIndex]
                if (targetBranch.branchType === BranchExecutionType.FALLBACK) {
                    if (conditions !== undefined) {
                        return {
                            content: [{
                                type: 'text',
                                text: `❌ Cannot set conditions on the fallback branch (index ${branchIndex}). Only branchName can be updated for fallback branches.`,
                            }],
                        }
                    }
                    branches[branchIndex] = {
                        ...targetBranch,
                        ...(branchName !== undefined && { branchName }),
                    }
                }
                else {
                    branches[branchIndex] = {
                        ...targetBranch,
                        ...(branchName !== undefined && { branchName }),
                        ...(conditions !== undefined && { conditions }),
                    }
                }

                const updatedSettings: RouterActionSettings = {
                    ...routerStep.settings,
                    branches,
                }

                const operation: FlowOperationRequest = {
                    type: FlowOperationType.UPDATE_ACTION,
                    request: {
                        type: FlowActionType.ROUTER,
                        name: routerStep.name,
                        displayName: routerStep.displayName,
                        valid: routerStep.valid,
                        settings: updatedSettings,
                    },
                }

                await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })

                const updatedParts: string[] = []
                if (branchName !== undefined) updatedParts.push(`name → "${branchName}"`)
                if (conditions !== undefined) updatedParts.push(`conditions (${conditions.length} OR group(s))`)

                return {
                    content: [{
                        type: 'text',
                        text: `✅ Branch ${branchIndex} of router "${routerStepName}" updated: ${updatedParts.join(', ')}. Steps inside the branch are unchanged.`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Update branch failed', err)
            }
        },
    }
}
