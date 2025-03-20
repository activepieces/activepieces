import { assertNotNullOrUndefined, PrincipalType, UserWithMetaInformationAndProject } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userService } from './user-service'
import { getIdentityByEmail } from '../authentication/user-identity/user-identity-service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/me', GetCurrentUserRequest, async (req): Promise<UserWithMetaInformationAndProject> => {
        const userId = req.principal.id
        assertNotNullOrUndefined(userId, 'userId')

        const user = await userService.getMetaInformation({ id: userId })
        const userIdentity = await getIdentityByEmail(user.email)
        
        return {
            id: user.id,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
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
            identityId:userIdentity?.id
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