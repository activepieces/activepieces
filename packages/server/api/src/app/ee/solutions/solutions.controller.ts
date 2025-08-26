import { ExportRequestBody, PrincipalType, Solution } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { solutionService } from './solution.service'

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
            solution: request.body as Solution,
            projectId: request.principal.projectId,
            platformId: request.principal.platform.id,
        })
    })
}


const ExportRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
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
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        body: Solution,
    },
}
