import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
    ListProjectsByUserQueryParams,
    PrincipalType,
    ProjectWithLimits,
    ProjectWithLimitsWithPlatform,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import Paginator from '../../helper/pagination/paginator'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { userService } from '../../user/user-service'
import { platformProjectService } from './platform-project-service'

const DEFAULT_LIMIT_SIZE = 50

export const usersProjectController: FastifyPluginAsyncZod = async (
    fastify,
) => {
    fastify.get('/platforms', ListProjectsForPlatforms, async (request) => {
        const loggedInUser = await userService(request.log).getOneOrFail({ id: request.principal.id })
        const platforms = await getPlatformsForUser(loggedInUser.identityId, request.principal.platform.id, request.log)
        const projects = await Promise.all(platforms.map(async (platform) => {
            const platformUser = await userService(request.log).getOneByIdentityAndPlatform({ identityId: loggedInUser.identityId, platformId: platform.id })
            assertNotNullOrUndefined(platformUser, `Platform user not found for platform ${platform.id}`)
            const projects = await platformProjectService(request.log).getForPlatform({
                platformId: platform.id,
                userId: platformUser.id,
                cursorRequest: null,
                displayName: undefined,
                limit: Paginator.NO_LIMIT,
                isPrivileged: userService(request.log).isUserPrivileged(platformUser),
            }).then((projects) => projects.data)
            return {
                platformName: platform.name,
                projects,
            }
        }))
        return projects.flat()
    })

    fastify.get('/', ListProjectsByUserRequest, async (request) => {
        const platformId = request.principal.platform.id
        const targetUser = await userService(request.log).getByPlatformAndExternalId({
            platformId,
            externalId: request.query.externalId,
        })
        if (isNil(targetUser)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'user', entityId: request.query.externalId },
            })
        }
        const isPrivileged = userService(request.log).isUserPrivileged(targetUser)
        return platformProjectService(request.log).getForPlatform({
            platformId,
            cursorRequest: request.query.cursor ?? null,
            displayName: request.query.displayName,
            types: request.query.types,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
            userId: targetUser.id,
            isPrivileged,
        })
    })
}

async function getPlatformsForUser(identityId: string, platformId: string, log: FastifyBaseLogger) {
    const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
    if (platformUtils.isCustomerOnDedicatedDomain(platform)) {
        return [platform]
    }
    const platforms = await platformService(log).listPlatformsForIdentityWithAtleastProject({ identityId })
    return platforms.filter((platform) => !platformUtils.isCustomerOnDedicatedDomain(platform))
}

const ListProjectsForPlatforms = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: z.array(ProjectWithLimitsWithPlatform),
        },
    },
}

const ListProjectsByUserRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['users'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListProjectsByUserQueryParams,
        response: {
            [StatusCodes.OK]: SeekPage(ProjectWithLimits),
        },
    },
}
