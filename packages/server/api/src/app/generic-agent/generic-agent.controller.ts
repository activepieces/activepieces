import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { ExecuteAgentRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { genericAgentService } from './generic-agent.service'
import { Type } from '@sinclair/typebox'

export const genericAgentController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/execute', ExecuteAgentRequestSchema, async (request, reply) => {
        const requestId = await genericAgentService(request.log).executeAgent({
          ...request.body,
          projectId: request.projectId,
          platformId: request.principal.platform.id,
        })
        return genericAgentService(request.log).streamAgentResponse({
          reply,
          requestId,
        })
    })
}

const ExecuteAgentRequestSchema = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], undefined, { type: ProjectResourceType.BODY }),
    },
    schema: {
        tags: ['agents'],
        summary: 'Execute an agent with tools and prompt',
        body: ExecuteAgentRequest,
        response: {
            [StatusCodes.NO_CONTENT]: Type.Void(),
        },
    },
}
