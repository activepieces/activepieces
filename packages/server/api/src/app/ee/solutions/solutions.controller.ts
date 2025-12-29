import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { ExportRequestBody, PrincipalType, Solution, SolutionRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { solutionService } from './solution.service'

export const solutionsController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/export', ExportRequest, async (request) => {
        const { name, description } = request.body
        return solutionService(fastify.log).export({
            projectId: request.projectId,
            name,
            description,
        })
    })

    fastify.post('/import', ImportRequest, async (request) => {
        return solutionService(fastify.log).import({
            solution: request.body as Solution,
            projectId: request.projectId,
            platformId: request.principal.platform.id,
        })
    })
}


const ExportRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.BODY,
        }),
    },
    schema: {
        body: ExportRequestBody,
        response: {
            [StatusCodes.CREATED]: Solution,
        },
    },
}

const ImportRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.BODY,
        }),
    },
    schema: {
        body: SolutionRequestBody,
    },
}
