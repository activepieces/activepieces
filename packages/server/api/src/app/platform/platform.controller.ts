import { apDayjs } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    ApEdition,
    ApId,
    assertNotNullOrUndefined,
    AuthenticationResponse,
    CreatePlatformRequest,
    ErrorCode,
    FileType,
    PlatformWithoutSensitiveData,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdatePlatformRequestBody,
    UserStatus,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { platformToEditMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { stripeHelper } from '../ee/platform/platform-plan/stripe-helper'
import { platformProjectService } from '../ee/projects/platform-project-service'
import { fileService } from '../file/file.service'
import { system } from '../helper/system/system'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { userIdentityHelper } from '../helper/user-identity-helper'
import { projectService } from '../project/project-service'
import { userRepo, userService } from '../user/user-service'
import { platformService } from './platform.service'

const edition = system.getEdition()
export const platformController: FastifyPluginAsyncZod = async (app) => {
    app.post('/', CreatePlatformEndpoint, async (req) => {
        const isOnboarding = req.principal.type === PrincipalType.ONBOARDING
        const identityId = isOnboarding
            ? req.principal.id
            : (await userService(req.log).getOneOrFail({ id: req.principal.id })).identityId
        return platformService(req.log).createPlatformWithProject({
            identityId,
            name: req.body.name,
            invalidatePreviousTokens: isOnboarding,
        })
    })

    app.post('/:id', UpdatePlatformRequest, async (req, _res) => {
        if (req.principal.platform.id !== req.params.id) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'You are not authorized to access this platform',
                },
            })
        }
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

        await platformService(req.log).update({
            id: platformId,
            ...req.body,
            logoIconUrl,
            fullLogoUrl,
            favIconUrl,
        })
        return platformService(req.log).getOneWithPlanAndUsageOrThrow(platformId)
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
        const platform = await platformService(req.log).getOneWithPlanAndUsageOrThrow(req.principal.platform.id)
        if (req.principal.type === PrincipalType.USER) {
            const isEmbedded = await userIdentityHelper(req.log).isUserEmbedded(req.principal.id)
            if (isEmbedded) {
                return {
                    ...platform,
                    plan: {
                        ...platform.plan,
                        licenseKey: null,
                    },
                }
            }
        }
        return platform
    })

    app.get('/assets/:id', GetAssetRequest, async (req, reply) => {
        const { fileName, metadata, data } = await fileService(app.log).getDataOrThrow({
            fileId: req.params.id,
            type: [FileType.PLATFORM_ASSET, FileType.USER_PROFILE_PICTURE],
        })

        return reply
            .header(
                'Content-Disposition',
                `attachment; filename="${encodeURI(fileName ?? '')}"`,
            )
            .type(metadata?.mimetype ?? 'application/octet-stream')
            .status(StatusCodes.OK)
            .send(data)
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

            const platformId = req.params.id

            const user = await userService(req.log).getOneOrFail({
                id: req.principal.id,
            })

            await userRepo().update(
                { id: user.id, platformId },
                { status: UserStatus.INACTIVE },
            )

            const projectIds = await projectService(req.log).getProjectIdsByPlatform(platformId)
            await Promise.all(
                projectIds.map((projectId) =>
                    platformProjectService(req.log).markForDeletion({
                        id: projectId,
                        platformId,
                    }),
                ),
            )

            await systemJobsSchedule(req.log).upsertJob({
                job: {
                    name: SystemJobName.HARD_DELETE_PLATFORM,
                    data: {
                        platformId,
                        userId: user.id,
                        identityId: user.identityId,
                    },
                    jobId: `hard-delete-platform-${platformId}`,
                },
                schedule: {
                    type: 'one-time',
                    date: apDayjs(),
                },
                customConfig: {
                    attempts: 25,
                    backoff: {
                        type: 'fixed',
                        delay: 60000,
                    },
                },
            })

            return res.status(StatusCodes.NO_CONTENT).send()
        })
    }
}

const CreatePlatformEndpoint = {
    config: {
        security: securityAccess.unscoped([PrincipalType.ONBOARDING, PrincipalType.USER]),
    },
    schema: {
        body: CreatePlatformRequest,
        response: {
            [StatusCodes.OK]: AuthenticationResponse,
        },
    },
}

const UpdatePlatformRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: UpdatePlatformRequestBody,
        params: z.object({
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
        params: z.object({
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
        params: z.object({
            id: ApId,
        }),
    },
}

const GetAssetRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}

