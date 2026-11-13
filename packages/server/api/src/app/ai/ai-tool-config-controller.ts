import { AiToolConfigWithoutSensitiveData, CreateAiToolConfigRequest, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateAiToolConfigRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { aiToolConfigService } from './ai-tool-config-service'

export const aiToolConfigController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListAiToolConfigs, async (request) => {
        const platformId = request.principal.platform.id
        return aiToolConfigService(app.log).list(platformId)
    })
    app.post('/', UpsertAiToolConfig, async (request) => {
        const platformId = request.principal.platform.id
        return aiToolConfigService(app.log).upsert(platformId, request.body)
    })
    app.post('/:id', UpdateAiToolConfig, async (request) => {
        const platformId = request.principal.platform.id
        return aiToolConfigService(app.log).update(platformId, request.params.id, request.body)
    })
    app.delete('/:id', DeleteAiToolConfig, async (request, reply) => {
        const platformId = request.principal.platform.id
        await aiToolConfigService(app.log).delete(platformId, request.params.id)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const ListAiToolConfigs = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['ai-capabilities'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'List the configured AI capabilities (web search, web scraping, image generation, embeddings). Secrets are never returned.',
        response: {
            [StatusCodes.OK]: z.array(AiToolConfigWithoutSensitiveData),
        },
    },
}

const UpsertAiToolConfig = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['ai-capabilities'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Set up an AI capability with a service API key or one of your AI provider keys.',
        body: CreateAiToolConfigRequest,
    },
}

const UpdateAiToolConfig = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['ai-capabilities'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Update an AI capability, for example to turn it back on with its saved key.',
        params: z.object({
            id: z.string(),
        }),
        body: UpdateAiToolConfigRequest,
    },
}

const DeleteAiToolConfig = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['ai-capabilities'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Reset an AI capability so it falls back to the default AI provider.',
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}
