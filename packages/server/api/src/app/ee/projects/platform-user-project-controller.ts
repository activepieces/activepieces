import { securityAccess } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    PrincipalType,
    ProjectWithLimitsWithPlatform,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import Paginator from '../../helper/pagination/paginator'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { userService } from '../../user/user-service'
import { platformProjectService } from './platform-project-service'

export const usersProjectController: FastifyPluginAsyncTypebox = async (
    fastify,
) => {


    fastify.get('/platforms', ListProjectsForPlatforms, async (request) => {
        const loggedInUser = await userService.getOneOrFail({ id: request.principal.id })
        const platforms = await getPlatformsForUser(loggedInUser.identityId, request.principal.platform.id)
        const projects = await Promise.all(platforms.map(async (platform) => {
            const platformUser = await userService.getOneByIdentityAndPlatform({ identityId: loggedInUser.identityId, platformId: platform.id })
            assertNotNullOrUndefined(platformUser, `Platform user not found for platform ${platform.id}`)
            const projects = await platformProjectService(request.log).getForPlatform({
                platformId: platform.id,
                userId: platformUser.id,
                cursorRequest: null,
                displayName: undefined,
                limit: Paginator.NO_LIMIT,
                isPrivileged: userService.isUserPrivileged(platformUser),
            }).then((projects) => projects.data)
            return {
                platformName: platform.name,
                projects,
            }
        }))
        return projects.flat()
    })

}

async function getPlatformsForUser(identityId: string, platformId: string) {
    const platform = await platformService.getOneWithPlanOrThrow(platformId)
    if (platformUtils.isCustomerOnDedicatedDomain(platform)) {
        return [platform]
    }
    const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({ identityId })
    return platforms.filter((platform) => !platformUtils.isCustomerOnDedicatedDomain(platform))
}

const ListProjectsForPlatforms = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        response: {
            [StatusCodes.OK]: Type.Array(ProjectWithLimitsWithPlatform),
        },
    },
}
