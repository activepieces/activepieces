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

const renameFlowInput = z.object({
    flowId: z.string(),
    displayName: z.string(),
})

export const apRenameFlowTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_rename_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Rename a flow.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow to rename'),
            displayName: z.string().describe('The new display name for the flow'),
        },
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            const { flowId, displayName } = renameFlowInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.CHANGE_NAME,
                request: { displayName },
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
                    content: [{ type: 'text', text: `✅ Flow renamed to "${displayName}".` }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow rename failed', err)
            }
        },
    }
}
