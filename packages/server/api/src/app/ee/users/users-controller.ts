import { securityAccess, WorkerSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApId,
    ApMultipartFile,
    ErrorCode,
    FileCompression,
    FileType,
    isMultipartFile,
    isNil,
    PrincipalType,
    UserWithBadges,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { userService } from '../../user/user-service'

export const usersController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:id', GetUserByIdRequest, async (req): Promise<UserWithBadges> => {
        const userId = req.params.id
        const platformId = req.principal.platform.id
        return userService.getOneByIdAndPlatformIdOrThrow({ id: userId, platformId })
    })

    app.post('/me/profile-picture', UploadProfilePictureRequest, async (req) => {
        const userId = req.principal.id
        const user = await userService.getOrThrow({ id: userId })
        const identityId = user.identityId

        const file = req.body.file
        if (isNil(file) || !isMultipartFile(file)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'File is required',
                },
            })
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedMimeTypes.includes(file.mimetype ?? '')) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP',
                },
            })
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.data.length > maxSize) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'File size exceeds 5MB limit',
                },
            })
        }

        const savedFile = await fileService(app.log).save({
            data: file.data,
            size: file.data.length,
            type: FileType.USER_PROFILE_PICTURE,
            compression: FileCompression.NONE,
            platformId: req.principal.platform.id,
            fileName: file.filename,
            metadata: {
                identityId,
                mimetype: file.mimetype ?? '',
            },
        })

        const imageUrl = `${system.get(WorkerSystemProp.FRONTEND_URL)}/api/v1/users/profile-pictures/${savedFile.id}`

        await userIdentityService(app.log).updateImageUrl({
            id: identityId,
            imageUrl,
        })

        return { imageUrl }
    })

    app.delete('/me/profile-picture', DeleteProfilePictureRequest, async (req) => {
        const userId = req.principal.id
        const user = await userService.getOrThrow({ id: userId })
        const identityId = user.identityId

        await userIdentityService(app.log).updateImageUrl({
            id: identityId,
            imageUrl: null,
        })

        return { success: true }
    })

    app.get('/profile-pictures/:id', GetProfilePictureRequest, async (req, reply) => {
        const file = await fileService(app.log).getFileOrThrow({ fileId: req.params.id, type: FileType.USER_PROFILE_PICTURE })
        const data = await fileService(app.log).getDataOrThrow({ fileId: req.params.id, type: FileType.USER_PROFILE_PICTURE })

        return reply
            .header(
                'Content-Disposition',
                `inline; filename="${encodeURI(file.fileName ?? '')}"`,
            )
            .header('Cache-Control', 'public, max-age=86400')
            .type(file.metadata?.mimetype ?? 'image/jpeg')
            .status(StatusCodes.OK)
            .send(data.data)
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

const UploadProfilePictureRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        consumes: ['multipart/form-data'],
        body: Type.Object({
            file: ApMultipartFile,
        }),
        response: {
            [StatusCodes.OK]: Type.Object({
                imageUrl: Type.String(),
            }),
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

const GetProfilePictureRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
    config: {
        security: securityAccess.public(),
    },
}