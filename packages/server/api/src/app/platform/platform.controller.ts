import { securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    ApId,
    assertNotNullOrUndefined,
    ErrorCode,
    FileType,
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
import { platformToEditMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
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
    app.post('/:id', UpdatePlatformRequest, async (req, _res) => {
        const platformId = req.principal.platform.id

        const [logoIconUrl, fullLogoUrl, favIconUrl] = await Promise.all([
            fileService(app.log).uploadPublicAsset({
                file: req.body.logoIcon,
                type: FileType.PLATFORM_ASSET,
                platformId,
                metadata: { platformId },
            }),
            fileService(app.log).uploadPublicAsset({
                file: req.body.fullLogo,
                type: FileType.PLATFORM_ASSET,
                platformId,
                metadata: { platformId },
            }),
            fileService(app.log).uploadPublicAsset({
                file: req.body.favIcon,
                type: FileType.PLATFORM_ASSET,
                platformId,
                metadata: { platformId },
            }),
        ])

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
        const [file, data] = await Promise.all([
            fileService(app.log).getFileOrThrow({ fileId: req.params.id }),
            fileService(app.log).getDataOrThrow({ fileId: req.params.id })])

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