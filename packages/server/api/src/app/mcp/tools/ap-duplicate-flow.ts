import {
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

const duplicateFlowInput = z.object({
    flowId: z.string(),
    name: z.string().optional(),
})

export const apDuplicateFlowTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_duplicate_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Duplicate an existing flow. Creates a new copy with all steps and configuration. Connections and sample data are not copied.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow to duplicate. Use ap_list_flows to find it.'),
            name: z.string().optional().describe('Name for the duplicated flow. Defaults to "Copy of {original name}".'),
        },
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId, name } = duplicateFlowInput.parse(args)

                const [sourceFlow, project] = await Promise.all([
                    flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                    projectService(log).getOneOrThrow(mcp.projectId),
                ])
                if (isNil(sourceFlow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }] }
                }

                const displayName = name ?? `Copy of ${sourceFlow.version.displayName}`

                const newFlow = await flowService(log).create({
                    projectId: mcp.projectId,
                    request: {
                        displayName,
                        projectId: mcp.projectId,
                    },
                })

                try {
                    const updatedFlow = await flowService(log).update({
                        id: newFlow.id,
                        projectId: mcp.projectId,
                        userId: null,
                        platformId: project.platformId,
                        operation: {
                            type: FlowOperationType.IMPORT_FLOW,
                            request: {
                                displayName,
                                trigger: sourceFlow.version.trigger,
                                schemaVersion: sourceFlow.version.schemaVersion ?? null,
                                notes: sourceFlow.version.notes ?? null,
                            },
                        },
                    })

                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Flow duplicated successfully.\n  Original: "${sourceFlow.version.displayName}" (id: ${sourceFlow.id})\n  Copy: "${updatedFlow.version.displayName}" (id: ${updatedFlow.id})\n\nNote: Connections are not copied — use ap_flow_structure on the new flow to check configuration status and re-configure steps as needed.`,
                        }],
                    }
                }
                catch (importErr) {
                    try {
                        await flowService(log).delete({ id: newFlow.id, projectId: mcp.projectId })
                    }
                    catch { /* best-effort cleanup */ }
                    return mcpUtils.mcpToolError('Flow duplication failed', importErr)
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow duplication failed', err)
            }
        },
    }
}
