import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, GetCurrentUserRequestQuery, PrincipalType, UserWithMetaInformationAndProject } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { userService } from '../../user/user-service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/me', GetCurrentUserRequest, async (req): Promise<UserWithMetaInformationAndProject> => {
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
            trackEvents: identity.trackEvents,
            newsLetter: identity.newsLetter,
            verified: identity.verified,
            projectId: req.projectId,
            lastActiveDate: user.lastActiveDate,
        }
    })

    app.get("/:userId", GetUserByIdRequest, async (req): Promise<UserWithMetaInformationAndProject> => {
        const userId = req.params.userId
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
            trackEvents: identity.trackEvents,
            newsLetter: identity.newsLetter,
            verified: identity.verified,
            projectId: req.principal.projectId,
            lastActiveDate: user.lastActiveDate,
        }
    })
}

const GetUserByIdRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: UserWithMetaInformationAndProject,
        },
        params: Type.Object({
            userId: Type.String(),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
}

const GetCurrentUserRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: UserWithMetaInformationAndProject,
        },
        querystring: GetCurrentUserRequestQuery,
    },
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.QUERY,
        }),
    },
}