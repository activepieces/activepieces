import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { flowTemplateService } from './flow-template.service'
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared'
import { system, SystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ErrorCode,
    isNil,
    ListFlowTemplatesRequest,
    Principal,
    PrincipalType,
    TemplateType,
} from '@activepieces/shared'

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
        return system.getOrThrow(SystemProp.CLOUD_PLATFORM_ID)
    }
    const platform = await platformService.getOne(platformId)
    if (!isNil(platform) && platform.manageTemplatesEnabled) {
        return platform.id
    }
    return system.getOrThrow(SystemProp.CLOUD_PLATFORM_ID)
}

const GetParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: GetIdParams,
    },
}

const ListFlowParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: ListFlowTemplatesRequest,
    },
}

const DeleteParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: GetIdParams,
    },
}

const CreateParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: CreateFlowTemplateRequest,
    },
}