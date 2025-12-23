import { securityAccess } from '@activepieces/server-shared'
import { AIProviderModel, AIProviderName, CreateAIProviderRequest, PrincipalType, UpdateAIProviderRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { aiProviderService } from './ai-provider-service'

export const aiProviderController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAIProviders, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).listProviders(platformId)
    })
    app.get('/:provider/config', GetAIProviderConfig, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).getConfigOrThrow({ platformId, provider: request.params.provider })
    })
    app.get('/:provider/models', ListModels, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).listModels(platformId, request.params.provider)
    })
    app.post('/', CreateAIProvider, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).create(platformId, request.body)
    })
    app.post('/:id', UpdateAIProvider, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).update(platformId, request.params.id, request.body)
    })
    app.delete('/:id', DeleteAIProvider, async (request, reply) => {
        const platformId = request.principal.platform.id
        await aiProviderService(app.log).delete(platformId, request.params.id)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const ListAIProviders = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.ENGINE]),
    },
}

const GetAIProviderConfig = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: Type.Object({
            provider: Type.Enum(AIProviderName),
        }),
    },
}

const ListModels = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: Type.Object({
            provider: Type.Enum(AIProviderName),
        }),
        response: {
            [StatusCodes.OK]: Type.Array(AIProviderModel),
        },
    },
}

const CreateAIProvider = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: CreateAIProviderRequest,
    },
}

const UpdateAIProvider = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateAIProviderRequest,
    },
}

const DeleteAIProvider = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}
