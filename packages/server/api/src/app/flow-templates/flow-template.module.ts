import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    CreateFlowTemplateRequest,
    ErrorCode,
    isNil,
    ListFlowTemplatesRequest,
    PlatformRole,
    PrincipalType,
    TemplateType,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { flowTemplateService } from './flow-template.service'

const GetIdParams = Type.Object({
    id: Type.String(),
})

type GetIdParams = Static<typeof GetIdParams>

const GetFlowParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['flow-templates'],
        description: 'Get a flow template',
        params: GetIdParams,
    },
}

const ListFlowParams = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['flow-templates'],
        description: 'List flow templates',
        querystring: ListFlowTemplatesRequest,
    },
}

const CreateParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        description: 'Create a flow template',
        tags: ['flow-templates'],
        body: CreateFlowTemplateRequest,
    },
}

const DeleteParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        description: 'Delete a flow template',
        tags: ['flow-templates'],
        params: GetIdParams,
    },
}

export const flowTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
}

const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/:id', GetFlowParams, async (request) => {
        return flowTemplateService.getOrThrow(request.params.id)
    })

    fastify.get('/', ListFlowParams, async (request) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        return flowTemplateService.list(platform.id, request.query)
    })

    fastify.post('/', CreateParams, async (request) => {
        const { type } = request.body
        const platformId = request.principal.platform.id
        if (type === TemplateType.PLATFORM) {
            await checkUserPlatformAdminOrThrow(request.principal.id, platformId)
        }
        return flowTemplateService.upsert(
            request.principal.platform.id,
            request.principal.projectId,
            request.body,
        )
    })

    fastify.delete('/:id', DeleteParams, async (request, reply) => {
        const platformId = request.principal.platform.id
        const template = await flowTemplateService.getOrThrow(request.params.id)
        switch (template.type) {
            case TemplateType.PLATFORM:
                await checkUserPlatformAdminOrThrow(request.principal.id, platformId)
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

const checkUserPlatformAdminOrThrow = async (userId: string, platformId: string): Promise<void> => {
    const user = await userService.getOneOrFail({ id: userId })
    if (isNil(user)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
    if (user.platformRole !== PlatformRole.ADMIN || user.platformId !== platformId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}
