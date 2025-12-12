import { WorkerSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    ApId,
    assertNotNullOrUndefined,
    EndpointScope,
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
import { platformMustBeOwnedByCurrentUser, platformToEditMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { stripeHelper } from '../ee/platform/platform-plan/stripe-helper'
import { fileService } from '../file/file.service'
import { flowService } from '../flows/flow/flow.service'
import { system } from '../helper/system/system'
import { projectRepo } from '../project/project-service'
import { userRepo, userService } from '../user/user-service'
import { platformRepo, platformService } from './platform.service'

const edition = system.getEdition()
export const platformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id', UpdatePlatformRequest, async (req, res) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, res)
        await platformToEditMustBeOwnedByCurrentUser.call(app, req, res)

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
                return `${system.get(WorkerSystemProp.FRONTEND_URL)}/api/v1/platforms/assets/${savedFile.id}`
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

    if (edition === ApEdition.CLOUD) {
        app.delete('/:id', DeletePlatformRequest, async (req, res) => {
            await platformMustBeOwnedByCurrentUser.call(app, req, res)
            await platformToEditMustBeOwnedByCurrentUser.call(app, req, res)
            assertNotNullOrUndefined(req.principal.platform.id, 'platformId')
            const isCloudNonEnterprisePlan = await platformPlanService(req.log).isCloudNonEnterprisePlan(req.params.id)
            if (!isCloudNonEnterprisePlan) {
                throw new ActivepiecesError({
                    code: ErrorCode.DOES_NOT_MEET_BUSINESS_REQUIREMENTS,
                    params: {
                        message: 'Platform is not eligible for deletion',
                    },
                })
            }
            const platformPlan = await platformPlanService(req.log).getOrCreateForPlatform(req.params.id)
            if (platformPlan.stripeSubscriptionId) {
                await stripeHelper(req.log).deleteCustomer(platformPlan.stripeSubscriptionId)
            }
            await flowService(req.log).deleteAllByPlatformId(req.params.id)
            await transaction(async (entityManager) => {
                await projectRepo(entityManager).delete({
                    platformId: req.params.id,
                })
                await platformRepo(entityManager).delete({
                    id: req.params.id,
                })
                const user = await userService.getOneOrFail({
                    id: req.principal.id,
                })
                await userRepo(entityManager).delete({
                    id: user.id,
                    platformId: req.params.id,
                })
                const usersUsingIdentity = await userRepo(entityManager).find({
                    where: {
                        identityId: user.identityId,
                    },
                })
                if (usersUsingIdentity.length === 0) {
                    await userIdentityRepository(entityManager).delete({
                        id: user.identityId,
                    })
                }
            })

            return res.status(StatusCodes.NO_CONTENT).send()
        })
    }
}

const UpdatePlatformRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
        scope: EndpointScope.PLATFORM,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
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
        allowedPrincipals: [PrincipalType.USER] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const GetAssetRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}