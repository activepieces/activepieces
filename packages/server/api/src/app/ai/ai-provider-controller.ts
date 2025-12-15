import { AIProviderModel, AIProviderWithoutSensitiveData, CreateAIProviderRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { aiProviderService } from './ai-provider-service'

export const aiProviderController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAIProviders, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).listProviders(platformId)
    })
    app.get('/:id/config', GetAIProviderConfig, async (request) => {
        const platformId = request.principal.platform.id

        const config = await aiProviderService(app.log).getConfig(platformId, request.params.id)
        if (request.principal.type === PrincipalType.USER && config.apiKey) {
            config.apiKey = '*'.repeat(config.apiKey.length)
        }

        return config;
    })
    app.get('/:id/models', ListModels, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).listModels(platformId, request.params.id)
    })
    app.post('/', CreateAIProvider, async (request, reply) => {
        const platformId = request.principal.platform.id
        await aiProviderService(app.log).upsert(platformId, request.body)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
    app.patch('/:id', UpdateAIProvider, async (request, reply) => {
        const platformId = request.principal.platform.id
        await aiProviderService(app.log).upsert(platformId, request.body, request.params.id)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
    app.delete('/:id', DeleteAIProvider, async (request, reply) => {
        const platformId = request.principal.platform.id
        await aiProviderService(app.log).delete(platformId, request.params.id)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const ListAIProviders = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE] as const,
    },
    schema: {
        response: {
            [StatusCodes.OK]: Type.Array(AIProviderWithoutSensitiveData),
        },
    },
}

const GetAIProviderConfig = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
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
        response: {
            [StatusCodes.OK]: Type.Array(AIProviderModel),
        },
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

const UpdateAIProvider = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
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
