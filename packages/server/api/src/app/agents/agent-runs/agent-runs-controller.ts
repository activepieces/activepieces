import { AgentRun, CreateAgentRunRequestBody, ListAgentRunsQueryParams, PrincipalType, SeekPage } from '@activepieces/shared'
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

    app.post('/', CreateAgentRunRequest, async (request) => {
        return agentRunsService(request.log).create(request.body)
    })

    app.post('/:id/update', UpdateAgentRunRequest, async (request) => {
        const { id } = request.params
        const { projectId } = request.query
        return agentRunsService(request.log).update({
            id,
            projectId,
            agentRun: request.body,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.WORKER],
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.WORKER],
    },
}

const CreateAgentRunRequest = {
    schema: {
        body: CreateAgentRunRequestBody,
        response: {
            [StatusCodes.OK]: AgentRun,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
}

const UpdateAgentRunRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        querystring: Type.Object({
            projectId: Type.String(),
        }),
        body: AgentRun,
    },
    response: {
        [StatusCodes.OK]: AgentRun,
    },
    config: {
        allowedPrincipals: [PrincipalType.WORKER],
    },
}
