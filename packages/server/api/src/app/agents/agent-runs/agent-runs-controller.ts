import { AgentRun, ListAgentRunsQueryParams, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
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
}

const ListAgentRunsRequest = {
    schema: {
        querystring: ListAgentRunsQueryParams,
        response: {
            [StatusCodes.OK]: SeekPage(AgentRun),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
}

const GetAgentRunRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: AgentRun,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
}
