import {
    assertNotNullOrUndefined,
    ListProjectRequestForUserQueryParams,
    PrincipalType,
    ProjectWithLimits,
    ProjectWithLimitsWithPlatform,
    SeekPage,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { userService } from '../../user/user-service'
import { platformProjectService } from './platform-project-service'

export const usersProjectController: FastifyPluginAsyncTypebox = async (
    fastify,
) => {

    fastify.get('/:id', async (request) => {
        return platformProjectService(request.log).getWithPlanAndUsageOrThrow(request.principal.projectId)
    })

    fastify.get('/', ListProjectRequestForUser, async (request) => {
        return platformProjectService(request.log).getAllForPlatform({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            cursorRequest: request.query.cursor ?? null,
            displayName: request.query.displayName,
            limit: request.query.limit ?? 10,
        })
    })

    fastify.get('/platforms', ListProjectsForPlatforms, async (request) => {
        const loggedInUser = await userService.getOneOrFail({ id: request.principal.id })
        const platforms = await getPlatformsForUser(loggedInUser.identityId, request.principal.platform.id)
        const projects = await Promise.all(platforms.map(async (platform) => {
            const platformUser = await userService.getOneByIdentityAndPlatform({ identityId: loggedInUser.identityId, platformId: platform.id })
            assertNotNullOrUndefined(platformUser, `Platform user not found for platform ${platform.id}`)
            const projects = await platformProjectService(request.log).getAllForPlatform({
                platformId: platform.id,
                userId: platformUser.id,
                cursorRequest: null,
                displayName: undefined,
                limit: 1000,
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

const ListProjectRequestForUser = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectWithLimits),
        },
        querystring: ListProjectRequestForUserQueryParams,
    },
}

const ListProjectsForPlatforms = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        response: {
            [StatusCodes.OK]: Type.Array(ProjectWithLimitsWithPlatform),
        },
    },
}
