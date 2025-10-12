import { assertNotNullOrUndefined, CreateMCPServerFromStepParams, flowStructureUtil, PrincipalType } from '@activepieces/shared'
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
        assertNotNullOrUndefined(step.settings.input?.tools, 'tools')
        await mcpServerHandler.handleStreamableHttpRequest({
            req: request,
            reply,
            projectId: flowVersion.projectId,
            tools: step.settings.input?.tools,
            logger: request.log,
        })
    },
    )
}
const CreateMCPServerFromStepRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
    schema: {
        params: CreateMCPServerFromStepParams,
    },
}
