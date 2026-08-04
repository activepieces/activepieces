import { AIProviderName } from '@activepieces/core-utils'
import { AI_ROUTING_TIER_IDS, AIProviderModel, CreateAIProviderRequest, GetAiRoutingResponse, PrincipalType, UpdateAIProviderRequest, UpsertAiRoutingRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { aiModelRoutingService } from './ai-model-routing-service'
import { aiProviderService } from './ai-provider-service'

export const aiProviderController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListAIProviders, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).listProviders(platformId)
    })
    app.get('/routing', GetAiRouting, async (request) => {
        const platformId = request.principal.platform.id
        return aiModelRoutingService(app.log).get({ platformId })
    })
    app.post('/routing', UpsertAiRouting, async (request) => {
        const platformId = request.principal.platform.id
        return aiModelRoutingService(app.log).upsert({ platformId, request: request.body })
    })
    app.get('/routing/:tier/chain', GetAiRoutingChain, async (request) => {
        const platformId = request.principal.platform.id
        return aiModelRoutingService(app.log).resolveChain({ platformId, tierId: request.params.tier })
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

const GetAiRouting = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: GetAiRoutingResponse,
        },
    },
}

const UpsertAiRouting = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: UpsertAiRoutingRequest,
        response: {
            [StatusCodes.OK]: GetAiRoutingResponse,
        },
    },
}

const GetAiRoutingChain = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: z.object({
            tier: z.enum(AI_ROUTING_TIER_IDS),
        }),
    },
}

const GetAIProviderConfig = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        params: z.object({
            provider: z.nativeEnum(AIProviderName),
        }),
    },
}

const ListModels = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.ENGINE]),
    },
    schema: {
        params: z.object({
            provider: z.nativeEnum(AIProviderName),
        }),
        response: {
            [StatusCodes.OK]: z.array(AIProviderModel),
        },
    },
}

const CreateAIProvider = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: CreateAIProviderRequest,
    },
}

const UpdateAIProvider = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
        body: UpdateAIProviderRequest,
    },
}

const DeleteAIProvider = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}
