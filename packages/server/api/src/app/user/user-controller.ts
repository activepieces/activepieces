import { assertNotNullOrUndefined, PrincipalType, UserWithMetaInformationAndProject } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { userService } from './user-service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/me', GetCurrentUserRequest, async (req): Promise<UserWithMetaInformationAndProject> => {
        const userId = req.principal.id
        assertNotNullOrUndefined(userId, 'userId')

        const user = await userService.getMetaInformation({ id: userId })

        return {
            id: user.id,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            lastChangelogDismissed: user.lastChangelogDismissed,
            created: user.created,
            updated: user.updated,
            platformId: user.platformId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            trackEvents: false,
            newsLetter: false,
            verified: true,
            projectId: req.principal.projectId,
            identityId: user.identityId!,
            profileImageUrl: user.profileImageUrl,
        }
    })

    app.post('/me', UpdateCurrentUserRequest, async (req) => {
        const userId = req.principal.id
        assertNotNullOrUndefined(userId, 'userId')

        const user = await userService.getMetaInformation({ id: userId })

        await userIdentityService(app.log).updateProfileImage({
            id: user.identityId!,
            profileImageUrl: req.body.profileImageUrl,
        })

        return {
            id: user.id,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            lastChangelogDismissed: user.lastChangelogDismissed,
            created: user.created,
            updated: user.updated,
            platformId: user.platformId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            trackEvents: false,
            newsLetter: false,
            verified: true,
            projectId: req.principal.projectId,
            identityId: user.identityId!,
            profileImageUrl: req.body.profileImageUrl ?? '',
        }
    })
}

const GetCurrentUserRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: UserWithMetaInformationAndProject,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}

const UpdateCurrentUserRequest = {
    schema: {
        body: Type.Object({
            profileImageUrl: Type.Union([
                Type.Null(),
                Type.String(),
            ]),
        }),
        response: {
            [StatusCodes.OK]: UserWithMetaInformationAndProject,
        },
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}
