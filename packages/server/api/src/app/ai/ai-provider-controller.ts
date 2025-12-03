import { AIProvider, AIProviderWithoutSensitiveData, CreateAIProviderRequest } from '@activepieces/common-ai'
import { PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { aiProviderService } from './ai-provider-service-v2'

export const aiProviderController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAIProviders, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService.listProviders(platformId)
    })
    app.get('/:id/config', GetAIProviderConfig, async (request) => {
        const platformId = request.principal.platform.id
        return { config: await aiProviderService.getConfig(request.params.id, platformId) }
    })
    app.get('/:id/models', ListModels, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService.listModels(platformId, request.params.id)
    })
    app.post('/', CreateAIProvider, async (request, reply) => {
        const platformId = request.principal.platform.id
        await aiProviderService.upsert(platformId, request.body)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
    app.delete('/:id', DeleteAIProvider, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService.delete(platformId, request.params.id)
    })
}

const ListAIProviders = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE] as const,
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(AIProviderWithoutSensitiveData),
        },
    },
}

const GetAIProviderConfig = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: Type.Pick(AIProvider, ['config']),
        },
    },
}

const ListModels = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const CreateAIProvider = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        body: CreateAIProviderRequest,
    },
}

const DeleteAIProvider = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
