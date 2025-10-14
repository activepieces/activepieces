import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, CreateMCPServerFromStepParams, flowStructureUtil, McpTool } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { mcpServerHandler } from '../../mcp/mcp-server/mcp-server-handler'
import { flowService } from './flow.service'

export const flowMcpController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/:flowId/versions/:flowVersionId/steps/:stepName/mcp-server', CreateMCPServerFromStepRequest, async (request, reply) => {
        const flowVersion = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.flowId,
            projectId: request.principal.projectId,
            versionId: request.params.flowVersionId,
        })

        const step = flowStructureUtil.getStepOrThrow(request.params.stepName, flowVersion.version.trigger)
        const tools = step.settings?.input?.agentTools ?? []
        assertNotNullOrUndefined(tools, 'Tools are required')
        const toolsWithMcpId = tools.map((tool: McpTool) => ({
            ...tool,
            mcpId: tool.mcpId ?? `flow:${request.params.flowId}`,
        }))
        await mcpServerHandler.handleStreamableHttpRequest({
            req: request,
            reply,
            projectId: flowVersion.projectId,
            logger: request.log,
            tools: toolsWithMcpId,
        })

        return reply
    })
}

const CreateMCPServerFromStepRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: CreateMCPServerFromStepParams,
    },
}
