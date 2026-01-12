import { AppSystemProp, securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApId,
    ErrorCode,
    FileCompression,
    FileType,
    isMultipartFile,
    isNil,
    PlatformWithoutSensitiveData,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdatePlatformRequestBody,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { userIdentityRepository } from '../authentication/user-identity/user-identity-service'
import { transaction } from '../core/db/transaction'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { system } from '../helper/system/system'
import { projectRepo } from '../project/project-service'
import { userRepo, userService } from '../user/user-service'
import { platformRepo, platformService } from './platform.service'

export const platformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id', UpdatePlatformRequest, async (req, _res) => {
        const assets = [req.body.logoIcon, req.body.fullLogo, req.body.favIcon]
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/tiff', 'image/bmp', 'image/ico', 'image/webp', 'image/avif', 'image/apng']

        const [logoIconUrl, fullLogoUrl, favIconUrl] = await Promise.all(
            assets.map(async (file) => {
                if (!isNil(file) && !req.isMultipart() && !isMultipartFile(file)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: {
                            message: 'Request must be multipart/form-data',
                        },
                    })
                }

                if (isNil(file) || !isMultipartFile(file)) {
                    return undefined
                }

                if (!allowedMimeTypes.includes(file.mimetype ?? '')) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: {
                            message: 'Invalid file type',
                        },
                    })
                }

                const savedFile = await fileService(app.log).save({
                    data: file.data,
                    size: file.data.length,
                    type: FileType.PLATFORM_ASSET,
                    compression: FileCompression.NONE,
                    platformId: req.principal.platform.id,
                    fileName: file.filename,
                    metadata: {
                        platformId: req.principal.platform.id,
                        mimetype: file.mimetype ?? '',
                    },
                })
                return `${system.get(AppSystemProp.FRONTEND_URL)}/api/v1/platforms/assets/${savedFile.id}`
            }),
        )

        await platformService.update({
            id: req.params.id,
            ...req.body,
            logoIconUrl,
            fullLogoUrl,
            favIconUrl,
        })
        return platformService.getOneWithPlanAndUsageOrThrow(req.params.id)
    })

    app.get('/:id', GetPlatformRequest, async (req) => {
        if (req.principal.platform.id !== req.params.id) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'You are not authorized to access this platform',
                },
            })
        }
        return platformService.getOneWithPlanAndUsageOrThrow(req.principal.platform.id)
    })

    app.get('/assets/:id', GetAssetRequest, async (req, reply) => {
        const file = await fileService(app.log).getFileOrThrow({ fileId: req.params.id, type: FileType.PLATFORM_ASSET })
        const data = await fileService(app.log).getDataOrThrow({ fileId: req.params.id, type: FileType.PLATFORM_ASSET })

        return reply
            .header(
                'Content-Disposition',
                `attachment; filename="${encodeURI(file.fileName ?? '')}"`,
            )
            .type(file.metadata?.mimetype ?? 'application/octet-stream')
            .status(StatusCodes.OK)
            .send(data.data)
    })

}

const UpdatePlatformRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: UpdatePlatformRequestBody,
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: PlatformWithoutSensitiveData,
        },
    },
}


const GetPlatformRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['platforms'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Get a platform by id',
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: PlatformWithoutSensitiveData,
        },
    },
}

const DeletePlatformRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const GetAssetRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}