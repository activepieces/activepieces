import { isNil, Permission } from '@activepieces/core-utils'
import { FlowOperationRequest, FlowOperationType, FlowStatus, flowStructureUtil, McpToolContext, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const lockAndPublishInput = z.object({
    flowId: z.string(),
})

export const apLockAndPublishTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_lock_and_publish',
        permission: Permission.UPDATE_FLOW_STATUS,
        description: 'Publish the current draft version of a flow. This locks the draft and sets it as the published version. Whether the flow is enabled on publish is controlled by the ENABLE_FLOW_ON_PUBLISH env var. Returns validation errors if the flow is not ready.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow to publish'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
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

            const enableOnPublish = system.getBoolean(AppSystemProp.ENABLE_FLOW_ON_PUBLISH) ?? true
            const status = enableOnPublish ? FlowStatus.ENABLED : FlowStatus.DISABLED

            const operation: FlowOperationRequest = {
                type: FlowOperationType.LOCK_AND_PUBLISH,
                request: { status },
            }

            try {
                await flowService(log).update({
                    id: flow.id,
                    projectId: mcp.projectId,
                    userId,
                    previousFlow: flow,
                    platformId: project.platformId,
                    operation,
                })
                const outcome = enableOnPublish ? 'published and enabled' : 'published (flow left disabled)'
                return {
                    content: [{ type: 'text', text: `✅ Flow "${flow.version.displayName}" ${outcome} successfully.` }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Publish failed', err)
            }
        },
    }
}
