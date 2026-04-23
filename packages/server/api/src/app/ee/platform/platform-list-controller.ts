import {
    assertNotNullOrUndefined,
    PrincipalType,
    ProjectWithLimitsWithPlatform,
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
import { platformProjectService } from '../projects/platform-project-service'

export const platformListController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', ListProjectsForPlatforms, async (request) => {
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
                principalType: request.principal.type,
            }).then((projects) => projects.data)
            return {
                platformName: platform.name,
                projects,
            }
        }))
        return projects.flat()
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
