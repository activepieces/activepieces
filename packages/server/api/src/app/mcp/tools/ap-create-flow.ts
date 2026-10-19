import { Permission } from '@activepieces/core-utils'
import { FlowCreatorType, McpToolContext, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

const createFlowInput = z.object({
    flowName: z.string().trim().min(1, 'Flow name cannot be empty').max(255, 'Flow name must be 255 characters or less').describe('The name of the flow'),
    folderName: mcpUtils.FOLDER_NAME_SCHEMA,
})

export const apCreateFlowTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_create_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Create a new flow in Activepieces',
        inputSchema: createFlowInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowName, folderName } = createFlowInput.parse(args)
            try {
                const folder = await mcpUtils.resolveFolder({ projectId: mcp.projectId, folderName, log })
                if (folder.error) {
                    return folder.error
                }
                const flow = await flowService(log).create({
                    projectId: mcp.projectId,
                    ownerId: userId,
                    createdBy: { type: FlowCreatorType.MCP, id: mcp.id },
                    request: {
                        displayName: flowName,
                        projectId: mcp.projectId,
                        folderId: folder.folderId,
                    },
                })
                return {
                    content: [{
                        type: 'text',
                        text: `✅ Created flow "${flow.version.displayName}" (id: ${flow.id})${mcpUtils.folderSuffix(folder.folderName)}. Another flow's Call Flow step references it by externalId ${flow.externalId}. The flow has an empty trigger. Next steps:\n1. Use ap_update_trigger to set the trigger (e.g. webhook, schedule, or a piece trigger)\n2. Use ap_add_step to add action steps after the trigger\n3. Use ap_update_step to configure each step's inputs`,
                    }],
                    structuredContent: { flowId: flow.id, externalId: flow.externalId, displayName: flow.version.displayName, folderName: folder.folderName ?? null },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow creation failed', err)
            }
        },
    }
}
