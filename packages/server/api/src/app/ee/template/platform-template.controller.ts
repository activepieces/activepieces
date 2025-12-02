import { FlowTemplateScope } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    CreateTemplateRequestBody,
    EndpointScope,
    ErrorCode,
    isNil,
    ListFlowTemplatesRequestQuery,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateTemplateRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { migrateFlowVersionTemplate } from '../../flows/flow-version/migrations'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { communityTemplates } from '../../template/community-flow-template.module'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { platformTemplateService } from './platform-template.service'

const edition = system.getEdition()

export const platformTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/:id', GetParams, async (request) => {
        return platformTemplateService().getOnePopulatedOrThrow({ id: request.params.id })
    })

    fastify.get('/', ListFlowParams, async (request) => {
        const platformId = await resolveTemplatesPlatformId(request.principal)
        if (isNil(platformId)) {
            return communityTemplates.get(request.query)
        }
        return platformTemplateService().list({ platformId, requestQuery: request.query })
    })

    fastify.post('/', {
        ...CreateParams,
        preValidation: async (request) => {
            const migratedFlowTemplate = await migrateFlowVersionTemplate(request.body.template.trigger, request.body.template.schemaVersion)
            request.body.template = {
                ...request.body.template,
                trigger: migratedFlowTemplate.trigger,
                schemaVersion: migratedFlowTemplate.schemaVersion,
            }
        },
    }, async (request, reply) => {
        const { scope } = request.body
        if (scope === FlowTemplateScope.PLATFORM) {
            await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
        }
        const result = await platformTemplateService().create({ platformId: request.principal.platform.id, projectId: request.principal.projectId, params: request.body })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    fastify.post('/:id', UpdateParams, async (request, reply) => {
        const result = await platformTemplateService().update({ id: request.params.id, params: request.body })
        return reply.status(StatusCodes.OK).send(result)
    })

    fastify.delete('/:id', DeleteParams, async (request, reply) => {
        const template = await platformTemplateService().getOnePopulatedOrThrow({ id: request.params.id })

        if (!isNil(template.flowTemplate)) {
            switch (template.flowTemplate.scope) {
                case FlowTemplateScope.PLATFORM:
                    await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
                    break
                case FlowTemplateScope.PROJECT:
                    if (template.flowTemplate.projectId !== request.principal.projectId) {
                        throw new ActivepiecesError({
                            code: ErrorCode.AUTHORIZATION,
                            params: {},
                        })
                    }
                    break
            }
        }
        await platformTemplateService().delete({
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
    if (!platform.plan.manageTemplatesEnabled) {
        if (edition === ApEdition.CLOUD) {
            return system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        }
        return null
    }
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
        description: 'Get a flow template. This endpoint will be deprecated on 1/1/2026.',
        deprecated: true,
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
        description: 'List flow templates. This endpoint will be deprecated on 1/1/2026.',
        deprecated: true,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFlowTemplatesRequestQuery,
    },
}

const DeleteParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        description: 'Delete a flow template. This endpoint will be deprecated on 1/1/2026.',
        deprecated: true,
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
        description: 'Create a flow template. This endpoint will be deprecated on 1/1/2026.',
        deprecated: true,
        tags: ['flow-templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateTemplateRequestBody,
    },
}

const UpdateParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        description: 'Update a flow template. This endpoint will be deprecated on 1/1/2026.',
        deprecated: true,
        tags: ['flow-templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: GetIdParams,
        body: UpdateTemplateRequestBody,
    },
}