import { AiProviderKeyStatus, AIProviderName } from '@activepieces/core-utils'
import { AIProviderModel, CreateAIProviderRequest, PrincipalType, spreadIfDefined, UpdateAIProviderRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { assertCreditsAndAppSumoNotExceeded } from '../platform/billing-provider'
import { aiProviderService } from './ai-provider-service'

export const aiProviderController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListAIProvidersForProject, async (request) => {
        return aiProviderService(app.log).listForProject({
            platformId: request.principal.platform.id,
            projectId: request.projectId,
        })
    })
    app.get('/configs', ListAIProviderConfigs, async (request) => {
        return aiProviderService(app.log).listConfigs(request.principal.platform.id)
    })
    app.get('/configs/:id/models', ListModelsForConfig, async (request) => {
        return aiProviderService(app.log).listModelsForConfig({
            platformId: request.principal.platform.id,
            configId: request.params.id,
        })
    })
    app.get('/:provider/config', GetAIProviderConfig, async (request) => {
        const platformId = request.principal.platform.id
        const provider = request.params.provider
        if (provider === AIProviderName.ACTIVEPIECES) {
            await assertCreditsAndAppSumoNotExceeded({ platformId, log: app.log })
        }
        return aiProviderService(app.log).getConfigOrThrow({
            platformId,
            provider,
            scope: { type: 'project', projectId: request.principal.projectId },
            ...spreadIfDefined('configId', request.query.configId),
        })
    })
    app.get('/:provider/models', ListModels, async (request) => {
        return aiProviderService(app.log).listModels({
            platformId: request.principal.platform.id,
            provider: request.params.provider,
            scope: { type: 'project', projectId: request.projectId },
            ...spreadIfDefined('configId', request.query.configId),
        })
    })
    app.post('/', CreateAIProvider, async (request) => {
        const platformId = request.principal.platform.id
        return aiProviderService(app.log).create(platformId, request.body)
    })
    app.post('/:id/recheck', RecheckAIProvider, async (request) => {
        const status = await aiProviderService(app.log).recheck({
            platformId: request.principal.platform.id,
            providerId: request.params.id,
        })
        return { status }
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

const ListAIProvidersForProject = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], undefined, { type: ProjectResourceType.QUERY }),
    },
    schema: {
        querystring: z.object({
            projectId: z.string().optional(),
        }),
    },
}

const ListAIProviderConfigs = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const ListModelsForConfig = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.OK]: z.array(AIProviderModel),
        },
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
        querystring: z.object({
            configId: z.string().optional(),
        }),
    },
}

const ListModels = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], undefined, { type: ProjectResourceType.QUERY }),
    },
    schema: {
        params: z.object({
            provider: z.nativeEnum(AIProviderName),
        }),
        querystring: z.object({
            projectId: z.string().optional(),
            configId: z.string().optional(),
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

const RecheckAIProvider = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.OK]: z.object({
                status: AiProviderKeyStatus,
            }),
        },
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
