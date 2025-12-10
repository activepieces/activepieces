import { AIProviderConfig, AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData, CreateAIProviderRequest, PrincipalType } from '@activepieces/shared'
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
      
        if (request.principal.type === PrincipalType.USER) {
            if (config.apiKey) {
                const apiKey = config.apiKey
                if (apiKey.length > 5) {
                    const firstTwo = apiKey.substring(0, 2)
                    const lastThree = apiKey.substring(apiKey.length - 3)
                    const stars = '*'.repeat(apiKey.length - 5)
                    config.apiKey = `${firstTwo}${stars}${lastThree}`
                } else {
                    // If the key is 5 characters or less, redact it completely for security,
                    // as the "first 2 and last 3" rule doesn't apply cleanly.
                    config.apiKey = '*'.repeat(apiKey.length)
                }
            }

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
            id: Type.Enum(AIProviderName),
        }),
    },
}

const ListModels = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.Enum(AIProviderName),
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

const DeleteAIProvider = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        params: Type.Object({
            id: Type.Enum(AIProviderName),
        }),
    },
}
