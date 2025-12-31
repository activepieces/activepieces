import { securityAccess } from '@activepieces/server-shared'
import { ApId, PrincipalType, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userService } from '../../user/user-service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:id', GetUserByIdRequest, async (req): Promise<UserWithMetaInformation> => {
        const userId = req.params.id
        const platformId = req.principal.platform.id
        return userService.getOneByIdAndPlatformIdOrThrow({ id: userId, platformId })
    })
}

const GetUserByIdRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: UserWithMetaInformation,
        },
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}