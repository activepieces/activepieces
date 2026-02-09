import { securityAccess } from '@activepieces/server-shared'
import {
    AP_MAXIMUM_PROFILE_PICTURE_SIZE,
    ApId,
    ApMultipartFile,
    FileType,
    isNil,
    PrincipalType,
    PROFILE_PICTURE_ALLOWED_TYPES,
    UpdateMeResponse,
    UserWithBadges,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { fileService } from '../../file/file.service'
import { userService } from '../../user/user-service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:id', GetUserByIdRequest, async (req): Promise<UserWithBadges> => {
        const userId = req.params.id
        const platformId = req.principal.platform.id
        return userService.getOneByIdAndPlatformIdOrThrow({ id: userId, platformId })
    })

    app.post('/me', UpdateMeRequest, async (req) => {
        const userId = req.principal.id
        const user = await userService.getOrThrow({ id: userId })
        const identityId = user.identityId
        const platformId = req.principal.platform.id

        const imageUrl = await fileService(app.log).uploadPublicAsset({
            file: req.body.profilePicture,
            type: FileType.USER_PROFILE_PICTURE,
            platformId,
            allowedMimeTypes: PROFILE_PICTURE_ALLOWED_TYPES,
            maxFileSizeInBytes: AP_MAXIMUM_PROFILE_PICTURE_SIZE,
            metadata: { identityId },
        })

        if (!isNil(imageUrl)) {
            await userIdentityService(app.log).update(identityId, { imageUrl })
        }

        return userIdentityService(app.log).getBasicInformation(identityId)
    })

    app.delete('/me/profile-picture', DeleteProfilePictureRequest, async (req) => {
        const userId = req.principal.id
        const user = await userService.getOrThrow({ id: userId })
        const identityId = user.identityId

        await userIdentityService(app.log).update(identityId, { imageUrl: null })

        return { success: true }
    })

}

const GetUserByIdRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: UserWithBadges,
        },
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const UpdateMeRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        consumes: ['multipart/form-data'],
        body: Type.Object({
            profilePicture: Type.Optional(ApMultipartFile),
        }),
        response: {
            [StatusCodes.OK]: UpdateMeResponse,
        },
    },
}

const DeleteProfilePictureRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: Type.Object({
                success: Type.Boolean(),
            }),
        },
    },
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}
