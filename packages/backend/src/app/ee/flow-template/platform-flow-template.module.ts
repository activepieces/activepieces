import { flowTemplateService } from './flow-template.service'
import { ListFlowTemplatesRequest, ALL_PRINICPAL_TYPES, PrincipalType, TemplateType, ActivepiecesError, ErrorCode, assertNotNullOrUndefined } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared'
import { platformService } from '../platform/platform.service'
import { StatusCodes } from 'http-status-codes'

export const platformFlowTemplateModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowTemplateController, { prefix: '/v1/flow-templates' })
}

const GetIdParams = Type.Object({
    id: Type.String(),
})
type GetIdParams = Static<typeof GetIdParams>


const flowTemplateController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/:id', {
        config: {
            allowedPrincipals: ALL_PRINICPAL_TYPES,
        },
        schema: {
            params: GetIdParams,
        },
    }, async (request) => {
        return flowTemplateService.getOrThrow(request.params.id)
    })

    fastify.get('/', {
        config: {
            allowedPrincipals: ALL_PRINICPAL_TYPES,
        },
        schema: {
            querystring: ListFlowTemplatesRequest,
        },
    }, async (request) => {
        return flowTemplateService.list(request.principal.platform?.id ?? null, request.query)
    })

    fastify.post('/', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
        schema: {
            body: CreateFlowTemplateRequest,
        },
    }, async (request) => {
        const { type } = request.body
        if (type === TemplateType.PLATFORM) {
            await assertUserIsPlatformOwner({
                platformId: request.principal.platform?.id,
                userId: request.principal.id,
            })
        }
        return flowTemplateService.upsert(request.principal.platform?.id, request.principal.projectId, request.body)
    })
    fastify.delete('/:id', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
        schema: {
            params: GetIdParams,
        },
    }, async (request, reply) => {
        // TODO ADD VALIDATION ON PEMRISSIONS
        await flowTemplateService.delete({
            id: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
        
    })
}

async function assertUserIsPlatformOwner({
    platformId,
    userId,
}: { platformId?: string, userId: string }): Promise<void> {
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