import { Agent,  CreateAgentRequest,  ListAgentsQueryParams,  PrincipalType, SeekPage, UpdateAgentRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { agentsService } from './agents-service'

const DEFAULT_LIMIT = 100

export const agentController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAgentsRequest, async (request) => {
        const { limit, cursor } = request.query
        return agentsService(request.log).list({
            projectId: request.principal.projectId,
            limit: limit ?? DEFAULT_LIMIT,
            cursorRequest: cursor ?? null,
        })
    })

    app.get('/:id', GetAgentRequest, async (request) => {
        const { id } = request.params
        return agentsService(request.log).getOneOrThrow({
            id,
            projectId: request.principal.projectId,
        })
    })

    app.post('/', CreateAgentRequestParams, async (request) => {
        const { displayName, description } = request.body
        return agentsService(request.log).create({
            displayName,
            description,
            projectId: request.principal.projectId,
            platformId: request.principal.platform.id,
        })
    })

    app.post('/:id', UpdateAgentRequestParams, async (request) => {
        const { id } = request.params
        const { displayName, systemPrompt, description, testPrompt, outputType, outputFields } = request.body
        return agentsService(request.log).update({
            id,
            displayName,
            systemPrompt,
            description,
            testPrompt,
            outputType,
            outputFields,
            projectId: request.principal.projectId,
        })
    })

 
    app.delete('/:id', DeleteAgentRequest, async (request) => {
        const { id } = request.params
        await agentsService(request.log).delete({
            id, 
            projectId: request.principal.projectId,
        })
        return { success: true }
    })
}


const ListAgentsRequest = {
    schema: {
        querystring: ListAgentsQueryParams,
        response: {
            [StatusCodes.OK]: SeekPage(Agent),
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
}

const CreateAgentRequestParams = {
    schema: {
        body: CreateAgentRequest,
        response: {
            [StatusCodes.CREATED]: Agent,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const GetAgentRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Agent,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
    },
}

const UpdateAgentRequestParams = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateAgentRequest,
        response: {
            [StatusCodes.OK]: Agent,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const DeleteAgentRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
