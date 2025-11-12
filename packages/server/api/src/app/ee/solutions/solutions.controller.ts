import { ExportRequestBody, ImportRequestBody, Permission, PrincipalType, Solution } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { solutionService } from './solution.service'
import { projectAccess, ProjectResourceType } from '@activepieces/server-shared'

export const solutionsController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post('/export', ExportRequest, async (request) => {
        const { name, description } = request.body
        return solutionService(fastify.log).export({
            projectId: request.principal.projectId,
            name,
            description,
        })
    })

    fastify.post('/import', ImportRequest, async (request) => {
        return solutionService(fastify.log).import({
            solution: request.body.solution,
            projectId: request.principal.projectId,
            platformId: request.principal.platform.id,
        })
    })
}


const ExportRequest = {
    config: {
        security: projectAccess([PrincipalType.USER], Permission.READ_PROJECT_RELEASE, {
            type: ProjectResourceType.BODY,
        })
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
        security: projectAccess([PrincipalType.USER], Permission.WRITE_PROJECT_RELEASE, {
            type: ProjectResourceType.BODY,
        })
    },
    schema: {
        body: ImportRequestBody,
    },
}
