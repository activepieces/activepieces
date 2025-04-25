/*
This is a custom implementation to support platform projects with access control and other features.
The logic has been isolated to this file to avoid potential conflicts with the open-source modules from upstream
*/

import { assertNotNullOrUndefined, ListProjectRequestForUserQueryParams, PrincipalType, Project, ProjectsWithPlatform, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { platformProjectService } from './platform-project.service'

export const userPlatformProjectController: FastifyPluginAsyncTypebox = async (fastify) => {
    // Overrides the same endpoint handler in the open source counter-part
    fastify.get('/:id', async (request) => {
        return platformProjectService(request.log).getWithPlanAndUsageOrThrow(request.principal.projectId)
    })

    // Overrides the same endpoint handler in the open source counter-part
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
        const user = await userService.getOneOrFail({ id: request.principal.id })
        const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({ identityId: user.identityId })
        const projectsWithPlatform = await Promise.all(platforms.map(async (platform) => {
            const platformUser = await userService.getOneByIdentityAndPlatform({ identityId: user.identityId, platformId: platform.id })
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
        return projectsWithPlatform.flat()
    })
}

const ListProjectRequestForUser = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(Project),
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
            [StatusCodes.OK]: Type.Array(ProjectsWithPlatform),
        },
    },
}

