import { ListAgentRunsQueryParams, PrincipalType, RunAgentRequestBody, UpdateAgentRunRequestBody, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { agentsService } from '../agents-service'
import { agentRunsService } from './agent-runs-service'

const DEFAULT_LIMIT = 10

export const agentRunsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAgentRunsRequest, async (request) => {
        const { limit, cursor } = request.query
        return agentRunsService(request.log).list({
            projectId: request.principal.projectId,
            agentId: request.query.agentId,
            limit: limit ?? DEFAULT_LIMIT,
            cursorRequest: cursor ?? null,
        })
    })

    app.get('/:id', GetAgentRunRequest, async (request) => {
        const { id } = request.params
        return agentRunsService(request.log).getOneOrThrow({
            id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/', RunAgentRequest, async (request) => {
        const agent = await agentsService(request.log).getOneByExternalIdOrThrow({ externalId: request.body.externalId, projectId: request.principal.projectId })
        return agentRunsService(request.log).run({
            agentId: agent.id,
            projectId: request.principal.projectId,
            prompt: request.body.prompt,
        })
    })

    app.post('/:id/update', UpdateAgentRunRequest, async (request) => {
        const { id } = request.params
        const agentRun = await agentRunsService(request.log).update({
            id,
            projectId: request.body.projectId,
            agentRun: request.body,
        })
        app.io.to(agentRun.projectId).emit(WebsocketClientEvent.AGENT_RUN_PROGRESS, agentRun)
        return agentRun
    })
}

const ListAgentRunsRequest = {
    schema: {
        querystring: ListAgentRunsQueryParams,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const GetAgentRunRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
}

const RunAgentRequest = {
    schema: {
        body: RunAgentRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
}

const UpdateAgentRunRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateAgentRunRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
}
