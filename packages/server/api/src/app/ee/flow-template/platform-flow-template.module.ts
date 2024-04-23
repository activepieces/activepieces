import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { flowTemplateService } from './flow-template.service'
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared'
import { system, SystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ErrorCode,
    ListFlowTemplatesRequest,
    PrincipalType,
    TemplateType,
} from '@activepieces/shared'

export const platformFlowTemplateModule: FastifyPluginAsyncTypebox = async (
    app,
) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
}

const GetIdParams = Type.Object({
    id: Type.String(),
})
type GetIdParams = Static<typeof GetIdParams>

const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/:id',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                params: GetIdParams,
            },
        },
        async (request) => {
            return flowTemplateService.getOrThrow(request.params.id)
        },
    )

    fastify.get(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: ListFlowTemplatesRequest,
            },
        },
        async (request) => {
            const platformId =
                request.principal.type === PrincipalType.UNKNOWN ? system.getOrThrow(SystemProp.CLOUD_PLATFORM_ID) : request.principal.platform.id
            return flowTemplateService.list(platformId, request.query)
        },
    )

    fastify.post(
        '/',
        {
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
            schema: {
                body: CreateFlowTemplateRequest,
            },
        },
        async (request, reply) => {
            const { type } = request.body
            if (type === TemplateType.PLATFORM) {
                await platformMustBeOwnedByCurrentUser.call(fastify, request, reply)
            }
            return flowTemplateService.upsert(
                request.principal.platform.id,
                request.principal.projectId,
                request.body,
            )
        },
    )
    fastify.delete(
        '/:id',
        {
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
            schema: {
                params: GetIdParams,
            },
        },
        async (request, reply) => {
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
        },
    )
}

