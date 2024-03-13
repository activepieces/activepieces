import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import {
    ApId,
    EndpointScope,
    PrincipalType,
    SeekPage,
    UserResponse,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { enterpriseUserService } from './enterprise-user-service'
import { StatusCodes } from 'http-status-codes'
import { UpdateUserRequestBody } from '@activepieces/ee-shared'

export const enterpriseUserController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListUsersRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return enterpriseUserService.list({
            platformId,
        })
    })

    app.post('/:id', UpdateUserRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return enterpriseUserService.update({
            id: req.params.id,
            platformId,
            status: req.body.status,
        })
    })

    app.delete('/:id', DeleteUserRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        await enterpriseUserService.delete({
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

const UpdateUserRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateUserRequestBody,
        response: {
            [StatusCodes.OK]: UserResponse,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
}

const DeleteUserRequest = {
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
