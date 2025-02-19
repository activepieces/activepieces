import {
    ListProjectRequestForUserQueryParams,
    PrincipalType,
    ProjectWithLimits,
    SeekPage,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
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
