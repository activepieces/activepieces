import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId, EndpointScope, PrincipalType, assertEqual, assertNotNullOrUndefined } from '@activepieces/shared'
import { enterpriseUserService } from './enterprise-user-service'
import { StatusCodes } from 'http-status-codes'

export const enterpriseUserController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListUsersRequest, async (req) => {
        const principalPlatformId = req.principal.platform?.id
        const requestPlatformId = req.query.platformId
        assertEqual(principalPlatformId, requestPlatformId, 'principalPlatformId', requestPlatformId)

        return enterpriseUserService.list({
            platformId: req.query.platformId,
        })
    })

    app.patch('/:id/suspend', SuspendUserRequest, async (req, res) => {
        const platformId = req.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')

        await enterpriseUserService.suspend({
            id: req.params.id,
            platformId,
        })

        return res.status(StatusCodes.NO_CONTENT).send()
    })
}

const ListUsersRequest = {
    schema: {
        querystring: Type.Object({
            platformId: ApId,
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

const SuspendUserRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}
