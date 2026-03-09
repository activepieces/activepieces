import {
    FlowOperationRequest,
    FlowOperationType,
    FlowStatus,
    flowStructureUtil,
    isNil,
    McpServer,
    McpToolDefinition,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'

const lockAndPublishInput = z.object({
    flowId: z.string(),
})

export const apLockAndPublishTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_lock_and_publish',
        description: 'Publish the current draft version of a flow. This locks the draft and sets it as the published version. Returns validation errors if the flow is not ready. After publishing, use ap_change_flow_status to enable the flow.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow to publish'),
        },
        execute: async (args) => {
            const { flowId } = lockAndPublishInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

            // Check flow validity before publishing
            const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger)
            const invalidSteps = allSteps.filter(s => !s.valid && !(s as { skip?: boolean }).skip)
            if (invalidSteps.length > 0) {
                const stepList = invalidSteps.map(s => `"${s.name}" (${s.displayName})`).join(', ')
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Flow has invalid steps: ${stepList}. Fix these steps using ap_update_step or ap_update_trigger before publishing.`,
                    }],
                }
            }

            const operation: FlowOperationRequest = {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: { status: FlowStatus.ENABLED },
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
                    content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" published successfully. Use ap_change_flow_status to enable it.` }],
                }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{ type: 'text', text: `❌ Publish failed: ${message}` }],
                }
            }
        },
    }
}
