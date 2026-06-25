import { AiToolConfigWithoutSensitiveData, CreateAiToolConfigRequest, PrincipalType, UpdateAiToolConfigRequest } from '@activepieces/shared'
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
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: z.array(AiToolConfigWithoutSensitiveData),
        },
    },
}

const UpsertAiToolConfig = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: CreateAiToolConfigRequest,
    },
}

const UpdateAiToolConfig = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
        body: UpdateAiToolConfigRequest,
    },
}

const DeleteAiToolConfig = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}
