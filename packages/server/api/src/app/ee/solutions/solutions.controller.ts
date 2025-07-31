import { ExportRequestQuery, PrincipalType, Solution } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { solutionService } from './solution.service'

export const solutionsController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/export', ExportRequest, async (request) => {
        return solutionService(fastify.log).export({
            projectId: request.principal.projectId,
            name: request.query.name,
            description: request.query.description,
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
        querystring: ExportRequestQuery,
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
        body: Type.Any(),
    },
}
