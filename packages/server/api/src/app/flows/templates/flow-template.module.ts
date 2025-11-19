import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    CreateFlowTemplateRequest,
    EndpointScope,
    ErrorCode,
    isNil,
    ListFlowTemplatesRequest,
    PlatformRole,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    TemplateType,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { flowTemplateService } from './flow-template.service'
import { communityTemplates } from './community-flow-template.module'
import { AppSystemProp } from '@activepieces/server-shared'
import { system } from '../../helper/system/system'

export const flowTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
}

const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/:id', GetParams, async (request) => {
        return flowTemplateService.getOrThrow(request.params.id)
    })

    fastify.get('/', ListFlowParams, async (request) => {
        const platformId = await resolveTemplatesPlatformId(request.principal)
        if (isNil(platformId)) {
            return communityTemplates.get(request.query)
        }
        return flowTemplateService.list(platformId, request.query)
    })

    fastify.post('/', CreateParams, async (request, reply) => {
        const { type } = request.body
        const platformId = request.principal.platform.id
        // if (type === TemplateType.PLATFORM) {
        //     await checkUserPlatformAdminOrThrow(request.principal.id, platformId)
        // }
        const result = await flowTemplateService.upsert(
            request.principal.platform.id,
            request.principal.projectId,
            request.body,
        )
        return reply.status(StatusCodes.CREATED).send(result)
    })

    fastify.delete('/:id', DeleteParams, async (request, reply) => {
        const platformId = request.principal.platform.id
        const template = await flowTemplateService.getOrThrow(request.params.id)
        switch (template.type) {
            case TemplateType.PLATFORM:
                // await checkUserPlatformAdminOrThrow(request.principal.id, platformId)
                break
            case TemplateType.PROJECT:
                if (template.projectId !== request.principal.projectId) {
                    throw new ActivepiecesError({
                        code: ErrorCode.AUTHORIZATION,
                        params: {},
                    })
                }
                break
        }
        await flowTemplateService.delete({
            id: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function resolveTemplatesPlatformId(principal: Principal): Promise<string | null> {
    if (principal.type === PrincipalType.UNKNOWN || principal.type === PrincipalType.WORKER) {
        return system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
    }
    const platform = await platformService.getOneWithPlanOrThrow(principal.platform.id)
    // if (!platform.plan.manageTemplatesEnabled) {
    //     if (edition === ApEdition.CLOUD) {
    //         return system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
    //     }
    //     return null
    // }
    return platform.id
}

const GetIdParams = Type.Object({
    id: Type.String(),
})

type GetIdParams = Static<typeof GetIdParams>

const GetParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['flow-templates'],
        description: 'Get a flow template',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}

const ListFlowParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['flow-templates'],
        description: 'List flow templates',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFlowTemplatesRequest,
    },
}

const DeleteParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        description: 'Delete a flow template',
        tags: ['flow-templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
    },
}

const CreateParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        description: 'Create a flow template',
        tags: ['flow-templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateFlowTemplateRequest,
    },
}
