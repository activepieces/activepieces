import { McpToolDefinition, Permission, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

export const apDeleteFlowTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_delete_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Permanently delete a flow and all its versions. This cannot be undone.',
        inputSchema: {
            flowId: z.string().describe('The ID of the flow to delete'),
        },
        annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowId } = z.object({ flowId: z.string() }).parse(args)
            try {
                const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId })
                const displayName = flow?.version?.displayName ?? flowId
                await flowService(log).delete({
                    id: flowId,
                    projectId: mcp.projectId,
                })
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Flow "${displayName}" has been permanently deleted.`,
                    }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow deletion failed', err)
            }
        },
    }
}
