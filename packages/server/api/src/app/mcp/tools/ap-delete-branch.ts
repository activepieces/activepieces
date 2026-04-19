import {
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

const deleteBranchInput = z.object({
    flowId: z.string(),
    routerStepName: z.string(),
    branchIndex: z.number().int().min(0),
})

export const apDeleteBranchTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_branch',
        permission: Permission.WRITE_FLOW,
        description: 'Delete a branch from a router step. Cannot delete the fallback branch.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            routerStepName: z.string().describe('The name of the ROUTER step. Use ap_flow_structure to get valid values.'),
            branchIndex: z.number().describe('The index of the branch to delete (0-based). Cannot delete the fallback/last branch.'),
        },
        annotations: { destructiveHint: true, openWorldHint: false },
        execute: async (args) => {
            const { flowId, routerStepName, branchIndex } = deleteBranchInput.parse(args)

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

            const branches = (routerStep as { settings: { branches: unknown[] } }).settings.branches
            if (branchIndex < 0 || branchIndex >= branches.length) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ branchIndex ${branchIndex} is out of range. Valid indices are 0–${branches.length - 2} (the fallback branch at index ${branches.length - 1} cannot be deleted).`,
                    }],
                }
            }
            if (branchIndex >= branches.length - 1) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Cannot delete branch at index ${branchIndex}: it is the fallback branch (index ${branches.length - 1}). Only non-fallback branches can be deleted.`,
                    }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.DELETE_BRANCH,
                request: {
                    stepName: routerStepName,
                    branchIndex,
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
                    content: [{ type: 'text', text: `✅ Branch at index ${branchIndex} deleted from router "${routerStepName}".` }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Delete branch failed', err)
            }
        },
    }
}
