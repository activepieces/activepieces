import { CreateMCPServerFromStepParams, flowStructureUtil, McpTool } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { flowService } from '../../flows/flow/flow.service'
import { mcpServerHandler } from '../../mcp/mcp-server/mcp-server-handler'
import { engineAccess } from '@activepieces/server-shared'

export const mcpFlowSseControllerController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:flowId/versions/:flowVersionId/steps/:stepName/mcp', CreateMCPServerFromStepRequest, async (request, reply) => {
        const flowVersion = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.params.flowId,
            projectId: request.principal.projectId,
            versionId: request.params.flowVersionId,
        })

        const step = flowStructureUtil.getStepOrThrow(request.params.stepName, flowVersion.version.trigger)
        const tools = step.settings?.input?.agentTools ?? []
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
        security: engineAccess(),
    },
    schema: {
        params: CreateMCPServerFromStepParams,
    },
}