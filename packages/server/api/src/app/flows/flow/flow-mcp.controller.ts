import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, CreateMCPServerFromStepParams, flowStructureUtil, PrincipalType } from '@activepieces/shared'
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

        return await mcpServerHandler.handleStreamableHttpRequest({
            req: request,
            reply,
            projectId: flowVersion.projectId,
            tools: step.settings.input.agentTools ?? [],
            logger: request.log,
        })
        
    }
    )
}
const CreateMCPServerFromStepRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES
    },
    schema: {
        params: CreateMCPServerFromStepParams,
    },
}
