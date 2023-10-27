import { CreateDomainRequest, ListCustomDomainsRequest, PlatformId } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox'
import { customDomainService } from './custom-domain.service'
import { HttpStatusCode } from 'axios'
import { ActivepiecesError, ErrorCode, UserId, assertNotNullOrUndefined } from '@activepieces/shared'
import { platformService } from '../platform/platform.service'


const GetOneRequest = Type.Object({
    id: Type.String(),
})
type GetOneRequest = Static<typeof GetOneRequest>

export const customDomainModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(customDomainController, { prefix: '/v1/custom-domains' })
}

const customDomainController: FastifyPluginAsyncTypebox = async (app) => {

    app.post(
        '/',
        {
            schema: {
                body: CreateDomainRequest,
            },
        },
        async (
            request,
            reply,
        ) => {
            const platformId = await assertUserIsPlatformOwner({
                platformId: request.principal.platformId,
                userId: request.principal.id,
            })

            const domain = await customDomainService.getOneByDomain({
                domain: request.body.domain,
            })

            if (domain) {
                return reply
                    .status(HttpStatusCode.Conflict)
                    .send({
                        message: `Domain ${request.body.domain} already exists`,
                    })
            }

            return customDomainService.create({
                domain: request.body.domain,
                platformId,
            })
        },
    )

    app.post(
        '/:id/verify',
        {
            schema: {
                params: GetOneRequest,
            },
        },
        async (
            request,
        ) => {
            const platformId = await assertUserIsPlatformOwner({
                platformId: request.principal.platformId,
                userId: request.principal.id,
            })

            return customDomainService.check({
                id: request.params.id,
                platformId,
            })
        },
    )

    app.get('/', {
        schema: {
            querystring: ListCustomDomainsRequest,
        },
    }, async (request) => {
        const platformId = await assertUserIsPlatformOwner({
            platformId: request.principal.platformId,
            userId: request.principal.id,
        })

        return customDomainService.list({
            platformId,
            request: request.query,
        })
    })

    app.delete(
        '/:id',
        {
            schema: {
                params: GetOneRequest,
            },
        },
        async (
            request,
        ) => {
            const platformId = await assertUserIsPlatformOwner({
                platformId: request.principal.platformId,
                userId: request.principal.id,
            })

            return customDomainService.delete({
                id: request.params.id,
                platformId,
            })
        },
    )
}

const assertUserIsPlatformOwner = async ({ platformId, userId }: AssertUserIsPlatformOwnerParams): Promise<string> => {
    assertNotNullOrUndefined(platformId, 'platformId')

    const userIsOwner = await platformService.checkUserIsOwner({
        platformId,
        userId,
    })

    if (!userIsOwner) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }

    return platformId
}

type AssertUserIsPlatformOwnerParams = {
    platformId?: PlatformId
    userId: UserId
}
