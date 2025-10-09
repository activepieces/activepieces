import { assertNotNullOrUndefined, InvokeMcpByFlowServerBody, InvokeMcpByFlowServerParams, PrincipalType } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { mcpServerHandler } from '../../mcp/mcp-server/mcp-server-handler'
import { flowService } from './flow.service'

export const flowMcpController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/:flowId/mcp-server', InvokeMcpByFlowServerRequest, async (request, reply) => {
        const flow = await flowService(request.log).getOneById(request.params.flowId)
        assertNotNullOrUndefined(flow, 'flow')
        await mcpServerHandler.handleStreamableHttpRequest({
            req: request,
            reply,
            projectId: flow.projectId,
            tools: request.body.tools,
            logger: request.log,
        })
    },
    )
}

const InvokeMcpByFlowServerRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        params: InvokeMcpByFlowServerParams,
        body: InvokeMcpByFlowServerBody,
    },
}
