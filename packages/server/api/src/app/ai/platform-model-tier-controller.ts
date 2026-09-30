import { ActivepiecesError, ApId, ErrorCode } from '@activepieces/core-utils'
import { CreatePlatformModelTierRequest, DeletePlatformModelTierRequest, PlatformModelTier, PlatformModelTierSummary, PrincipalType, ReorderPlatformModelTiersRequest, UpdatePlatformModelTierRequest, UpdatePlatformModelTierSettingsRequest } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformService } from '../platform/platform.service'
import { platformModelTierService } from './platform-model-tier-service'

export const platformModelTierController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListPlatformModelTiers, async (request) => {
        return platformModelTierService.listSummaries({ platformId: request.principal.platform.id })
    })
    app.get('/admin', ListPlatformModelTiersForAdmin, async (request) => {
        return platformModelTierService.list({ platformId: request.principal.platform.id })
    })
    app.post('/', CreatePlatformModelTier, async (request) => {
        return platformModelTierService.create({ platformId: request.principal.platform.id, request: request.body })
    })
    app.post('/reorder', ReorderPlatformModelTiers, async (request) => {
        return platformModelTierService.reorder({ platformId: request.principal.platform.id, tierIds: request.body.tierIds })
    })
    app.post('/settings', UpdatePlatformModelTierSettings, async (request, reply) => {
        await platformModelTierService.updateSettings({ platformId: request.principal.platform.id, aiSpecificModelsVisible: request.body.aiSpecificModelsVisible })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
    app.post('/:id', UpdatePlatformModelTier, async (request) => {
        return platformModelTierService.update({ platformId: request.principal.platform.id, id: request.params.id, request: request.body })
    })
    app.delete('/:id', DeletePlatformModelTier, async (request, reply) => {
        await platformModelTierService.delete({ platformId: request.principal.platform.id, id: request.params.id, replacedBy: request.query.replacedBy })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function requireAiProvidersPlan(request: FastifyRequest): Promise<void> {
    const platform = await platformService(request.log).getOneWithPlanOrThrow(request.principal.platform.id)
    if (!platform.plan.aiProvidersEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: { message: 'AI providers are not included in your plan' },
        })
    }
}

const TierIdParams = z.object({
    id: ApId,
})

const ListPlatformModelTiers = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.ENGINE], undefined, { type: ProjectResourceType.QUERY }),
    },
    schema: {
        querystring: z.object({
            projectId: z.string().optional(),
        }),
        response: {
            [StatusCodes.OK]: z.array(PlatformModelTierSummary),
        },
    },
}

const ListPlatformModelTiersForAdmin = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: z.array(PlatformModelTier),
        },
    },
}

const CreatePlatformModelTier = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: requireAiProvidersPlan,
    schema: {
        body: CreatePlatformModelTierRequest,
        response: {
            [StatusCodes.OK]: PlatformModelTier,
        },
    },
}

const ReorderPlatformModelTiers = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: requireAiProvidersPlan,
    schema: {
        body: ReorderPlatformModelTiersRequest,
        response: {
            [StatusCodes.OK]: z.array(PlatformModelTier),
        },
    },
}

const UpdatePlatformModelTierSettings = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: requireAiProvidersPlan,
    schema: {
        body: UpdatePlatformModelTierSettingsRequest,
    },
}

const UpdatePlatformModelTier = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: requireAiProvidersPlan,
    schema: {
        params: TierIdParams,
        body: UpdatePlatformModelTierRequest,
        response: {
            [StatusCodes.OK]: PlatformModelTier,
        },
    },
}

const DeletePlatformModelTier = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: requireAiProvidersPlan,
    schema: {
        params: TierIdParams,
        querystring: DeletePlatformModelTierRequest,
    },
}
