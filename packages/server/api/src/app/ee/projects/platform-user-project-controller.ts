import {
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
        const userId = await userService.getOneOrFail({ id: request.principal.id })
        const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({ identityId: userId.identityId })
        const filteredPlatforms = platforms.filter((platform) => !platformUtils.isEnterpriseCustomerOnCloud(platform))
        const projects = await Promise.all(filteredPlatforms.map(async (platform) => {
            const projects = await platformProjectService(request.log).getAllForPlatform({
                platformId: platform.id,
                userId: request.principal.id,
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
