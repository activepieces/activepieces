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
import { mcpToolError } from './mcp-utils'

const lockAndPublishInput = z.object({
    flowId: z.string(),
})

export const apLockAndPublishTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_lock_and_publish',
        description: 'Publish and enable the current draft version of a flow. This locks the draft, sets it as the published version, and enables the flow. Returns validation errors if the flow is not ready.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow to publish'),
        },
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const { flowId } = lockAndPublishInput.parse(args)

            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }

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
                    content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" published and enabled successfully.` }],
                }
            }
            catch (err) {
                return mcpToolError('Publish failed', err)
            }
        },
    }
}
