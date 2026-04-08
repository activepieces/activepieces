import {
    FlowOperationRequest,
    FlowOperationType,
    FlowStatus,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpToolError } from './mcp-utils'

const changeFlowStatusInput = z.object({
    flowId: z.string(),
    status: z.enum(Object.values(FlowStatus) as [FlowStatus, ...FlowStatus[]]),
})

export const apChangeFlowStatusTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_change_flow_status',
        permission: Permission.UPDATE_FLOW_STATUS,
        description: 'Enable or disable a flow. The flow must be published first (use ap_lock_and_publish). Use ap_list_flows to get flow IDs.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
            status: z.enum([FlowStatus.ENABLED, FlowStatus.DISABLED]).describe('The new status: ENABLED to activate the flow, DISABLED to pause it'),
        },
        annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            const { flowId, status } = changeFlowStatusInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            if (status === FlowStatus.ENABLED && isNil(flow.publishedVersionId)) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Flow "${flow.version.displayName}" has no published version. Use ap_lock_and_publish first.`,
                    }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status },
            }

            try {
                await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId: null,
                    platformId: project.platformId,
                    operation,
                })
                const action = status === FlowStatus.ENABLED ? 'enabled' : 'disabled'
                return {
                    content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" ${action} successfully.` }],
                }
            }
            catch (err) {
                return mcpToolError('Status change failed', err)
            }
        },
    }
}
