import { assertNotNullOrUndefined, PrincipalType, UserWithMetaInformationAndProject } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
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