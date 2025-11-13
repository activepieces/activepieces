import { assertNotNullOrUndefined, PrincipalType, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { userService } from '../../user/user-service'
import { AuthorizationType, RouteKind } from '@activepieces/server-shared'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/me', GetCurrentUserRequest, async (req): Promise<UserWithMetaInformation> => {
        const userId = req.principal.id
        assertNotNullOrUndefined(userId, 'userId')

        const user = await userService.getOneOrFail({ id: userId })
        const identity = await userIdentityService(app.log).getOneOrFail({ id: user.identityId })

        return {
            id: user.id,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
            platformId: user.platformId,
            firstName: identity.firstName,
            lastName: identity.lastName,
            email: identity.email,
        }
    })
}

const GetCurrentUserRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: UserWithMetaInformation,
        },
    },
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.NONE,
                reason: 'There is no need to authorize this route',
                allowedPrincipals: [PrincipalType.USER],
            },
        }
    },
}