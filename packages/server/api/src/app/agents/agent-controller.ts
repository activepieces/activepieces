import { GitPushOperationType } from '@activepieces/ee-shared'
import { Agent,  CreateAgentRequest, EnhanceAgentPrompt, EnhancedAgentPrompt,  ListAgentsQueryParams,  PrincipalType, SeekPage, UpdateAgentRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { gitRepoService } from '../ee/projects/project-release/git-sync/git-sync.service'
import { agentsService } from './agents-service'

const DEFAULT_LIMIT = 100

export const agentController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAgentsRequest, async (request) => {
        const { limit, cursor } = request.query
        return agentsService(request.log).list({
            projectId: request.principal.projectId,
            limit: limit ?? DEFAULT_LIMIT,
            cursorRequest: cursor ?? null,
            externalIds: request.query.externalIds,
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
        return agentsService(request.log).create({
            systemPrompt: request.body.systemPrompt,
            displayName: request.body.displayName,
            description: request.body.description,
            projectId: request.principal.projectId,
            platformId: request.principal.platform.id,
            enhancePrompt: true,
        })
    })

    app.post('/enhance-prompt', EnhanceAgentPromptRequestParams, async (request) => {
        return agentsService(request.log).enhanceAgentPrompt({ 
            projectId: request.principal.projectId,
            systemPrompt: request.body.systemPrompt,
            platformId: request.principal.platform.id,
            agentId: request.body.agentId,
        })
    })

    app.post('/:id', UpdateAgentRequest, async (request) => {
        const { id } = request.params
        const { displayName, systemPrompt, description, outputType, outputFields } = request.body
        return agentsService(request.log).update({
            id,
            displayName,
            systemPrompt,
            description,
            outputType,
            outputFields,
            projectId: request.principal.projectId,
        })
    })

    app.delete('/:id', DeleteAgentRequest, async (request) => {
        const agent = await agentsService(request.log).getOneOrThrow({
            id: request.params.id,
            projectId: request.principal.projectId,
        })
        await gitRepoService(request.log).onDeleted({
            type: GitPushOperationType.DELETE_AGENT,
            externalId: agent.externalId,
            userId: request.principal.id,
            projectId: request.principal.projectId,
            platformId: request.principal.platform.id,
            log: request.log,
        })
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

const EnhanceAgentPromptRequestParams = {
    schema: {
        body: EnhanceAgentPrompt,
        response: {
            [StatusCodes.OK]: EnhancedAgentPrompt,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.WORKER],
    },
}

const UpdateAgentRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateAgentRequestBody,
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
