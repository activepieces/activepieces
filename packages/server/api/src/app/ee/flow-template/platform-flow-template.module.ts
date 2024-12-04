import { CreateFlowTemplateRequest } from '@activepieces/ee-shared'
import { AppSystemProp, system } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    EndpointScope,
    ErrorCode,
    ListFlowTemplatesRequest,
    Principal,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    TemplateType,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { flowTemplateService } from './flow-template.service'

export const platformFlowTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
}

const GetIdParams = Type.Object({
    id: Type.String(),
})
type GetIdParams = Static<typeof GetIdParams>

const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/:id', GetParams, async (request) => {
        return flowTemplateService.getOrThrow(request.params.id)
    })

    fastify.get('/', ListFlowParams, async (request) => {
        const platformId = await resolveTemplatesPlatformId(request.principal, request.principal.platform.id)
        return flowTemplateService.list(platformId, request.query)
    })

    fastify.post('/', CreateParams, async (request, reply) => {
        const { type } = request.body
        if (type === TemplateType.PLATFORM) {
            await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
        }
        return flowTemplateService.upsert(
            request.principal.platform.id,
            request.principal.projectId,
            request.body,
        )
    })

    fastify.delete('/:id', DeleteParams, async (request, reply) => {
        const template = await flowTemplateService.getOrThrow(request.params.id)
        switch (template.type) {
            case TemplateType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
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
async function resolveTemplatesPlatformId(principal: Principal, platformId: string): Promise<string> {
    if (principal.type === PrincipalType.UNKNOWN) {
        return system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
    }
    const platform = await platformService.getOneOrThrow(platformId)
    return platform.id

}

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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        description: 'Create a flow template',
        tags: ['flow-templates'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateFlowTemplateRequest,
    },
}