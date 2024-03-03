import { flowTemplateService } from './flow-template.service'
import {
    ListFlowTemplatesRequest,
    ALL_PRINCIPAL_TYPES,
    PrincipalType,
    TemplateType,
    ActivepiecesError,
    ErrorCode,
    assertNotNullOrUndefined,
    Principal,
} from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared'
import { platformService } from '../../platform/platform.service'
import { StatusCodes } from 'http-status-codes'
import { SystemProp, system } from 'server-shared'

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
        async (request) => {
            const { type } = request.body
            if (type === TemplateType.PLATFORM) {
                await assertUserIsPlatformOwner({
                    platformId: request.principal.platform.id,
                    userId: request.principal.id,
                })
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
            await assertUserCanDeleteTemplate({
                templateId: request.params.id,
                userId: request.principal.id,
                principal: request.principal,
            })
            await flowTemplateService.delete({
                id: request.params.id,
            })
            return reply.status(StatusCodes.NO_CONTENT).send()
        },
    )
}

async function assertUserCanDeleteTemplate({
    templateId,
    userId,
    principal,
}: {
    templateId: string
    userId: string
    principal: Principal
}): Promise<void> {
    const template = await flowTemplateService.getOrThrow(templateId)
    switch (template.type) {
        case TemplateType.PLATFORM:
            await assertUserIsPlatformOwner({
                platformId: template.platformId,
                userId,
            })
            break
        case TemplateType.PROJECT:
            if (template.projectId !== principal.projectId) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {},
                })
            }
            break
    }
}

async function assertUserIsPlatformOwner({
    platformId,
    userId,
}: {
    platformId?: string
    userId: string
}): Promise<void> {
    assertNotNullOrUndefined(platformId, 'platformId')
    const userOwner = await platformService.checkUserIsOwner({
        platformId,
        userId,
    })
    if (!userOwner) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}
