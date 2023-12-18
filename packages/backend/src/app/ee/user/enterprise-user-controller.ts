import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId, EndpointScope, PrincipalType, SeekPage, UserResponse, assertNotNullOrUndefined } from '@activepieces/shared'
import { enterpriseUserService } from './enterprise-user-service'
import { StatusCodes } from 'http-status-codes'

export const enterpriseUserController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListUsersRequest, async (req) => {
        const platformId = req.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return enterpriseUserService.list({
            platformId,
        })
    })

    app.post('/:id/suspend', SuspendUserRequest, async (req, res) => {
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
        response: {
            [StatusCodes.OK]: SeekPage(UserResponse),
        },
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
