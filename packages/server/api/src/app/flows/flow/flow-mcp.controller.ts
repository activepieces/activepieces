import { InvokeMcpByFlowAndStepServerParams, PrincipalType } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { mcpService } from '../../mcp/mcp-service'
import { mcpServerHandler } from '../../mcp/mcp-server/mcp-server-handler'

export const flowMcpController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/:flowId/steps/:stepName/mcp-server', InvokeMcpByFlowAndStepServerRequest, async (request, reply) => {
        const mcp = await mcpService(request.log).getMcpByFlowAndStepOrThrow({
            flowId: request.params.flowId,
            stepName: request.params.stepName,
        })

        await mcpServerHandler.handleStreamableHttpRequest(request, reply, mcp.id, mcp.projectId, request.log)
    },
    )
}

const InvokeMcpByFlowAndStepServerRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        params: InvokeMcpByFlowAndStepServerParams,
    },
}
